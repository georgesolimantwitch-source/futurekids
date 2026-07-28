import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  assertStripePriceMatchesCatalog,
  getServerCheckoutPlan,
  getStripe,
  stripeSubscriptionToVerified,
} from "@/lib/subscriptions/stripe";
import { applyVerifiedSubscriptionEvent } from "@/lib/subscriptions/store";
import { syncEarnlyChildAccess } from "@/lib/subscriptions/earnly-sync";
import { planChangeTiming } from "@/lib/subscriptions/plan-management";

type ChangeRequest = {
  entitlementId?: string;
  targetPlanKey?: string;
  activeChildIds?: string[];
  requestId?: string;
};

function expandableId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function subscriptionItem(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  if (!item) throw new Error("Stripe subscription has no plan item");
  return item;
}

function planMetadata(
  userId: string,
  appKey: string,
  planKey: string,
  childLimit: number,
  pendingChangeId?: string,
) {
  return {
    future_kids_user_id: userId,
    app_key: appKey,
    plan_key: planKey,
    child_count: String(childLimit),
    ...(pendingChangeId ? { pending_plan_change_id: pendingChangeId } : {}),
  };
}

function publicErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message) return fallback;
  const message = error.message;
  if (/live mode|test mode|No such price|does not match/i.test(message)) {
    return "Billing catalog is misconfigured for this environment. Please try again shortly.";
  }
  if (/already has a schedule/i.test(message)) {
    return "This subscription already has a scheduled change. Cancel it before starting another.";
  }
  return fallback;
}

export async function POST(request: Request) {
  let createdScheduleId: string | null = null;
  let changeId: string | null = null;
  let stripe: ReturnType<typeof getStripe> | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let body: ChangeRequest;
    try {
      body = (await request.json()) as ChangeRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const requestId = body.requestId;
    if (
      !body.entitlementId ||
      !body.targetPlanKey ||
      !requestId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        requestId,
      ) ||
      !Array.isArray(body.activeChildIds)
    ) {
      return NextResponse.json({ error: "Invalid plan change request" }, { status: 400 });
    }

    const { data: entitlement } = await supabase
      .from("user_entitlements")
      .select("*")
      .eq("id", body.entitlementId)
      .eq("provider", "stripe")
      .maybeSingle();
    if (!entitlement || entitlement.user_id !== user.id) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }
    if (entitlement.cancel_at_period_end) {
      return NextResponse.json(
        { error: "Resume this subscription before changing its plan" },
        { status: 409 },
      );
    }

    const currentPlan = getServerCheckoutPlan(entitlement.plan_key);
    const targetPlan = getServerCheckoutPlan(body.targetPlanKey);
    if (
      !currentPlan ||
      !targetPlan ||
      currentPlan.plan.appKey !== targetPlan.plan.appKey ||
      !["earnly", "futurekids_all_access", "scholars"].includes(
        targetPlan.plan.appKey,
      ) ||
      (!currentPlan.plan.perChildQuantity &&
        currentPlan.plan.childLimit === null) ||
      (!targetPlan.plan.perChildQuantity && targetPlan.plan.childLimit === null)
    ) {
      return NextResponse.json(
        { error: "This plan cannot be changed through child-tier management" },
        { status: 400 },
      );
    }
    if (!targetPlan.priceId) {
      return NextResponse.json(
        {
          error:
            "This plan is missing a Stripe price configuration. Set the matching STRIPE_*_PRICE_ID environment variable.",
        },
        { status: 500 },
      );
    }

    const { data: families } = await supabase
      .from("families")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);
    const familyId = families?.[0]?.id;
    const { data: familyChildren } = familyId
      ? await supabase
          .from("family_members")
          .select("user_id")
          .eq("family_id", familyId)
          .eq("role", "child")
      : { data: [] as Array<{ user_id: string }> };

    const ownedChildIds = new Set((familyChildren ?? []).map((child) => child.user_id));
    if (ownedChildIds.size === 0) {
      return NextResponse.json(
        {
          error:
            "No linked child profiles were found. Link your children to the Genlyn family before changing this plan.",
        },
        { status: 409 },
      );
    }
    const selectedChildIds = [...new Set(body.activeChildIds)];
    const currentChildLimit =
      currentPlan.plan.childLimit ??
      (currentPlan.plan.perChildQuantity
        ? Math.max(1, Number(entitlement.child_limit) || selectedChildIds.length || 1)
        : 1);
    const targetChildLimit = targetPlan.plan.perChildQuantity
      ? selectedChildIds.length
      : targetPlan.plan.childLimit;
    if (
      !targetChildLimit ||
      !Number.isInteger(targetChildLimit) ||
      targetChildLimit < 1 ||
      targetChildLimit > 6
    ) {
      return NextResponse.json(
        { error: "Invalid child count for this plan" },
        { status: 400 },
      );
    }
    const requiredCount = Math.min(ownedChildIds.size, targetChildLimit);
    if (
      selectedChildIds.length !== requiredCount ||
      selectedChildIds.some((childId) => !ownedChildIds.has(childId))
    ) {
      return NextResponse.json(
        {
          error: `Select exactly ${requiredCount} ${
            requiredCount === 1 ? "child" : "children"
          } for this plan`,
        },
        { status: 400 },
      );
    }

    stripe = getStripe();
    await assertStripePriceMatchesCatalog(
      stripe,
      targetPlan.plan,
      targetPlan.priceId,
    );
    const subscription = await stripe.subscriptions.retrieve(
      entitlement.provider_subscription_id,
    );
    if (subscription.metadata.future_kids_user_id !== user.id) {
      return NextResponse.json({ error: "Billing identity mismatch" }, { status: 409 });
    }

    const currentItem = subscriptionItem(subscription);
    const periodEndUnix =
      currentItem.current_period_end ??
      (subscription as { current_period_end?: number }).current_period_end;
    if (!periodEndUnix) {
      return NextResponse.json(
        { error: "Could not determine the current billing period" },
        { status: 500 },
      );
    }
    const currentPeriodEnd = new Date(periodEndUnix * 1000).toISOString();
    const lineItemQuantity = targetPlan.plan.perChildQuantity ? targetChildLimit : 1;
    const metadata = planMetadata(
      user.id,
      targetPlan.plan.appKey,
      targetPlan.plan.planKey,
      targetChildLimit,
    );
    const timing = planChangeTiming(
      {
        planKey: currentPlan.plan.planKey,
        childLimit: currentChildLimit,
        interval: currentPlan.plan.interval,
      },
      {
        planKey: targetPlan.plan.planKey,
        childLimit: targetChildLimit,
        interval: targetPlan.plan.interval,
      },
    );
    const shouldSchedule = timing === "scheduled";
    const admin = createAdminClient();

    if (!shouldSchedule) {
      if (
        timing === "unchanged" &&
        targetPlan.priceId === currentItem.price.id
      ) {
        const { error: assignmentError } = await admin.rpc(
          "set_entitlement_child_assignments",
          {
            p_entitlement_id: entitlement.id,
            p_child_ids: selectedChildIds,
            p_reason: "selection_update",
          },
        );
        if (assignmentError) throw assignmentError;
        await syncEarnlyChildAccess(user.id);
        return NextResponse.json({ outcome: "unchanged", effectiveAt: null });
      }

      const updated = await stripe.subscriptions.update(
        subscription.id,
        {
          items: [
            {
              id: currentItem.id,
              price: targetPlan.priceId,
              quantity: lineItemQuantity,
            },
          ],
          metadata,
          proration_behavior: "create_prorations",
          payment_behavior: "error_if_incomplete",
        },
        { idempotencyKey: `plan-change:${requestId}:immediate` },
      );
      const verified = stripeSubscriptionToVerified(updated);
      await applyVerifiedSubscriptionEvent(
        {
          eventId: `dashboard.plan-change.${requestId}`,
          eventType: "dashboard.subscription.plan_change",
          occurredAt: new Date().toISOString(),
        },
        verified,
      );
      const { error: assignmentError } = await admin.rpc(
        "set_entitlement_child_assignments",
        {
          p_entitlement_id: entitlement.id,
          p_child_ids: selectedChildIds,
          p_reason: "immediate_upgrade",
        },
      );
      if (assignmentError) throw assignmentError;
      await syncEarnlyChildAccess(user.id);
      return NextResponse.json({
        outcome: "applied",
        effectiveAt: new Date().toISOString(),
        planKey: targetPlan.plan.planKey,
      });
    }

    const { data: existingRequest } = await admin
      .from("subscription_plan_changes")
      .select("*")
      .eq("user_id", user.id)
      .eq("client_request_id", requestId)
      .maybeSingle();
    if (existingRequest) {
      return NextResponse.json({
        outcome: existingRequest.status,
        effectiveAt: existingRequest.effective_at,
        changeId: existingRequest.id,
      });
    }

    changeId = randomUUID();
    const { error: reserveError } = await admin
      .from("subscription_plan_changes")
      .insert({
        id: changeId,
        user_id: user.id,
        entitlement_id: entitlement.id,
        provider: "stripe",
        provider_subscription_id: subscription.id,
        app_key: targetPlan.plan.appKey,
        from_plan_key: currentPlan.plan.planKey,
        target_plan_key: targetPlan.plan.planKey,
        from_child_limit: currentChildLimit,
        target_child_limit: targetChildLimit,
        effective_at: currentPeriodEnd,
        status: "requested",
        client_request_id: requestId,
      });
    if (reserveError) {
      return NextResponse.json(
        { error: "Another plan change is already pending" },
        { status: 409 },
      );
    }
    if (selectedChildIds.length) {
      const { error: selectionError } = await admin
        .from("subscription_plan_change_children")
        .insert(
          selectedChildIds.map((childId) => ({
            change_id: changeId,
            child_id: childId,
          })),
        );
      if (selectionError) {
        await admin
          .from("subscription_plan_changes")
          .update({
            status: "failed",
            failure_code: "child_selection_failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", changeId);
        return NextResponse.json(
          { error: "Could not save the selected children" },
          { status: 500 },
        );
      }
    }

    const attachedScheduleId = expandableId(subscription.schedule);
    if (attachedScheduleId) {
      throw new Error("Stripe subscription already has a schedule");
    }
    const schedule = await stripe.subscriptionSchedules.create(
      { from_subscription: subscription.id },
      { idempotencyKey: `plan-change:${changeId}:schedule` },
    );
    createdScheduleId = schedule.id;
    const currentPhase =
      schedule.phases.find(
        (phase) =>
          phase.start_date <= Math.floor(Date.now() / 1000) &&
          phase.end_date >= Math.floor(Date.now() / 1000),
      ) ?? schedule.phases[0];
    if (!currentPhase) throw new Error("Stripe schedule has no current phase");

    const configured = await stripe.subscriptionSchedules.update(
      schedule.id,
      {
        end_behavior: "release",
        metadata: {
          future_kids_user_id: user.id,
          pending_plan_change_id: changeId,
        },
        phases: [
          {
            start_date: currentPhase.start_date,
            end_date: periodEndUnix,
            items: [{ price: currentItem.price.id, quantity: currentItem.quantity ?? 1 }],
            metadata: subscription.metadata,
            proration_behavior: "none",
          },
          {
            start_date: periodEndUnix,
            items: [{ price: targetPlan.priceId, quantity: lineItemQuantity }],
            metadata: planMetadata(
              user.id,
              targetPlan.plan.appKey,
              targetPlan.plan.planKey,
              targetChildLimit,
              changeId,
            ),
            proration_behavior: "none",
          },
        ],
      },
      { idempotencyKey: `plan-change:${changeId}:configure` },
    );

    await admin
      .from("subscription_plan_changes")
      .update({
        provider_schedule_id: configured.id,
        status: "scheduled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", changeId);
    await admin
      .from("user_entitlements")
      .update({ provider_schedule_id: configured.id })
      .eq("id", entitlement.id);

    return NextResponse.json({
      outcome: "scheduled",
      effectiveAt: currentPeriodEnd,
      changeId,
    });
  } catch (error) {
    if (createdScheduleId && stripe) {
      try {
        const schedule = await stripe.subscriptionSchedules.retrieve(
          createdScheduleId,
        );
        if (schedule.status === "active" || schedule.status === "not_started") {
          await stripe.subscriptionSchedules.release(createdScheduleId);
        }
      } catch (releaseError) {
        console.error("[stripe-change-plan] schedule cleanup failed", {
          changeId,
          message:
            releaseError instanceof Error ? releaseError.message : "unknown",
        });
      }
    }
    if (changeId) {
      try {
        const admin = createAdminClient();
        await admin
          .from("subscription_plan_changes")
          .update({
            status: "failed",
            failure_code: "stripe_schedule_failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", changeId);
      } catch {
        // ignore cleanup failures
      }
    }
    console.error("[stripe-change-plan] failed", {
      changeId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        error: publicErrorMessage(
          error,
          "Could not schedule this plan change",
        ),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    let body: { changeId?: string };
    try {
      body = (await request.json()) as { changeId?: string };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (!body.changeId) {
      return NextResponse.json({ error: "Missing changeId" }, { status: 400 });
    }
    const { data: change } = await supabase
      .from("subscription_plan_changes")
      .select("*")
      .eq("id", body.changeId)
      .in("status", ["requested", "scheduled"])
      .maybeSingle();
    if (!change || change.user_id !== user.id) {
      return NextResponse.json({ error: "Pending change not found" }, { status: 404 });
    }

    const stripe = getStripe();
    if (change.provider_schedule_id) {
      const schedule = await stripe.subscriptionSchedules.retrieve(
        change.provider_schedule_id,
      );
      if (schedule.status === "active" || schedule.status === "not_started") {
        await stripe.subscriptionSchedules.release(change.provider_schedule_id);
      }
    }
    const admin = createAdminClient();
    await admin
      .from("subscription_plan_changes")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("id", change.id);
    await admin
      .from("user_entitlements")
      .update({ provider_schedule_id: null })
      .eq("id", change.entitlement_id);

    return NextResponse.json({ outcome: "canceled" });
  } catch (error) {
    console.error("[stripe-change-plan] cancel failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Could not cancel the pending plan change" },
      { status: 500 },
    );
  }
}
