import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { syncEarnlyChildAccess } from "@/lib/subscriptions/earnly-sync";
import {
  assertStripePriceMatchesCatalog,
  getServerCheckoutPlan,
  getStripe,
  stripeModeMismatchMessage,
  stripeSubscriptionToVerified,
} from "@/lib/subscriptions/stripe";
import { applyVerifiedSubscriptionEvent } from "@/lib/subscriptions/store";

type SwitchRequest = {
  targetPlanKey?: string;
  activeChildIds?: string[];
  requestId?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let body: SwitchRequest;
    try {
      body = (await request.json()) as SwitchRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (
      !body.targetPlanKey ||
      !body.requestId ||
      !UUID_PATTERN.test(body.requestId) ||
      !Array.isArray(body.activeChildIds)
    ) {
      return NextResponse.json({ error: "Invalid All Access switch request" }, { status: 400 });
    }

    const target = getServerCheckoutPlan(body.targetPlanKey);
    if (
      !target ||
      target.plan.appKey !== "futurekids_all_access" ||
      target.plan.childLimit === null
    ) {
      return NextResponse.json({ error: "Invalid All Access plan" }, { status: 400 });
    }

    const { data: entitlements, error: entitlementError } = await supabase
      .from("user_entitlements")
      .select("*")
      .eq("provider", "stripe")
      .in("status", ["active", "trialing", "grace_period", "canceled"])
      .order("created_at", { ascending: true });
    if (entitlementError) throw entitlementError;

    const activeEntitlements = (entitlements ?? []).filter(
      (entitlement) =>
        !entitlement.current_period_end ||
        Date.parse(entitlement.current_period_end) > Date.now(),
    );
    const existingAllAccess = activeEntitlements.find(
      (entitlement) => entitlement.app_key === "futurekids_all_access",
    );
    const directEntitlements = activeEntitlements.filter(
      (entitlement) => entitlement.app_key !== "futurekids_all_access",
    );
    const primary = existingAllAccess ?? directEntitlements[0];
    if (!primary) {
      return NextResponse.json(
        { error: "No website subscription is available to switch" },
        { status: 409 },
      );
    }

    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();
    const { data: familyChildren } = family
      ? await supabase
          .from("family_members")
          .select("user_id")
          .eq("family_id", family.id)
          .eq("role", "child")
      : { data: [] as Array<{ user_id: string }> };
    const ownedChildIds = new Set((familyChildren ?? []).map((child) => child.user_id));
    const selectedChildIds = [...new Set(body.activeChildIds)];
    const requiredCount = Math.min(ownedChildIds.size, target.plan.childLimit);
    if (
      selectedChildIds.length !== requiredCount ||
      selectedChildIds.some((childId) => !ownedChildIds.has(childId))
    ) {
      return NextResponse.json(
        { error: `Select exactly ${requiredCount} children for All Access` },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    await assertStripePriceMatchesCatalog(stripe, target.plan, target.priceId);
    let primarySubscription;
    try {
      primarySubscription = await stripe.subscriptions.retrieve(
        primary.provider_subscription_id,
      );
    } catch (error) {
      const mismatch = stripeModeMismatchMessage(error, "subscription");
      if (mismatch) {
        return NextResponse.json(
          { error: mismatch, code: "stripe_subscription_mode_mismatch" },
          { status: 409 },
        );
      }
      throw error;
    }
    if (primarySubscription.metadata.future_kids_user_id !== user.id) {
      return NextResponse.json({ error: "Billing identity mismatch" }, { status: 409 });
    }

    if (
      primary.app_key !== "futurekids_all_access" ||
      primary.plan_key !== target.plan.planKey
    ) {
      const item = primarySubscription.items.data[0];
      if (!item) throw new Error("Stripe subscription has no plan item");
      primarySubscription = await stripe.subscriptions.update(
        primarySubscription.id,
        {
          items: [{ id: item.id, price: target.priceId, quantity: 1 }],
          metadata: {
            future_kids_user_id: user.id,
            app_key: target.plan.appKey,
            plan_key: target.plan.planKey,
            child_count: String(target.plan.childLimit),
            consolidated_from: directEntitlements
              .map((entitlement) => entitlement.app_key)
              .join(","),
          },
          cancel_at_period_end: false,
          proration_behavior: "create_prorations",
          payment_behavior: "error_if_incomplete",
        },
        { idempotencyKey: `switch-all-access:${body.requestId}:primary` },
      );
    }

    const verifiedPrimary = stripeSubscriptionToVerified(primarySubscription);
    const primaryApplication = await applyVerifiedSubscriptionEvent(
      {
        eventId: `dashboard.switch-all-access.${body.requestId}.primary`,
        eventType: "dashboard.subscription.switch_all_access",
        occurredAt: new Date().toISOString(),
      },
      verifiedPrimary,
    );
    const primaryEntitlementId =
      primaryApplication.entitlementId ?? primary.id;
    const admin = createAdminClient();
    const { error: assignmentError } = await admin.rpc(
      "set_entitlement_child_assignments",
      {
        p_entitlement_id: primaryEntitlementId,
        p_child_ids: selectedChildIds,
        p_reason: "switch_all_access",
      },
    );
    if (assignmentError) throw assignmentError;

    const canceledPlanKeys: string[] = [];
    for (const entitlement of directEntitlements) {
      if (entitlement.id === primary.id) continue;
      const subscription = await stripe.subscriptions.retrieve(
        entitlement.provider_subscription_id,
      );
      if (subscription.metadata.future_kids_user_id !== user.id) {
        throw new Error("A subscription has mismatched billing identity");
      }
      const canceled =
        subscription.status === "canceled"
          ? subscription
          : await stripe.subscriptions.cancel(
              subscription.id,
              { invoice_now: true, prorate: true },
              {
                idempotencyKey: `switch-all-access:${body.requestId}:cancel:${subscription.id}`,
              },
            );
      await applyVerifiedSubscriptionEvent(
        {
          eventId: `dashboard.switch-all-access.${body.requestId}.cancel.${subscription.id}`,
          eventType: "dashboard.subscription.consolidated",
          occurredAt: new Date().toISOString(),
        },
        stripeSubscriptionToVerified(canceled),
      );
      canceledPlanKeys.push(entitlement.plan_key);
    }

    await syncEarnlyChildAccess(user.id);
    return NextResponse.json({
      outcome: existingAllAccess ? "consolidated" : "switched",
      planKey: target.plan.planKey,
      canceledPlanKeys,
      appleSubscriptionsRequireManualCancellation: true,
    });
  } catch (error) {
    console.error("[stripe-switch-all-access] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        error:
          stripeModeMismatchMessage(error, "object") ??
          (error instanceof Error ? error.message : "Could not switch plans"),
      },
      { status: 500 },
    );
  }
}
