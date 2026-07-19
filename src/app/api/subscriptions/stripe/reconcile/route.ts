import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyVerifiedSubscriptionEvent } from "@/lib/subscriptions/store";
import {
  getStripe,
  stripeSubscriptionToVerified,
} from "@/lib/subscriptions/stripe";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ reconciled: 0 });
    }

    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
    if (
      customer.deleted ||
      (customer.metadata.future_kids_user_id &&
        customer.metadata.future_kids_user_id !== user.id)
    ) {
      return NextResponse.json({ error: "Billing identity mismatch" }, { status: 409 });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 100,
    });
    let reconciled = 0;
    for (const stripeSubscription of subscriptions.data) {
      try {
        const subscription = stripeSubscriptionToVerified(stripeSubscription);
        if (subscription.userId !== user.id) continue;
        await applyVerifiedSubscriptionEvent(
          {
            eventId: [
              "reconcile",
              stripeSubscription.id,
              stripeSubscription.status,
              subscription.planKey,
              subscription.providerPriceId ?? "no-price",
              subscription.currentPeriodStart ?? "no-start",
              subscription.currentPeriodEnd ?? "no-end",
              typeof stripeSubscription.schedule === "string"
                ? stripeSubscription.schedule
                : (stripeSubscription.schedule?.id ?? "no-schedule"),
              String(subscription.cancelAtPeriodEnd),
            ].join(":"),
            eventType: "stripe.reconciliation",
            occurredAt: new Date().toISOString(),
          },
          subscription,
        );
        reconciled += 1;
      } catch (error) {
        console.warn("[stripe-reconcile] skipped untrusted subscription", {
          subscriptionId: stripeSubscription.id,
          message: error instanceof Error ? error.message : "unknown",
        });
      }
    }
    return NextResponse.json({ reconciled });
  } catch (error) {
    console.error("[stripe-reconcile] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Reconciliation failed" }, { status: 500 });
  }
}
