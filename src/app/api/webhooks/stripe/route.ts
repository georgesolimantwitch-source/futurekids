import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { applyVerifiedSubscriptionEvent } from "@/lib/subscriptions/store";
import { syncEarnlyChildAccess } from "@/lib/subscriptions/earnly-sync";
import {
  getStripe,
  stripeSubscriptionToVerified,
} from "@/lib/subscriptions/stripe";
import {
  handleScholarsCreditCheckoutCompleted,
  handleScholarsCreditInvoicePaid,
  handleScholarsCreditSubscriptionDeleted,
} from "@/lib/scholars/credit-webhooks";

export const runtime = "nodejs";

const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "subscription_schedule.updated",
  "subscription_schedule.completed",
  "subscription_schedule.released",
  "subscription_schedule.canceled",
  "subscription_schedule.aborted",
]);

function expandableId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  const direct = expandableId(legacy.subscription);
  if (direct) return direct;

  const parent = invoice.parent;
  if (parent?.type !== "subscription_details") return null;
  return expandableId(parent.subscription_details?.subscription);
}

async function subscriptionFromEvent(
  stripe: Stripe,
  event: Stripe.Event,
): Promise<Stripe.Subscription | null> {
  if (event.type.startsWith("customer.subscription.")) {
    return event.data.object as Stripe.Subscription;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = expandableId(session.subscription);
    return subscriptionId ? stripe.subscriptions.retrieve(subscriptionId) : null;
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const subscriptionId = invoiceSubscriptionId(event.data.object as Stripe.Invoice);
    return subscriptionId ? stripe.subscriptions.retrieve(subscriptionId) : null;
  }

  if (event.type.startsWith("subscription_schedule.")) {
    const schedule = event.data.object as Stripe.SubscriptionSchedule;
    const subscriptionId =
      expandableId(schedule.subscription) ??
      expandableId(schedule.released_subscription);
    return subscriptionId ? stripe.subscriptions.retrieve(subscriptionId) : null;
  }

  return null;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    console.error("[stripe-webhook] missing signature or configuration");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("[stripe-webhook] signature verification failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const stripe = getStripe();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const creditHandled = await handleScholarsCreditCheckoutCompleted(
        session,
        event.id,
      );
      // Credit-only sessions (no All Access / app plan_key) finish here.
      if (
        creditHandled &&
        session.metadata?.credit_checkout === "true" &&
        !session.metadata?.plan_key
      ) {
        return NextResponse.json({ received: true, scholarsCredits: true });
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const creditHandled = await handleScholarsCreditInvoicePaid(
        invoice,
        event.id,
      );
      if (creditHandled) {
        const subscriptionId = invoiceSubscriptionId(invoice);
        const sub = subscriptionId
          ? await stripe.subscriptions.retrieve(subscriptionId)
          : null;
        if (
          sub?.metadata?.credit_checkout === "true" &&
          !sub.metadata?.plan_key
        ) {
          return NextResponse.json({ received: true, scholarsCredits: true });
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const handled = await handleScholarsCreditSubscriptionDeleted(subscription);
      if (
        handled &&
        subscription.metadata.credit_checkout === "true" &&
        !subscription.metadata.plan_key
      ) {
        return NextResponse.json({ received: true, scholarsCredits: true });
      }
    }

    const subscription = await subscriptionFromEvent(stripe, event);
    if (!subscription) {
      // One-time payment without subscription already handled above, or unrelated
      if (event.type === "checkout.session.completed") {
        return NextResponse.json({ received: true, ignored: true });
      }
      throw new Error("Event did not resolve to a Stripe subscription");
    }

    // Credit-only subscriptions skip entitlement mapping.
    if (
      subscription.metadata.credit_checkout === "true" &&
      !subscription.metadata.plan_key
    ) {
      return NextResponse.json({ received: true, scholarsCredits: true });
    }

    const entitlement = stripeSubscriptionToVerified(subscription);
    const application = await applyVerifiedSubscriptionEvent(
      {
        eventId: event.id,
        eventType: event.type,
        occurredAt: new Date(event.created * 1000).toISOString(),
      },
      entitlement,
    );
    if (
      entitlement.appKey === "earnly" ||
      entitlement.appKey === "futurekids_all_access"
    ) {
      await syncEarnlyChildAccess(entitlement.userId);
    }

    console.info("[stripe-webhook] entitlement synchronized", {
      eventId: event.id,
      eventType: event.type,
      userId: entitlement.userId,
      appKey: entitlement.appKey,
      planKey: entitlement.planKey,
      status: entitlement.status,
    });

    return NextResponse.json({
      received: true,
      duplicate: application.outcome === "duplicate",
      stale: application.outcome === "stale",
    });
  } catch (error) {
    console.error("[stripe-webhook] processing failed", {
      eventId: event.id,
      eventType: event.type,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
