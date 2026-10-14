import type { JWSTransactionDecodedPayload } from "@apple/app-store-server-library";
import { parseCombinedLookupKey } from "@/config/scholars-credits";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAppleTransaction } from "@/lib/subscriptions/apple";
import {
  calendarPeriodKey,
  getScholarsCreditBalanceForChild,
  grantScholarsCredits,
  type ScholarsCreditBalance,
} from "@/lib/scholars/credits";

type CreditAmounts = { generations: number; tutorMinutes: number };

type AppleCreditProduct = CreditAmounts & {
  /** Recurring products grant once per calendar month while the subscription is active. */
  recurring: boolean;
  /** Plan subscriptions grant a monthly allotment; only the best active plan counts. */
  planRank?: number;
};

/** Monthly allotment that comes with each Scholars plan subscription. */
const PLAN_ALLOTMENTS: Record<string, CreditAmounts & { rank: number }> = {
  "com.scholarsnotes.studyguide.monthly": { rank: 1, generations: 15, tutorMinutes: 0 },
  "com.scholarsnotes.tutor.monthly": { rank: 2, generations: 5, tutorMinutes: 40 },
  "com.scholarsnotes.full.monthly": { rank: 3, generations: 15, tutorMinutes: 45 },
};

const LEGACY_PACKS: Record<string, CreditAmounts> = {
  "com.scholarsnotes.gens.10": { generations: 10, tutorMinutes: 0 },
  "com.scholarsnotes.gens.25": { generations: 25, tutorMinutes: 0 },
  "com.scholarsnotes.gens.60": { generations: 60, tutorMinutes: 0 },
  "com.scholarsnotes.tutor.min.30": { generations: 0, tutorMinutes: 30 },
  "com.scholarsnotes.tutor.min.90": { generations: 0, tutorMinutes: 90 },
  "com.scholarsnotes.tutor.min.180": { generations: 0, tutorMinutes: 180 },
};

export function appleCreditProduct(productId: string): AppleCreditProduct | null {
  const plan = PLAN_ALLOTMENTS[productId];
  if (plan) {
    return {
      generations: plan.generations,
      tutorMinutes: plan.tutorMinutes,
      recurring: true,
      planRank: plan.rank,
    };
  }

  const combined = parseCombinedLookupKey(productId);
  if (combined) {
    return {
      generations: combined.generations,
      tutorMinutes: combined.tutorMinutes,
      recurring: combined.period === "monthly" || combined.period === "yearly",
    };
  }

  const pack = LEGACY_PACKS[productId];
  if (pack) return { ...pack, recurring: false };

  const legacy = /^com\.scholarsnotes\.(gens|tutor\.min)\.(\d+)\.(once|refill|monthly|yearly)$/.exec(
    productId,
  );
  if (legacy) {
    const quantity = Number(legacy[2]);
    return {
      generations: legacy[1] === "gens" ? quantity : 0,
      tutorMinutes: legacy[1] === "gens" ? 0 : quantity,
      recurring: legacy[3] === "monthly" || legacy[3] === "yearly",
    };
  }
  return null;
}

type ScholarsCreditContext = {
  perk: { generations: number; tutor_minutes: number } | null;
  creator_bonus_pct: number | null;
};

/** Perk + creator-code bonus live in the Scholars database; ask scholarsnote.com. */
async function fetchScholarsCreditContext(
  email: string | null,
  creatorCode: string | null,
): Promise<ScholarsCreditContext> {
  const empty: ScholarsCreditContext = { perk: null, creator_bonus_pct: null };
  const secret =
    process.env.BILLING_ATTRIBUTION_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!email || !secret) return empty;
  const base = (
    process.env.SCHOLARS_WEB_URL?.trim() || "https://scholarsnote.com"
  ).replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/billing/credit-context`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, creator_code: creatorCode ?? undefined }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[scholars-wallet] credit-context failed", res.status);
      return empty;
    }
    return (await res.json()) as ScholarsCreditContext;
  } catch (error) {
    console.warn("[scholars-wallet] credit-context error", error);
    return empty;
  }
}

async function grantAmounts(params: {
  userId: string;
  amounts: CreditAmounts;
  lookupKey: string;
  periodKey: string;
  externalRef?: string | null;
  reason: string;
}): Promise<boolean> {
  let applied = false;
  const parts: Array<["generations" | "tutor_minutes", number]> = [
    ["generations", params.amounts.generations],
    ["tutor_minutes", params.amounts.tutorMinutes],
  ];
  for (const [kind, quantity] of parts) {
    if (quantity <= 0) continue;
    const result = await grantScholarsCredits({
      childUserId: params.userId,
      parentUserId: params.userId,
      kind,
      quantity,
      periodKey: params.periodKey,
      lookupKey: `${params.lookupKey}.${kind}`,
      externalRef: params.externalRef ?? null,
      reason: params.reason,
    });
    if (result.outcome === "applied") applied = true;
  }
  return applied;
}

async function grantedThisPeriod(
  userId: string,
  lookupPrefix: string,
  periodKey: string,
): Promise<CreditAmounts> {
  const { data } = await createAdminClient()
    .from("scholars_credit_grants")
    .select("kind, quantity")
    .eq("child_user_id", userId)
    .eq("period_key", periodKey)
    .like("lookup_key", `${lookupPrefix}%`);
  const total: CreditAmounts = { generations: 0, tutorMinutes: 0 };
  for (const row of data ?? []) {
    if (row.kind === "generations") total.generations += Number(row.quantity) || 0;
    else total.tutorMinutes += Number(row.quantity) || 0;
  }
  return total;
}

async function hasGrantWithLookupPrefix(userId: string, prefix: string): Promise<boolean> {
  const { count } = await createAdminClient()
    .from("scholars_credit_grants")
    .select("id", { count: "exact", head: true })
    .eq("child_user_id", userId)
    .like("lookup_key", `${prefix}%`);
  return (count ?? 0) > 0;
}

async function hasEarlierApplePurchase(userId: string, transactionId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("scholars_credit_grants")
    .select("external_ref")
    .eq("child_user_id", userId)
    .like("external_ref", "apple:%")
    .limit(50);
  return (data ?? []).some((row) => !String(row.external_ref).startsWith(`apple:${transactionId}`));
}

/** Matches the app's bonus preview: rounded, at least 1 when the base is non-zero. */
function bonusOf(amounts: CreditAmounts, pct: number): CreditAmounts {
  const part = (base: number) => (base > 0 ? Math.max(1, Math.round((base * pct) / 100)) : 0);
  return { generations: part(amounts.generations), tutorMinutes: part(amounts.tutorMinutes) };
}

export type TransactionSyncResult = {
  transaction_id: string | null;
  product_id: string | null;
  status: "granted" | "already_granted" | "inactive" | "other_account" | "not_credit" | "invalid";
  error?: string;
};

export type WalletSyncInput = {
  userId: string;
  email: string | null;
  signedTransactions: string[];
  creatorCode?: string | null;
};

/**
 * Brings one Genlyn account's Scholars wallet up to date: verified App Store purchases,
 * the monthly plan allotment, and the creator perk.
 */
export async function syncScholarsWallet(input: WalletSyncInput): Promise<{
  balance: ScholarsCreditBalance;
  transactions: TransactionSyncResult[];
}> {
  const { userId } = input;
  const month = calendarPeriodKey();
  const now = Date.now();
  const context = await fetchScholarsCreditContext(input.email, input.creatorCode ?? null);
  const results: TransactionSyncResult[] = [];

  let bestPlan: (CreditAmounts & { rank: number }) | null = null;
  const firstPurchases: Array<{ transactionId: string; amounts: CreditAmounts }> = [];

  for (const signed of input.signedTransactions.slice(0, 50)) {
    let tx: JWSTransactionDecodedPayload;
    try {
      tx = await verifyAppleTransaction("scholars", signed);
    } catch (error) {
      results.push({
        transaction_id: null,
        product_id: null,
        status: "invalid",
        error: error instanceof Error ? error.message : "verification failed",
      });
      continue;
    }

    const transactionId = tx.transactionId ?? null;
    const productId = tx.productId ?? null;
    const base = { transaction_id: transactionId, product_id: productId };
    const product = productId ? appleCreditProduct(productId) : null;
    if (!transactionId || !productId || !product) {
      results.push({ ...base, status: "not_credit" });
      continue;
    }
    if (tx.appAccountToken && tx.appAccountToken.toLowerCase() !== userId.toLowerCase()) {
      results.push({ ...base, status: "other_account" });
      continue;
    }
    if (tx.revocationDate) {
      results.push({ ...base, status: "inactive" });
      continue;
    }

    if (product.planRank) {
      if (tx.expiresDate && tx.expiresDate < now) {
        results.push({ ...base, status: "inactive" });
        continue;
      }
      if (!bestPlan || product.planRank > bestPlan.rank) {
        bestPlan = { rank: product.planRank, generations: product.generations, tutorMinutes: product.tutorMinutes };
      }
      if (transactionId === tx.originalTransactionId) {
        firstPurchases.push({ transactionId, amounts: product });
      }
      results.push({ ...base, status: "granted" });
      continue;
    }

    let applied: boolean;
    if (product.recurring) {
      if (tx.expiresDate && tx.expiresDate < now) {
        results.push({ ...base, status: "inactive" });
        continue;
      }
      const original = tx.originalTransactionId ?? transactionId;
      applied = await grantAmounts({
        userId,
        amounts: product,
        lookupKey: productId,
        periodKey: `${month}:apple:${original}`,
        externalRef: `apple:${original}:${month}`,
        reason: "app_store_plan",
      });
    } else {
      applied = await grantAmounts({
        userId,
        amounts: product,
        lookupKey: productId,
        periodKey: `apple:${transactionId}`,
        externalRef: `apple:${transactionId}`,
        reason: "app_store_purchase",
      });
    }
    if (applied && transactionId === tx.originalTransactionId) {
      firstPurchases.push({ transactionId, amounts: product });
    }
    results.push({ ...base, status: applied ? "granted" : "already_granted" });
  }

  // Plan allotment: the best active plan's amounts each month; an upgrade tops up the difference.
  if (bestPlan) {
    const already = await grantedThisPeriod(userId, "scholars.plan_allotment", month);
    await grantAmounts({
      userId,
      amounts: {
        generations: Math.max(0, bestPlan.generations - already.generations),
        tutorMinutes: Math.max(0, bestPlan.tutorMinutes - already.tutorMinutes),
      },
      lookupKey: `scholars.plan_allotment.r${bestPlan.rank}`,
      periodKey: month,
      reason: "plan_allotment",
    });
  }

  // Creator-code extra credits: first App Store purchase on this account only.
  const bonusPct = context.creator_bonus_pct;
  if (bonusPct && firstPurchases.length > 0) {
    const first = firstPurchases[0];
    const eligible =
      !(await hasGrantWithLookupPrefix(userId, "scholars.creator_bonus")) &&
      !(await hasEarlierApplePurchase(userId, first.transactionId));
    if (eligible) {
      await grantAmounts({
        userId,
        amounts: bonusOf(first.amounts, bonusPct),
        lookupKey: "scholars.creator_bonus",
        periodKey: "once",
        externalRef: `apple-bonus:${first.transactionId}`,
        reason: "creator_code_bonus",
      });
    }
  }

  if (context.perk) {
    await grantAmounts({
      userId,
      amounts: { generations: context.perk.generations, tutorMinutes: context.perk.tutor_minutes },
      lookupKey: "comp.creator.perk",
      periodKey: month,
      reason: "creator_perk",
    });
  }

  return {
    balance: await getScholarsCreditBalanceForChild(userId),
    transactions: results,
  };
}
