import {
  CREATOR_COMMISSION_RATE,
  commissionCents,
  isValidCreatorCodeFormat,
  normalizeCreatorCode,
  suggestCreatorCode,
} from "@/config/creators";
import {
  createGlobalRecipient,
  createRecipientOnboardingLink,
  isGlobalRecipientAccount,
  recipientReady,
  retrieveGlobalRecipient,
  sendGlobalOutboundPayment,
} from "@/lib/creators/global-payouts";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreatorStatus =
  | "pending"
  | "onboarding"
  | "active"
  | "paused"
  | "rejected";

export interface GenlynCreator {
  id: string;
  user_id: string;
  code: string;
  display_name: string | null;
  status: CreatorStatus;
  stripe_connect_account_id: string | null;
  payouts_enabled: boolean;
  details_submitted: boolean;
  total_referred_users: number;
  total_gross_cents: number;
  total_commission_cents: number;
  total_paid_cents: number;
  created_at: string;
  updated_at: string;
}

export interface CreatorReferral {
  id: string;
  buyer_user_id: string;
  creator_id: string;
  creator_code: string;
  source: string | null;
  created_at: string;
}

export interface CreatorCommission {
  id: string;
  creator_id: string;
  buyer_user_id: string | null;
  source: "subscription" | "hub" | "other";
  gross_cents: number;
  commission_cents: number;
  currency: string;
  status: "pending" | "transferred" | "failed" | "reversed";
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  stripe_transfer_id: string | null;
  hub_order_id: string | null;
  description: string | null;
  error_message: string | null;
  created_at: string;
  transferred_at: string | null;
}

export function isCreatorAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.HUB_ADMIN_EMAILS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}

export async function getCreatorByUserId(
  userId: string,
): Promise<GenlynCreator | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("genlyn_creators")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as GenlynCreator | null) ?? null;
}

export async function getCreatorByCode(
  code: string,
): Promise<GenlynCreator | null> {
  const normalized = normalizeCreatorCode(code);
  if (!isValidCreatorCodeFormat(normalized)) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("genlyn_creators")
    .select("*")
    .eq("code", normalized)
    .in("status", ["active", "onboarding"])
    .maybeSingle();
  return (data as GenlynCreator | null) ?? null;
}

export async function ensureCreatorForUser(options: {
  userId: string;
  email?: string | null;
  name?: string | null;
}): Promise<GenlynCreator> {
  const existing = await getCreatorByUserId(options.userId);
  if (existing) return existing;

  const admin = createAdminClient();
  let code = suggestCreatorCode(options.name || options.email || "GEN");
  for (let attempt = 0; attempt < 24; attempt++) {
    const { data: clash } = await admin
      .from("genlyn_creators")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!clash) break;
    code = suggestCreatorCode(options.name || options.email || "GEN");
    if (attempt === 23) {
      throw new Error("Could not allocate a unique creator code");
    }
  }

  const { data, error } = await admin
    .from("genlyn_creators")
    .insert({
      user_id: options.userId,
      code,
      display_name: options.name?.trim() || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create creator profile");
  }
  return data as GenlynCreator;
}

/** Stripe Global Payouts recipient onboarding (hosted bank details form). */
export async function startConnectOnboarding(options: {
  creator: GenlynCreator;
  email?: string | null;
  returnOrigin: string;
}): Promise<{ url: string; creator: GenlynCreator }> {
  const admin = createAdminClient();
  let accountId = options.creator.stripe_connect_account_id;

  // Drop legacy Connect Express accounts — creators use Global Payouts recipients only.
  if (accountId && !(await isGlobalRecipientAccount(accountId))) {
    accountId = null;
    await admin
      .from("genlyn_creators")
      .update({
        stripe_connect_account_id: null,
        payouts_enabled: false,
        details_submitted: false,
        status: "onboarding",
      })
      .eq("id", options.creator.id);
  }

  if (!accountId) {
    const recipient = await createGlobalRecipient({
      email: options.email,
      displayName: options.creator.display_name,
      country: "us",
      metadata: {
        genlyn_creator_id: options.creator.id,
        genlyn_user_id: options.creator.user_id,
        genlyn_code: options.creator.code,
      },
    });
    if (!(await isGlobalRecipientAccount(recipient.id))) {
      throw new Error(
        "Stripe did not create a Global Payouts recipient. Enable Global Payouts / Accounts v2 on this Stripe account.",
      );
    }
    accountId = recipient.id;
    await admin
      .from("genlyn_creators")
      .update({
        stripe_connect_account_id: accountId,
        status: "onboarding",
      })
      .eq("id", options.creator.id);
  }

  const link = await createRecipientOnboardingLink({
    accountId,
    refreshUrl: `${options.returnOrigin}/creator?payouts=refresh`,
    returnUrl: `${options.returnOrigin}/creator?payouts=return`,
  });

  const refreshed = await getCreatorByUserId(options.creator.user_id);
  return { url: link.url, creator: refreshed ?? options.creator };
}

export async function syncConnectAccountStatus(
  creator: GenlynCreator,
): Promise<GenlynCreator> {
  if (!creator.stripe_connect_account_id) return creator;

  let recipient;
  try {
    recipient = await retrieveGlobalRecipient(creator.stripe_connect_account_id);
  } catch {
    // Legacy Connect Express id — clear so they re-onboard via Global Payouts
    const admin = createAdminClient();
    const { data } = await admin
      .from("genlyn_creators")
      .update({
        stripe_connect_account_id: null,
        payouts_enabled: false,
        details_submitted: false,
        status: "pending",
      })
      .eq("id", creator.id)
      .select("*")
      .single();
    return (data as GenlynCreator) ?? creator;
  }

  const ready = recipientReady(recipient);
  const status: CreatorStatus =
    ready.payoutsEnabled && ready.detailsSubmitted
      ? "active"
      : ready.detailsSubmitted
        ? "onboarding"
        : creator.status === "pending"
          ? "pending"
          : "onboarding";

  const admin = createAdminClient();
  const { data } = await admin
    .from("genlyn_creators")
    .update({
      payouts_enabled: ready.payoutsEnabled,
      details_submitted: ready.detailsSubmitted,
      status,
    })
    .eq("id", creator.id)
    .select("*")
    .single();

  return (data as GenlynCreator) ?? creator;
}

/** Sticky: first successful code attribution wins. */
export async function attachReferral(options: {
  buyerUserId: string;
  creatorCode: string;
  source?: string;
}): Promise<GenlynCreator | null> {
  const creator = await getCreatorByCode(options.creatorCode);
  if (!creator || creator.status === "rejected" || creator.status === "paused") {
    return null;
  }
  if (creator.user_id === options.buyerUserId) return null;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("creator_referrals")
    .select("*")
    .eq("buyer_user_id", options.buyerUserId)
    .maybeSingle();
  if (existing) {
    const { data: current } = await admin
      .from("genlyn_creators")
      .select("*")
      .eq("id", existing.creator_id)
      .maybeSingle();
    return (current as GenlynCreator | null) ?? null;
  }

  const { error } = await admin.from("creator_referrals").insert({
    buyer_user_id: options.buyerUserId,
    creator_id: creator.id,
    creator_code: creator.code,
    source: options.source ?? null,
  });
  if (error) {
    // Race: another insert won
    const { data: again } = await admin
      .from("creator_referrals")
      .select("creator_id")
      .eq("buyer_user_id", options.buyerUserId)
      .maybeSingle();
    if (again) {
      const { data: current } = await admin
        .from("genlyn_creators")
        .select("*")
        .eq("id", again.creator_id)
        .maybeSingle();
      return (current as GenlynCreator | null) ?? null;
    }
    throw new Error(error.message);
  }

  await admin
    .from("genlyn_creators")
    .update({
      total_referred_users: creator.total_referred_users + 1,
    })
    .eq("id", creator.id);

  return creator;
}

export async function getReferralForBuyer(
  buyerUserId: string,
): Promise<CreatorReferral | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("creator_referrals")
    .select("*")
    .eq("buyer_user_id", buyerUserId)
    .maybeSingle();
  return (data as CreatorReferral | null) ?? null;
}

export async function recordCommissionAndTransfer(options: {
  creatorId: string;
  buyerUserId: string | null;
  source: "subscription" | "hub" | "other";
  grossCents: number;
  currency?: string;
  stripePaymentIntentId?: string | null;
  stripeInvoiceId?: string | null;
  stripeSubscriptionId?: string | null;
  hubOrderId?: string | null;
  description?: string;
}): Promise<CreatorCommission | null> {
  if (options.grossCents <= 0) return null;

  const admin = createAdminClient();
  const { data: creator } = await admin
    .from("genlyn_creators")
    .select("*")
    .eq("id", options.creatorId)
    .maybeSingle();
  if (!creator) return null;

  const amount = commissionCents(options.grossCents);
  if (amount <= 0) return null;

  const insert = {
    creator_id: options.creatorId,
    buyer_user_id: options.buyerUserId,
    source: options.source,
    gross_cents: options.grossCents,
    commission_cents: amount,
    currency: options.currency ?? "usd",
    status: "pending" as const,
    stripe_payment_intent_id: options.stripePaymentIntentId ?? null,
    stripe_invoice_id: options.stripeInvoiceId ?? null,
    stripe_subscription_id: options.stripeSubscriptionId ?? null,
    hub_order_id: options.hubOrderId ?? null,
    description:
      options.description ??
      `${Math.round(CREATOR_COMMISSION_RATE * 100)}% commission`,
  };

  const { data: row, error } = await admin
    .from("creator_commissions")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    // Idempotent on unique invoice/PI
    if (options.stripeInvoiceId) {
      const { data: existing } = await admin
        .from("creator_commissions")
        .select("*")
        .eq("stripe_invoice_id", options.stripeInvoiceId)
        .maybeSingle();
      return (existing as CreatorCommission | null) ?? null;
    }
    if (options.stripePaymentIntentId) {
      const { data: existing } = await admin
        .from("creator_commissions")
        .select("*")
        .eq("stripe_payment_intent_id", options.stripePaymentIntentId)
        .maybeSingle();
      return (existing as CreatorCommission | null) ?? null;
    }
    throw new Error(error.message);
  }

  const commission = row as CreatorCommission;

  await admin
    .from("genlyn_creators")
    .update({
      total_gross_cents: Number(creator.total_gross_cents) + options.grossCents,
      total_commission_cents:
        Number(creator.total_commission_cents) + amount,
    })
    .eq("id", options.creatorId);

  // Pay out via Stripe Global Payouts (OutboundPayment) when recipient is ready
  if (creator.stripe_connect_account_id && creator.payouts_enabled) {
    try {
      const payment = await sendGlobalOutboundPayment({
        recipientId: creator.stripe_connect_account_id,
        amountCents: amount,
        currency: options.currency ?? "usd",
        description: `${creator.code} · ${insert.description}`,
        metadata: {
          genlyn_commission_id: commission.id,
          genlyn_creator_id: options.creatorId,
          genlyn_code: creator.code,
        },
      });
      await admin
        .from("creator_commissions")
        .update({
          status: "transferred",
          stripe_transfer_id: payment.id,
          transferred_at: new Date().toISOString(),
        })
        .eq("id", commission.id);
      await admin
        .from("genlyn_creators")
        .update({
          total_paid_cents: Number(creator.total_paid_cents) + amount,
        })
        .eq("id", options.creatorId);
      return {
        ...commission,
        status: "transferred",
        stripe_transfer_id: payment.id,
        transferred_at: new Date().toISOString(),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payout failed";
      await admin
        .from("creator_commissions")
        .update({ status: "failed", error_message: message })
        .eq("id", commission.id);
      return { ...commission, status: "failed", error_message: message };
    }
  }

  return commission;
}

export async function listCreatorReferrals(creatorId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("creator_referrals")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  return (data as CreatorReferral[]) ?? [];
}

export async function listCreatorCommissions(creatorId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("creator_commissions")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as CreatorCommission[]) ?? [];
}

export async function listAllCreators() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("genlyn_creators")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data as GenlynCreator[]) ?? [];
}

export async function listAllCommissions() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("creator_commissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data as CreatorCommission[]) ?? [];
}

export async function resolveCreatorForBuyer(options: {
  buyerUserId: string;
  creatorCode?: string | null;
  source?: string;
}): Promise<GenlynCreator | null> {
  if (options.creatorCode) {
    const attached = await attachReferral({
      buyerUserId: options.buyerUserId,
      creatorCode: options.creatorCode,
      source: options.source,
    });
    if (attached) return attached;
  }
  const referral = await getReferralForBuyer(options.buyerUserId);
  if (!referral) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("genlyn_creators")
    .select("*")
    .eq("id", referral.creator_id)
    .maybeSingle();
  return (data as GenlynCreator | null) ?? null;
}
