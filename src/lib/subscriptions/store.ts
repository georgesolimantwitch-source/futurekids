import { createAdminClient } from "@/lib/supabase/admin";
import type { ProviderName, VerifiedSubscription } from "./catalog";
import type { AppKey } from "./product-catalog";

export interface ProviderEventContext {
  eventId: string;
  eventType: string;
  eventSubtype?: string | null;
  occurredAt?: string | null;
  payloadHash?: string | null;
}

export async function findSubscriptionOwner(
  provider: ProviderName,
  providerSubscriptionId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_entitlements")
    .select("user_id")
    .eq("provider", provider)
    .eq("provider_subscription_id", providerSubscriptionId)
    .maybeSingle();
  if (error) throw error;
  return data?.user_id ?? null;
}

export async function getVerifiedSubscriptionSnapshot(
  provider: ProviderName,
  providerSubscriptionId: string,
): Promise<VerifiedSubscription | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_entitlements")
    .select("*")
    .eq("provider", provider)
    .eq("provider_subscription_id", providerSubscriptionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    userId: data.user_id,
    appKey: data.app_key as AppKey,
    planKey: data.plan_key,
    provider,
    providerCustomerId: data.provider_customer_id,
    providerSubscriptionId: data.provider_subscription_id,
    providerProductId: data.provider_product_id,
    providerPriceId: data.provider_price_id,
    status: data.status,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    quantity: data.quantity,
    tierKey: data.tier_key,
    entitlementRank: data.entitlement_rank,
    childLimit: data.child_limit,
    limits: data.limits ?? {},
    features: data.features ?? {},
    currentTransactionId: data.latest_transaction_id,
    environment: data.environment,
    autoRenewStatus: data.auto_renew_status,
  };
}

export async function applyVerifiedSubscriptionEvent(
  event: ProviderEventContext,
  subscription: VerifiedSubscription,
) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("apply_subscription_provider_event", {
    p_provider: subscription.provider,
    p_event_id: event.eventId,
    p_event_type: event.eventType,
    p_event_subtype: event.eventSubtype ?? null,
    p_occurred_at: event.occurredAt ?? new Date().toISOString(),
    p_user_id: subscription.userId,
    p_provider_customer_id: subscription.providerCustomerId,
    p_provider_subscription_id: subscription.providerSubscriptionId,
    p_provider_product_id: subscription.providerProductId,
    p_provider_price_id: subscription.providerPriceId,
    p_app_key: subscription.appKey,
    p_plan_key: subscription.planKey,
    p_tier_key: subscription.tierKey,
    p_entitlement_rank: subscription.entitlementRank,
    p_child_limit: subscription.childLimit,
    p_limits: subscription.limits,
    p_features: subscription.features,
    p_status: subscription.status,
    p_current_period_start: subscription.currentPeriodStart,
    p_current_period_end: subscription.currentPeriodEnd,
    p_cancel_at_period_end: subscription.cancelAtPeriodEnd,
    p_quantity: subscription.quantity,
    p_current_transaction_id: subscription.currentTransactionId,
    p_environment: subscription.environment,
    p_auto_renew_status: subscription.autoRenewStatus,
    p_payload_hash: event.payloadHash ?? null,
  });
  if (error) throw error;
  if ((data as { outcome?: string } | null)?.outcome === "rejected") {
    throw new Error("Subscription is already linked to another Genlyn account");
  }
  return data as {
    outcome: "applied" | "duplicate" | "stale";
    eventId: string;
    entitlementId?: string;
  };
}

export async function insertProviderEvent(event: {
  provider: ProviderName;
  eventId: string;
  eventType: string;
  userId?: string;
  providerSubscriptionId?: string;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("subscription_provider_events").insert({
    provider: event.provider,
    provider_event_id: event.eventId,
    event_type: event.eventType,
    user_id: event.userId,
    provider_subscription_id: event.providerSubscriptionId,
  });
  if (error?.code === "23505") {
    const { data, error: lookupError } = await admin
      .from("subscription_provider_events")
      .select("processed_at")
      .eq("provider", event.provider)
      .eq("provider_event_id", event.eventId)
      .single();
    if (lookupError) throw lookupError;
    return !data.processed_at;
  }
  if (error) throw error;
  return true;
}

export async function saveVerifiedSubscription(subscription: VerifiedSubscription) {
  const owner = await findSubscriptionOwner(
    subscription.provider,
    subscription.providerSubscriptionId,
  );
  if (owner && owner !== subscription.userId) {
    throw new Error("Subscription is already linked to another Genlyn account");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_entitlements")
    .upsert(
      {
        user_id: subscription.userId,
        app_key: subscription.appKey,
        plan_key: subscription.planKey,
        provider: subscription.provider,
        provider_customer_id: subscription.providerCustomerId,
        provider_subscription_id: subscription.providerSubscriptionId,
        provider_product_id: subscription.providerProductId,
        provider_price_id: subscription.providerPriceId,
        status: subscription.status,
        current_period_start: subscription.currentPeriodStart,
        current_period_end: subscription.currentPeriodEnd,
        cancel_at_period_end: subscription.cancelAtPeriodEnd,
        quantity: subscription.quantity,
      },
      { onConflict: "provider,provider_subscription_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function markProviderEventProcessed(
  provider: ProviderName,
  eventId: string,
  processingError?: string,
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("subscription_provider_events")
    .update({
      processed_at: processingError ? null : new Date().toISOString(),
      processing_error: processingError ?? null,
    })
    .eq("provider", provider)
    .eq("provider_event_id", eventId);
  if (error) throw error;
}
