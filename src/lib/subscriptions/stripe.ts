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

export function stripeSecretMode(): "live" | "test" | "unknown" {
  const secret = process.env.STRIPE_SECRET_KEY ?? "";
  if (secret.startsWith("sk_live")) return "live";
  if (secret.startsWith("sk_test")) return "test";
  return "unknown";
}

/** True when a stored customer/price ID belongs to the opposite Stripe mode. */
export function isStripeModeMismatchError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /similar object exists in (test|live) mode|test mode.*live mode key|live mode.*test mode key/i.test(
    message,
  );
}

export function isMissingStripeCustomerError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /No such customer/i.test(message) || isStripeModeMismatchError(error);
}

/**
 * Return a Stripe customer ID that exists in the current API mode.
 * Test-mode IDs left over from sandbox testing are replaced with a new live customer.
 */
export async function ensureStripeCustomerId(options: {
  stripe: Stripe;
  userId: string;
  existingCustomerId?: string | null;
  email?: string | null;
  name?: string | null;
  persist: (customerId: string) => Promise<void>;
}): Promise<string> {
  const { stripe, userId, email, name, persist } = options;
  let customerId = options.existingCustomerId?.trim() || undefined;

  if (customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        customerId = undefined;
      } else {
        const linkedUserId = customer.metadata.future_kids_user_id;
        if (linkedUserId && linkedUserId !== userId) {
          throw new Error("Stripe customer belongs to a different user");
        }
        if (!linkedUserId) {
          await stripe.customers.update(customer.id, {
            metadata: { future_kids_user_id: userId },
          });
        }
        return customer.id;
      }
    } catch (error) {
      if (!isMissingStripeCustomerError(error)) throw error;
      // Stale test/live mismatch or deleted customer — create a fresh one below.
      customerId = undefined;
    }
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    name: name ?? undefined,
    metadata: { future_kids_user_id: userId },
  });
  await persist(customer.id);
  return customer.id;
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

function stripeModeMismatchMessage(
  error: unknown,
  subject: "price" | "subscription" | "object" = "object",
): string | null {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/test mode.*live mode key|live mode.*test mode key|similar object exists in (test|live) mode/i.test(message)) {
    const mode = stripeSecretMode();
    const other = mode === "live" ? "test" : mode === "test" ? "live" : "the other";
    if (subject === "price") {
      return `Stripe is configured in ${mode} mode, but this plan's price ID belongs to ${other} mode. Align STRIPE_SECRET_KEY with the STRIPE_*_PRICE_ID values (on Vercel for production — .env.local only affects local).`;
    }
    if (subject === "subscription") {
      return `Stripe is configured in ${mode} mode, but your existing website subscription was created in ${other} mode. Cancel the old ${other}-mode subscriptions (or clear those entitlements) and start a new All Access checkout with the current Stripe keys.`;
    }
    return `Stripe is configured in ${mode} mode, but a related Stripe object belongs to ${other} mode. Align STRIPE_SECRET_KEY / price IDs, and make sure existing subscriptions were created in the same mode.`;
  }
  if (/No such price/i.test(message)) {
    return "Stripe could not find this plan's price. Check the STRIPE_*_PRICE_ID environment variables.";
  }
  return null;
}

export async function assertStripePriceMatchesCatalog(
  stripe: Stripe,
  plan: ProductCatalogPlan,
  priceId: string,
): Promise<void> {
  if (!priceId) {
    throw new Error(
      `Missing Stripe price for ${plan.planKey}. Set ${plan.stripePriceEnv}.`,
    );
  }

  let price: Stripe.Price;
  try {
    price = await stripe.prices.retrieve(priceId);
  } catch (error) {
    throw new Error(
      stripeModeMismatchMessage(error, "price") ??
        (error instanceof Error ? error.message : "Could not load Stripe price"),
    );
  }

  if (
    !price.active ||
    price.currency !== "usd" ||
    price.unit_amount !== plan.expectedAmountCents ||
    price.recurring?.interval !== plan.interval ||
    productId(price.product) !== configuredStripeProductId(plan)
  ) {
    throw new Error(
      `Stripe price for ${plan.planKey} does not match the Genlyn catalog (amount, interval, or product).`,
    );
  }
}

export { stripeModeMismatchMessage };

export function stripeSubscriptionToVerified(
  subscription: Stripe.Subscription,
): VerifiedSubscription {
  const userId = subscription.metadata.future_kids_user_id;
  const planKey = subscription.metadata.plan_key;
  const appKey = subscription.metadata.app_key;
  if (!userId || !planKey || !appKey) {
    throw new Error("Stripe subscription is missing Genlyn account metadata");
  }

  const mapped = getServerCheckoutPlan(planKey);
  if (!mapped || mapped.plan.appKey !== appKey) {
    throw new Error("Stripe app and plan metadata do not match the catalog");
  }

  const expectedProductId = configuredStripeProductId(mapped.plan);
  const item =
    subscription.items.data.find(
      (candidate) => candidate.price.id === mapped.priceId,
    ) ??
    subscription.items.data.find(
      (candidate) => productId(candidate.price.product) === expectedProductId,
    );
  if (
    !item ||
    productId(item.price.product) !== expectedProductId
  ) {
    throw new Error("Stripe subscription item is not an existing Genlyn product");
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

  const metadataScholars = Number(subscription.metadata.scholars_child_count);
  const scholarsChildLimit =
    Number.isFinite(metadataScholars) && metadataScholars >= 1
      ? Math.min(6, Math.trunc(metadataScholars))
      : Number(mapped.plan.limits?.scholarsChildLimit) || null;

  const childLimit = mapped.plan.perChildQuantity
    ? quantity
    : mapped.plan.childLimit;
  const limits = mapped.plan.perChildQuantity
    ? {
        ...mapped.plan.limits,
        childLimit: quantity,
        ...(mapped.plan.appKey === "scholars"
          ? { scholarsChildLimit: quantity }
          : {}),
        ...(mapped.plan.appKey === "tinypal"
          ? { tinypalChildLimit: quantity }
          : {}),
        ...(mapped.plan.appKey === "ballr"
          ? { ballrChildLimit: quantity }
          : {}),
      }
    : {
        ...mapped.plan.limits,
        ...(mapped.plan.appKey === "futurekids_all_access" && scholarsChildLimit
          ? { scholarsChildLimit }
          : {}),
      };

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
    childLimit,
    limits,
    features: mapped.plan.features,
    currentTransactionId: null,
    environment: subscription.livemode ? "production" : "sandbox",
    autoRenewStatus: !subscription.cancel_at_period_end,
  };
}
