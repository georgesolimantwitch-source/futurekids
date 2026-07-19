import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStripe,
  stripeSubscriptionToVerified,
} from "@/lib/subscriptions/stripe";
import { applyVerifiedSubscriptionEvent } from "@/lib/subscriptions/store";

type ManageAction = "cancel" | "resume";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      entitlementId?: string;
      action?: ManageAction;
    };
    if (
      !body.entitlementId ||
      (body.action !== "cancel" && body.action !== "resume")
    ) {
      return NextResponse.json(
        { error: "Invalid subscription action" },
        { status: 400 },
      );
    }

    const { data: entitlement, error: entitlementError } = await supabase
      .from("user_entitlements")
      .select("user_id, provider, provider_subscription_id")
      .eq("id", body.entitlementId)
      .eq("provider", "stripe")
      .maybeSingle();

    if (
      entitlementError ||
      !entitlement ||
      entitlement.user_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    const stripe = getStripe();
    const current = await stripe.subscriptions.retrieve(
      entitlement.provider_subscription_id,
    );
    if (current.metadata.future_kids_user_id !== user.id) {
      return NextResponse.json(
        { error: "Billing identity mismatch" },
        { status: 409 },
      );
    }

    const updated = await stripe.subscriptions.update(current.id, {
      cancel_at_period_end: body.action === "cancel",
    });
    const verified = stripeSubscriptionToVerified(updated);
    await applyVerifiedSubscriptionEvent(
      {
        eventId: `dashboard.${body.action}.${updated.id}.${Date.now()}`,
        eventType: `dashboard.subscription.${body.action}`,
        occurredAt: new Date().toISOString(),
      },
      verified,
    );

    return NextResponse.json({
      ok: true,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      currentPeriodEnd: verified.currentPeriodEnd,
    });
  } catch (error) {
    console.error("[stripe-manage] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Could not update this subscription" },
      { status: 500 },
    );
  }
}
