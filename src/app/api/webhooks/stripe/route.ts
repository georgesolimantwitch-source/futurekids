import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { applyVerifiedSubscriptionEvent } from "@/lib/subscriptions/store";
import { syncEarnlyChildAccess } from "@/lib/subscriptions/earnly-sync";
import {
  getServerCheckoutPlan,
  getStripe,
  stripeSubscriptionToVerified,
} from "@/lib/subscriptions/stripe";
import {
  handleScholarsCreditCheckoutCompleted,
  handleScholarsCreditInvoicePaid,
  handleScholarsCreditSubscriptionDeleted,
} from "@/lib/scholars/credit-webhooks";
import { notifyEarnlyCreatorAttribution } from "@/lib/earnly/creator-attribution";
import {
  isHubPaymentIntent,
  markHubOrderPaid,
  markHubOrderPaymentFailed,
} from "@/lib/hub/orders";
import {
  recordCommissionAndTransfer,
  resolveCreatorForBuyer,
} from "@/lib/creators/store";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
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

function invoiceLinePriceId(line: Stripe.InvoiceLineItem): string | null {
  const legacy = (line as Stripe.InvoiceLineItem & {
    price?: string | { id: string } | null;
  }).price;
  return (
    expandableId(legacy) ??
    expandableId(line.pricing?.price_details?.price) ??
    null
  );
}

/** Paid amount for the Earnly plan line only (excludes Scholars credit add-ons). */
function earnlyInvoiceAmountCents(
  invoice: Stripe.Invoice,
  planKey: string,
): number {
  const planPriceId = getServerCheckoutPlan(planKey)?.priceId;
  const lines = invoice.lines?.data ?? [];
  const planLines = planPriceId
    ? lines.filter((line) => invoiceLinePriceId(line) === planPriceId)
    : [];
  // If the invoice mixes the plan with add-ons (e.g. Scholars credits), count only the plan line.
  if (planLines.length > 0 && planLines.length < lines.length) {
    return Math.max(
      0,
      planLines.reduce((sum, line) => sum + (line.amount ?? 0), 0),
    );
  }
  return Math.max(0, invoice.amount_paid ?? 0);
}

async function notifyEarnlyAttributionForEvent(
  event: Stripe.Event,
  subscription: Stripe.Subscription,
  userId: string,
  planKey: string,
  duplicate: boolean,
): Promise<void> {
  try {
    if (duplicate) return;

    if (event.type === "customer.subscription.deleted") {
      const code = subscription.metadata?.creator_code?.trim();
      if (!code) return;
      await notifyEarnlyCreatorAttribution({
        creator_code: code,
        amount_cents: 0,
        currency: subscription.currency || "usd",
        event_type: "cancel",
        product_id: planKey,
        user_id: userId,
        stripe_subscription_id: subscription.id,
        billed_at: new Date(event.created * 1000).toISOString(),
      });
      return;
    }

    if (event.type !== "invoice.paid") return;
    const invoice = event.data.object as Stripe.Invoice;
    const code = (
      subscription.metadata?.creator_code || invoice.metadata?.creator_code
    )?.trim();
    if (!code) return;

    const reason = (invoice as Stripe.Invoice & { billing_reason?: string | null })
      .billing_reason;
    let eventType: "purchase" | "renewal";
    if (reason === "subscription_create") eventType = "purchase";
    else if (reason === "subscription_cycle") eventType = "renewal";
    else return;

    const amount = earnlyInvoiceAmountCents(invoice, planKey);
    if (amount <= 0) return;

    await notifyEarnlyCreatorAttribution({
      creator_code: code,
      amount_cents: amount,
      currency: invoice.currency || "usd",
      event_type: eventType,
      product_id: planKey,
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscription.id,
      billed_at: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : new Date().toISOString(),
    });
  } catch (error) {
    console.error("[stripe-webhook] earnly attribution failed", {
      eventId: event.id,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
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

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      if (isHubPaymentIntent(intent.metadata)) {
        await markHubOrderPaid(intent.id);
        const buyerId = intent.metadata.user_id || null;
        const code = intent.metadata.creator_code;
        if (buyerId) {
          const creator = await resolveCreatorForBuyer({
            buyerUserId: buyerId,
            creatorCode: code || null,
            source: "hub_payment",
          });
          if (creator) {
            const admin = createAdminClient();
            const { data: order } = await admin
              .from("hub_orders")
              .select("id")
              .eq("stripe_payment_intent_id", intent.id)
              .maybeSingle();
            await recordCommissionAndTransfer({
              creatorId: creator.id,
              buyerUserId: buyerId,
              source: "hub",
              grossCents: intent.amount_received || intent.amount || 0,
              currency: intent.currency || "usd",
              stripePaymentIntentId: intent.id,
              hubOrderId: order?.id ?? null,
              description: `Hub ${intent.metadata.size || ""} · 20%`,
            });
          }
        }
        return NextResponse.json({ received: true, hubOrder: true });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      if (isHubPaymentIntent(intent.metadata)) {
        await markHubOrderPaymentFailed(intent.id);
        return NextResponse.json({ received: true, hubOrder: true });
      }
    }

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
      await notifyEarnlyAttributionForEvent(
        event,
        subscription,
        entitlement.userId,
        entitlement.planKey,
        application.outcome === "duplicate",
      );
    }

    // Genlyn Creator Program — 20% of subscription charges while attributed
    if (event.type === "invoice.paid" && application.outcome !== "duplicate") {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        const code =
          subscription.metadata?.creator_code ||
          invoice.metadata?.creator_code ||
          null;
        const creator = await resolveCreatorForBuyer({
          buyerUserId: entitlement.userId,
          creatorCode: code,
          source: `invoice:${entitlement.appKey}`,
        });
        if (creator) {
          const gross = Math.max(0, invoice.amount_paid ?? 0);
          await recordCommissionAndTransfer({
            creatorId: creator.id,
            buyerUserId: entitlement.userId,
            source: "subscription",
            grossCents: gross,
            currency: invoice.currency || "usd",
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: subscription.id,
            description: `${entitlement.planKey} · 20%`,
          });
        }
      } catch (creatorError) {
        console.error("[stripe-webhook] genlyn creator commission failed", {
          eventId: event.id,
          message:
            creatorError instanceof Error ? creatorError.message : "unknown",
        });
      }
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
