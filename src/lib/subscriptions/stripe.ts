import Stripe from "stripe";
import { statusFromStripe, type VerifiedSubscription } from "./catalog";
import {
  configuredStripePriceId,
  configuredStripeProductId,
  getProductPlan,
  type ProductCatalogPlan,
} from "./product-catalog";

export function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(secret);
}

export function getServerCheckoutPlan(planKey: string) {
  const plan = getProductPlan(planKey);
  if (!plan) return null;
  return { plan, priceId: configuredStripePriceId(plan) };
}

function productId(
  product: string | Stripe.Product | Stripe.DeletedProduct,
): string {
  return typeof product === "string" ? product : product.id;
}

export async function assertStripePriceMatchesCatalog(
  stripe: Stripe,
  plan: ProductCatalogPlan,
  priceId: string,
): Promise<void> {
  const price = await stripe.prices.retrieve(priceId);
  if (
    !price.active ||
    price.currency !== "usd" ||
    price.unit_amount !== plan.expectedAmountCents ||
    price.recurring?.interval !== plan.interval ||
    productId(price.product) !== configuredStripeProductId(plan)
  ) {
    throw new Error("Existing Stripe price does not match the Future Kids catalog");
  }
}

export function stripeSubscriptionToVerified(
  subscription: Stripe.Subscription,
): VerifiedSubscription {
  const userId = subscription.metadata.future_kids_user_id;
  const planKey = subscription.metadata.plan_key;
  const appKey = subscription.metadata.app_key;
  if (!userId || !planKey || !appKey) {
    throw new Error("Stripe subscription is missing Future Kids account metadata");
  }

  const mapped = getServerCheckoutPlan(planKey);
  if (!mapped || mapped.plan.appKey !== appKey) {
    throw new Error("Stripe app and plan metadata do not match the catalog");
  }

  const item = subscription.items.data.find(
    (candidate) => candidate.price.id === mapped.priceId,
  );
  if (
    !item ||
    productId(item.price.product) !== configuredStripeProductId(mapped.plan)
  ) {
    throw new Error("Stripe subscription item is not an existing Future Kids product");
  }

  const periodStart = item.current_period_start
    ? new Date(item.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = item.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;
  const metadataQuantity = Number(subscription.metadata.child_count);
  const quantity = Math.min(
    100,
    Math.max(
      1,
      Math.trunc(Number.isFinite(metadataQuantity) ? metadataQuantity : item.quantity ?? 1),
    ),
  );

  return {
    userId,
    appKey: mapped.plan.appKey,
    planKey: mapped.plan.planKey,
    provider: "stripe",
    providerCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    providerSubscriptionId: subscription.id,
    providerProductId: productId(item.price.product),
    providerPriceId: item.price.id,
    status: statusFromStripe(subscription.status, periodEnd),
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    quantity,
    tierKey: mapped.plan.tierKey,
    entitlementRank: mapped.plan.entitlementRank,
    childLimit: mapped.plan.childLimit,
    limits: mapped.plan.limits,
    features: mapped.plan.features,
    currentTransactionId: null,
    environment: subscription.livemode ? "production" : "sandbox",
    autoRenewStatus: !subscription.cancel_at_period_end,
  };
}
