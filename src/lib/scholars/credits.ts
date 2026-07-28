import { createAdminClient } from "@/lib/supabase/admin";
import type { ScholarsCreditKind, ScholarsCreditPeriod } from "@/config/scholars-credits";

export type ScholarsCreditBalance = {
  child_user_id?: string;
  generations: number;
  tutor_minutes: number;
};

export function calendarPeriodKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function getScholarsCreditBalanceForChild(
  childUserId: string,
): Promise<ScholarsCreditBalance> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scholars_credit_balances")
    .select("generations_remaining, tutor_minutes_remaining")
    .eq("child_user_id", childUserId)
    .maybeSingle();
  if (error) throw error;
  return {
    child_user_id: childUserId,
    generations: data?.generations_remaining ?? 0,
    tutor_minutes: data?.tutor_minutes_remaining ?? 0,
  };
}

export async function grantScholarsCredits(params: {
  childUserId: string;
  parentUserId?: string | null;
  kind: ScholarsCreditKind;
  quantity: number;
  periodKey: string;
  lookupKey: string;
  stripeEventId?: string | null;
  stripeInvoiceId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeSubscriptionId?: string | null;
}): Promise<{
  outcome: "applied" | "duplicate";
  generations?: number;
  tutor_minutes?: number;
}> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("grant_scholars_credits", {
    p_child_user_id: params.childUserId,
    p_parent_user_id: params.parentUserId ?? null,
    p_kind: params.kind,
    p_quantity: params.quantity,
    p_period_key: params.periodKey,
    p_lookup_key: params.lookupKey,
    p_stripe_event_id: params.stripeEventId ?? null,
    p_stripe_invoice_id: params.stripeInvoiceId ?? null,
    p_stripe_checkout_session_id: params.stripeCheckoutSessionId ?? null,
    p_stripe_payment_intent_id: params.stripePaymentIntentId ?? null,
    p_stripe_subscription_id: params.stripeSubscriptionId ?? null,
  });
  if (error) throw error;
  return data as {
    outcome: "applied" | "duplicate";
    generations?: number;
    tutor_minutes?: number;
  };
}

export async function upsertScholarsCreditSubscription(params: {
  childUserId: string;
  parentUserId?: string | null;
  kind: ScholarsCreditKind;
  quantity: number;
  period: ScholarsCreditPeriod;
  lookupKey: string;
  stripeSubscriptionId: string;
  stripeSubscriptionItemId?: string | null;
  stripePriceId?: string | null;
  status?: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("upsert_scholars_credit_subscription", {
    p_child_user_id: params.childUserId,
    p_parent_user_id: params.parentUserId ?? null,
    p_kind: params.kind,
    p_quantity: params.quantity,
    p_period: params.period,
    p_lookup_key: params.lookupKey,
    p_stripe_subscription_id: params.stripeSubscriptionId,
    p_stripe_subscription_item_id: params.stripeSubscriptionItemId ?? null,
    p_stripe_price_id: params.stripePriceId ?? null,
    p_status: params.status ?? "active",
  });
  if (error) throw error;
}

export async function markScholarsCreditSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("scholars_credit_subscriptions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", stripeSubscriptionId);
  if (error) throw error;
}

export async function transferScholarsCredits(params: {
  parentUserId: string;
  fromChildId: string;
  toChildId: string;
}): Promise<{
  outcome: "transferred" | "noop";
  generations: number;
  tutor_minutes: number;
}> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("transfer_scholars_credits", {
    p_parent_user_id: params.parentUserId,
    p_from_child_id: params.fromChildId,
    p_to_child_id: params.toChildId,
  });
  if (error) throw error;
  return data as {
    outcome: "transferred" | "noop";
    generations: number;
    tutor_minutes: number;
  };
}

/** Resolve which children receive All Access Scholars seats + credit grants. */
export async function resolveScholarsSeatChildIds(params: {
  parentUserId: string;
  seatCount: number;
  preferredChildIds?: string[];
}): Promise<string[]> {
  const admin = createAdminClient();
  const seatCount = Math.max(1, Math.min(5, Math.trunc(params.seatCount)));
  const preferred = (params.preferredChildIds ?? [])
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);

  const { data: families } = await admin
    .from("families")
    .select("id")
    .eq("owner_id", params.parentUserId)
    .order("created_at", { ascending: true })
    .limit(1);
  const familyId = families?.[0]?.id as string | undefined;
  if (!familyId) return preferred.slice(0, seatCount);

  const { data: members } = await admin
    .from("family_members")
    .select("user_id, joined_at")
    .eq("family_id", familyId)
    .eq("role", "child")
    .order("joined_at", { ascending: true });
  const familyChildIds = (members ?? []).map((row) =>
    String(row.user_id).toLowerCase(),
  );

  const ordered: string[] = [];
  for (const id of preferred) {
    if (familyChildIds.includes(id) && !ordered.includes(id)) ordered.push(id);
  }
  for (const id of familyChildIds) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered.slice(0, seatCount);
}
