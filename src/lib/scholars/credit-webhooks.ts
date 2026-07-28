import type Stripe from "stripe";
import {
  calendarPeriodKey,
  grantScholarsCredits,
  markScholarsCreditSubscriptionStatus,
  resolveScholarsSeatChildIds,
  upsertScholarsCreditSubscription,
} from "@/lib/scholars/credits";
import {
  parseCombinedLookupKey,
  type ScholarsCreditPeriod,
} from "@/config/scholars-credits";
import { getStripe } from "@/lib/subscriptions/stripe";
import { setKidAppEnabled } from "@/lib/kids/portal";

function expandableId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function isCreditCheckout(metadata: Stripe.Metadata | null | undefined): boolean {
  if (!metadata) return false;
  if (metadata.credit_checkout === "true") return true;
  return (
    metadata.app_key === "scholars" &&
    (Boolean(metadata.grant_generations) || Boolean(metadata.grant_tutor_minutes))
  );
}

function normalizePeriod(
  value: string | null | undefined,
): ScholarsCreditPeriod | "once" {
  if (value === "refill" || value === "monthly" || value === "yearly") return value;
  if (value === "once") return "once";
  return "monthly";
}

type EnrichedCreditPrice = {
  lookupKey: string | null;
  generations: number;
  tutorMinutes: number;
  period: ScholarsCreditPeriod | "once";
};

async function enrichPrice(priceId: string): Promise<EnrichedCreditPrice> {
  const stripe = getStripe();
  const price = await stripe.prices.retrieve(priceId);
  const lookupKey = price.lookup_key;
  const parsed = lookupKey ? parseCombinedLookupKey(lookupKey) : null;

  const generations = Number(
    price.metadata.grant_generations ||
      price.metadata.generations ||
      parsed?.generations ||
      0,
  );
  const tutorMinutes = Number(
    price.metadata.grant_tutor_minutes ||
      price.metadata.tutor_minutes ||
      parsed?.tutorMinutes ||
      0,
  );

  if (lookupKey?.includes(".gens.") && generations === 0) {
    const qty = Number(price.metadata.quantity || 0);
    return {
      lookupKey: lookupKey ?? null,
      generations: Number.isFinite(qty) ? qty : 0,
      tutorMinutes: 0,
      period: normalizePeriod(price.metadata.period ?? periodFromLegacyLookup(lookupKey)),
    };
  }
  if (lookupKey?.includes(".tutor.min.") && tutorMinutes === 0) {
    const qty = Number(price.metadata.quantity || 0);
    return {
      lookupKey: lookupKey ?? null,
      generations: 0,
      tutorMinutes: Number.isFinite(qty) ? qty : 0,
      period: normalizePeriod(price.metadata.period ?? periodFromLegacyLookup(lookupKey)),
    };
  }

  const period = normalizePeriod(
    price.metadata.period ?? parsed?.period ?? periodFromLegacyLookup(lookupKey),
  );

  return {
    lookupKey: lookupKey ?? null,
    generations: Number.isFinite(generations) ? generations : 0,
    tutorMinutes: Number.isFinite(tutorMinutes) ? tutorMinutes : 0,
    period,
  };
}

function periodFromLegacyLookup(lookupKey: string | null | undefined): string {
  if (!lookupKey) return "monthly";
  if (lookupKey.endsWith(".yearly")) return "yearly";
  if (lookupKey.endsWith(".monthly")) return "monthly";
  if (lookupKey.endsWith(".refill") || lookupKey.endsWith(".once")) return "refill";
  return "monthly";
}

function parseChildIds(metadata: Stripe.Metadata | null | undefined): string[] {
  const multi =
    metadata?.child_user_ids?.trim() ||
    metadata?.scholars_credit_child_ids?.trim() ||
    "";
  if (multi) {
    return multi
      .split(",")
      .map((id) => id.trim().toLowerCase())
      .filter(Boolean);
  }
  const single =
    metadata?.child_user_id?.trim() ||
    metadata?.future_kids_child_id?.trim() ||
    "";
  return single ? [single.toLowerCase()] : [];
}

async function resolveCreditRecipients(
  metadata: Stripe.Metadata | null | undefined,
): Promise<{ childUserIds: string[]; parentUserId: string | null }> {
  const parentUserId =
    metadata?.future_kids_user_id?.trim() ||
    metadata?.parent_user_id?.trim() ||
    null;

  // Standalone Scholars purchases (and optional All Access) hold credits on
  // the parent until assigned to a child in Manage kids.
  if (
    metadata?.credit_held_by === "parent" &&
    parentUserId
  ) {
    return { childUserIds: [parentUserId], parentUserId };
  }

  const preferred = parseChildIds(metadata);
  if (
    parentUserId &&
    preferred.length === 1 &&
    preferred[0] === parentUserId.toLowerCase()
  ) {
    return { childUserIds: [parentUserId], parentUserId };
  }

  const seatCount = Math.max(
    1,
    Math.min(
      5,
      Math.trunc(
        Number(
          metadata?.scholars_child_count ||
            metadata?.credit_seat_count ||
            preferred.length ||
            1,
        ) || 1,
      ),
    ),
  );

  if (parentUserId) {
    const childUserIds = await resolveScholarsSeatChildIds({
      parentUserId,
      seatCount,
      preferredChildIds: preferred.filter((id) => id !== parentUserId.toLowerCase()),
    });
    if (childUserIds.length > 0) {
      return { childUserIds, parentUserId };
    }
    // No kids yet — keep credits on the parent pool.
    return { childUserIds: [parentUserId], parentUserId };
  }

  if (preferred.length > 0) {
    return { childUserIds: preferred.slice(0, seatCount), parentUserId };
  }

  throw new Error("Credit checkout missing child recipients");
}

async function applyCreditGrants(params: {
  childUserId: string;
  parentUserId: string | null;
  enriched: EnrichedCreditPrice;
  periodKey: string;
  stripeEventId: string;
  stripeInvoiceId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionItemId?: string | null;
  stripePriceId?: string | null;
  subscriptionStatus?: string;
}): Promise<void> {
  const { enriched } = params;
  if (!enriched.lookupKey) return;
  if (enriched.generations <= 0 && enriched.tutorMinutes <= 0) return;

  if (enriched.generations > 0) {
    await grantScholarsCredits({
      childUserId: params.childUserId,
      parentUserId: params.parentUserId,
      kind: "generations",
      quantity: enriched.generations,
      periodKey: params.periodKey,
      lookupKey: `${enriched.lookupKey}.generations`,
      stripeEventId: params.stripeEventId,
      stripeInvoiceId: params.stripeInvoiceId,
      stripeCheckoutSessionId: params.stripeCheckoutSessionId,
      stripePaymentIntentId: params.stripePaymentIntentId,
      stripeSubscriptionId: params.stripeSubscriptionId,
    });
  }

  if (enriched.tutorMinutes > 0) {
    await grantScholarsCredits({
      childUserId: params.childUserId,
      parentUserId: params.parentUserId,
      kind: "tutor_minutes",
      quantity: enriched.tutorMinutes,
      periodKey: params.periodKey,
      lookupKey: `${enriched.lookupKey}.tutor_minutes`,
      stripeEventId: params.stripeEventId,
      stripeInvoiceId: params.stripeInvoiceId,
      stripeCheckoutSessionId: params.stripeCheckoutSessionId,
      stripePaymentIntentId: params.stripePaymentIntentId,
      stripeSubscriptionId: params.stripeSubscriptionId,
    });
  }

  if (
    params.stripeSubscriptionId &&
    enriched.period !== "once" &&
    enriched.period !== "refill"
  ) {
    const subPeriod = enriched.period === "yearly" ? "yearly" : "monthly";
    if (enriched.generations > 0) {
      await upsertScholarsCreditSubscription({
        childUserId: params.childUserId,
        parentUserId: params.parentUserId,
        kind: "generations",
        quantity: enriched.generations,
        period: subPeriod,
        lookupKey: `${enriched.lookupKey}.generations`,
        stripeSubscriptionId: params.stripeSubscriptionId,
        stripeSubscriptionItemId: params.stripeSubscriptionItemId,
        stripePriceId: params.stripePriceId,
        status: params.subscriptionStatus ?? "active",
      });
    }
    if (enriched.tutorMinutes > 0) {
      await upsertScholarsCreditSubscription({
        childUserId: params.childUserId,
        parentUserId: params.parentUserId,
        kind: "tutor_minutes",
        quantity: enriched.tutorMinutes,
        period: subPeriod,
        lookupKey: `${enriched.lookupKey}.tutor_minutes`,
        stripeSubscriptionId: params.stripeSubscriptionId,
        stripeSubscriptionItemId: params.stripeSubscriptionItemId,
        stripePriceId: params.stripePriceId,
        status: params.subscriptionStatus ?? "active",
      });
    }
  }
}

async function enableScholarsForChildren(
  parentUserId: string | null,
  childUserIds: string[],
): Promise<void> {
  if (!parentUserId) return;
  for (const childId of childUserIds) {
    // Parent pool balance uses the parent's own user id — not a kid seat.
    if (childId.toLowerCase() === parentUserId.toLowerCase()) continue;
    try {
      await setKidAppEnabled({
        parentId: parentUserId,
        childId,
        appKey: "scholars",
        enabled: true,
        bypassEntitlementCheck: true,
        bypassSeatLimit: true,
      });
    } catch (error) {
      console.error("[scholars-credits] could not enable scholars seat", {
        childId,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

export async function handleScholarsCreditCheckoutCompleted(
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<boolean> {
  if (!isCreditCheckout(session.metadata)) return false;

  const parentFromSession =
    session.metadata?.future_kids_user_id ||
    session.client_reference_id ||
    "";
  const { childUserIds, parentUserId } = await resolveCreditRecipients({
    ...(session.metadata ?? {}),
    ...(parentFromSession ? { future_kids_user_id: parentFromSession } : {}),
  });

  const stripe = getStripe();
  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price"],
  });

  const period = normalizePeriod(session.metadata?.credit_period);
  const periodKey =
    period === "once" || period === "refill" ? "once" : calendarPeriodKey();
  const subscriptionId = expandableId(session.subscription);
  const paymentIntentId = expandableId(session.payment_intent);

  await enableScholarsForChildren(parentUserId, childUserIds);

  for (const childUserId of childUserIds) {
    for (const item of full.line_items?.data ?? []) {
      const priceId =
        typeof item.price === "string" ? item.price : item.price?.id;
      if (!priceId) continue;
      const enriched = await enrichPrice(priceId);
      const gens = Number(session.metadata?.grant_generations ?? enriched.generations);
      const mins = Number(
        session.metadata?.grant_tutor_minutes ?? enriched.tutorMinutes,
      );
      await applyCreditGrants({
        childUserId,
        parentUserId,
        enriched: {
          ...enriched,
          generations: Number.isFinite(gens) ? gens : enriched.generations,
          tutorMinutes: Number.isFinite(mins) ? mins : enriched.tutorMinutes,
          period,
        },
        periodKey: `${periodKey}:${childUserId}`,
        stripeEventId: eventId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionItemId: item.id,
        stripePriceId: priceId,
        subscriptionStatus: "active",
      });
    }
  }

  return true;
}

export async function handleScholarsCreditInvoicePaid(
  invoice: Stripe.Invoice,
  eventId: string,
): Promise<boolean> {
  const subscriptionId = (() => {
    const legacy = invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    };
    const direct = expandableId(legacy.subscription);
    if (direct) return direct;
    const parent = invoice.parent;
    if (parent?.type !== "subscription_details") return null;
    return expandableId(parent.subscription_details?.subscription);
  })();

  if (!subscriptionId) return false;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (!isCreditCheckout(subscription.metadata)) {
    let anyCredit = false;
    for (const item of subscription.items.data) {
      const enriched = await enrichPrice(item.price.id);
      if (
        enriched.lookupKey?.startsWith("com.scholarsnotes.") &&
        (enriched.generations > 0 || enriched.tutorMinutes > 0)
      ) {
        anyCredit = true;
        break;
      }
    }
    if (!anyCredit) return false;
  }

  const { childUserIds, parentUserId } = await resolveCreditRecipients(
    subscription.metadata,
  );

  const periodKey = calendarPeriodKey(
    invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000)
      : new Date(),
  );

  await enableScholarsForChildren(parentUserId, childUserIds);

  for (const childUserId of childUserIds) {
    for (const line of invoice.lines.data) {
      const legacyPrice = (
        line as {
          price?: string | { id: string } | null;
          pricing?: { price_details?: { price?: string } | null } | null;
        }
      ).price;
      const priceId =
        (typeof legacyPrice === "string"
          ? legacyPrice
          : legacyPrice && typeof legacyPrice === "object"
            ? legacyPrice.id
            : null) ?? line.pricing?.price_details?.price ?? null;
      if (!priceId) continue;
      const enriched = await enrichPrice(priceId);
      await applyCreditGrants({
        childUserId,
        parentUserId,
        enriched,
        periodKey: `${periodKey}:${childUserId}`,
        stripeEventId: eventId,
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        subscriptionStatus: subscription.status,
      });
    }
  }

  return true;
}

export async function handleScholarsCreditSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<boolean> {
  if (!isCreditCheckout(subscription.metadata)) {
    let anyCredit = false;
    for (const item of subscription.items.data) {
      const enriched = await enrichPrice(item.price.id);
      if (enriched.lookupKey?.startsWith("com.scholarsnotes.")) {
        anyCredit = true;
        break;
      }
    }
    if (!anyCredit) return false;
  }
  await markScholarsCreditSubscriptionStatus(subscription.id, "canceled");
  return true;
}
