import assert from "node:assert/strict";
import test from "node:test";
import {
  configuredStripePriceId,
  getProductPlan,
  isAppKey,
  productCatalog,
} from "./product-catalog";
import { stripeSubscriptionToVerified } from "./stripe";
import type Stripe from "stripe";
import {
  entitlementForApp,
  entitlementIsActive,
} from "@/lib/auth/account-view";
import type { EcosystemAccount, UserEntitlement } from "@/lib/auth/types";
import { apps } from "@/config/brand";
import { pricingPlans } from "@/config/pricing";
import { ecosystemBundle } from "@/config/ecosystem-bundle";

test("Freshys appears in the app catalog and pricing plans", () => {
  assert.ok(apps.some((app) => app.slug === "fresher"));
  assert.ok(pricingPlans.some((plan) => plan.appId === "fresher"));
  assert.ok(
    ecosystemBundle.includedApps.some((app) => app.slug === "fresher"),
  );
  assert.equal(isAppKey("fresher"), true);
});

test("product catalog includes Freshys monthly (150¢) and yearly (999¢)", () => {
  assert.ok(productCatalog.length >= 36);
  const monthly = getProductPlan("fresher_monthly");
  const yearly = getProductPlan("fresher_yearly");
  assert.ok(monthly);
  assert.ok(yearly);
  assert.equal(monthly?.expectedAmountCents, 150);
  assert.equal(yearly?.expectedAmountCents, 999);
  assert.equal(monthly?.appKey, "fresher");
  assert.equal(yearly?.appKey, "fresher");
  assert.equal(monthly?.stripePriceEnv, "STRIPE_FRESHER_MONTHLY_PRICE_ID");
  assert.equal(yearly?.stripePriceEnv, "STRIPE_FRESHER_YEARLY_PRICE_ID");
});

test("Freshys checkout resolves Stripe price IDs from environment variables", () => {
  const previousMonthly = process.env.STRIPE_FRESHER_MONTHLY_PRICE_ID;
  const previousYearly = process.env.STRIPE_FRESHER_YEARLY_PRICE_ID;
  try {
    process.env.STRIPE_FRESHER_MONTHLY_PRICE_ID = "price_test_fresher_monthly";
    process.env.STRIPE_FRESHER_YEARLY_PRICE_ID = "price_test_fresher_yearly";
    const monthly = getProductPlan("fresher_monthly")!;
    const yearly = getProductPlan("fresher_yearly")!;
    assert.equal(configuredStripePriceId(monthly), "price_test_fresher_monthly");
    assert.equal(configuredStripePriceId(yearly), "price_test_fresher_yearly");
  } finally {
    if (previousMonthly === undefined) {
      delete process.env.STRIPE_FRESHER_MONTHLY_PRICE_ID;
    } else {
      process.env.STRIPE_FRESHER_MONTHLY_PRICE_ID = previousMonthly;
    }
    if (previousYearly === undefined) {
      delete process.env.STRIPE_FRESHER_YEARLY_PRICE_ID;
    } else {
      process.env.STRIPE_FRESHER_YEARLY_PRICE_ID = previousYearly;
    }
  }
});

test("active Freshys subscription grants the fresher entitlement", () => {
  const verified = stripeSubscriptionToVerified(
    subscription("sub_fresher", "fresher", "fresher_monthly", 1),
  );
  assert.equal(verified.appKey, "fresher");
  assert.equal(verified.planKey, "fresher_monthly");
  assert.equal(verified.features.localFoodMap, true);

  const account = accountWithEntitlements([
    entitlement({
      app_key: "fresher",
      plan_key: "fresher_monthly",
      status: "active",
      current_period_end: futureIso(),
    }),
  ]);
  assert.equal(entitlementForApp(account, "fresher")?.app_key, "fresher");
  assert.equal(entitlementIsActive(entitlementForApp(account, "fresher")!), true);
});

test("All Access grants the fresher entitlement", () => {
  const account = accountWithEntitlements([
    entitlement({
      app_key: "futurekids_all_access",
      plan_key: "futurekids_all_access_kids1_monthly",
      status: "active",
      entitlement_rank: 1000,
      current_period_end: futureIso(),
    }),
  ]);
  assert.equal(entitlementForApp(account, "fresher")?.app_key, "futurekids_all_access");
});

test("cancelled or expired Freshys subscriptions do not unlock Freshys", () => {
  const expired = accountWithEntitlements([
    entitlement({
      app_key: "fresher",
      plan_key: "fresher_monthly",
      status: "active",
      current_period_end: pastIso(),
    }),
  ]);
  assert.equal(entitlementForApp(expired, "fresher"), undefined);

  const inactive = accountWithEntitlements([
    entitlement({
      app_key: "fresher",
      plan_key: "fresher_yearly",
      status: "expired",
      current_period_end: futureIso(),
    }),
  ]);
  assert.equal(entitlementForApp(inactive, "fresher"), undefined);
});

test("existing apps remain in the catalog unchanged", () => {
  for (const planKey of [
    "earnly_kids1_monthly",
    "tinypal_kids1_monthly",
    "ballr_monthly",
    "scholars_all_access_monthly",
    "ballr_kids3_monthly",
    "scholars_all_access_kids2_yearly",
  ] as const) {
    assert.ok(getProductPlan(planKey));
  }
  assert.ok(productCatalog.filter((plan) => plan.stripePriceId).length >= 106);
});

function futureIso() {
  return new Date(Date.now() + 86_400_000).toISOString();
}

function pastIso() {
  return new Date(Date.now() - 86_400_000).toISOString();
}

function entitlement(
  partial: Partial<UserEntitlement> &
    Pick<UserEntitlement, "app_key" | "plan_key" | "status">,
): UserEntitlement {
  return {
    id: partial.id ?? "ent_1",
    app_key: partial.app_key,
    plan_key: partial.plan_key,
    provider: partial.provider ?? "stripe",
    status: partial.status,
    current_period_start: partial.current_period_start ?? null,
    current_period_end: partial.current_period_end ?? null,
    cancel_at_period_end: partial.cancel_at_period_end ?? false,
    quantity: partial.quantity ?? 1,
    tier_key: partial.tier_key ?? "premium",
    entitlement_rank: partial.entitlement_rank ?? 300,
    child_limit: partial.child_limit ?? null,
    limits: partial.limits ?? {},
    features: partial.features ?? {},
    provider_subscription_id: partial.provider_subscription_id ?? "sub_1",
    provider_product_id: partial.provider_product_id ?? null,
    provider_price_id: partial.provider_price_id ?? null,
    environment: partial.environment ?? null,
    auto_renew_status: partial.auto_renew_status ?? null,
    created_at: partial.created_at ?? new Date().toISOString(),
    updated_at: partial.updated_at ?? new Date().toISOString(),
  };
}

function accountWithEntitlements(entitlements: UserEntitlement[]): EcosystemAccount {
  return {
    user_id: "user_1",
    profile: {
      id: "user_1",
      email: "parent@example.com",
      full_name: "Parent",
      avatar_url: null,
      account_type: "parent",
      stripe_customer_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    families: [],
    family_members: [],
    subscriptions: [],
    app_access: [],
    entitlements,
    effective_access: [],
  };
}

function subscription(
  id: string,
  appKey: string,
  planKey: string,
  quantity: number,
): Stripe.Subscription {
  const plan = productCatalog.find((candidate) => candidate.planKey === planKey);
  if (!plan) throw new Error(`missing plan ${planKey}`);
  const priceId =
    process.env[plan.stripePriceEnv]?.trim() ||
    plan.stripePriceId ||
    `price_test_${planKey}`;
  const future = Math.floor(Date.parse("2999-01-01T00:00:00Z") / 1000);
  return {
    id,
    status: "active",
    customer: "cus_test",
    cancel_at_period_end: false,
    metadata: {
      future_kids_user_id: "00000000-0000-4000-8000-000000000001",
      app_key: appKey,
      plan_key: planKey,
      entitlement: appKey,
      child_count: String(quantity),
    },
    items: {
      data: [
        {
          quantity,
          current_period_start: future - 2_592_000,
          current_period_end: future,
          price: {
            id: priceId,
            product: plan.stripeProductId || `prod_test_${appKey}`,
          },
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}
