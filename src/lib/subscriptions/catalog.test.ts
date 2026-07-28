import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import { productCatalog } from "./product-catalog";
import { stripeSubscriptionToVerified } from "./stripe";
import { statusFromAppleTransaction } from "./catalog";
import { appleTransactionToSubscription } from "./apple";

test("catalog includes existing Stripe prices including Freshys and TinyPal child tiers", () => {
  assert.ok(productCatalog.length >= 106);
  assert.equal(
    new Set(productCatalog.map((plan) => plan.stripePriceId)).size,
    productCatalog.length,
  );
  // TinyPal kids1 monthly reuses the original $4.99 price id
  assert.equal(
    productCatalog.find((plan) => plan.planKey === "tinypal_kids1_monthly")
      ?.expectedAmountCents,
    499,
  );
  assert.equal(
    productCatalog.find((plan) => plan.planKey === "tinypal_kids2_monthly")
      ?.expectedAmountCents,
    698,
  );
  assert.equal(
    productCatalog.find(
      (plan) => plan.planKey === "futurekids_all_access_earnly1_tinypal2_monthly",
    )?.expectedAmountCents,
    2198,
  );
  assert.equal(
    productCatalog.find((plan) => plan.planKey === "ballr_kids2_monthly")
      ?.expectedAmountCents,
    698,
  );
  assert.equal(
    productCatalog.find((plan) => plan.planKey === "scholars_all_access_kids2_monthly")
      ?.expectedAmountCents,
    2998,
  );
  assert.ok(
    productCatalog.find(
      (plan) => plan.planKey === "futurekids_all_access_e1_s2_b2_t1_monthly",
    ),
  );
});

test("Earnly charges $1.99 monthly per child and ten months yearly", () => {
  for (let childCount = 1; childCount <= 6; childCount += 1) {
    const monthly = productCatalog.find(
      (plan) => plan.planKey === `earnly_kids${childCount}_monthly`,
    );
    const yearly = productCatalog.find(
      (plan) => plan.planKey === `earnly_kids${childCount}_yearly`,
    );
    assert.equal(monthly?.expectedAmountCents, 199 * childCount);
    assert.equal(yearly?.expectedAmountCents, 1_990 * childCount);
  }
});

test("separate Stripe subscriptions produce separate app entitlements", () => {
  const earnly = stripeSubscriptionToVerified(
    subscription("sub_earnly", "earnly", "earnly_kids2_monthly", 2),
  );
  const tinypal = stripeSubscriptionToVerified(
    subscription("sub_tinypal", "tinypal", "tinypal_kids1_monthly", 1),
  );

  assert.equal(earnly.appKey, "earnly");
  assert.equal(earnly.quantity, 2);
  assert.equal(earnly.childLimit, 2);
  assert.equal(earnly.features.familyDashboard, true);
  assert.equal(tinypal.appKey, "tinypal");
  assert.notEqual(earnly.providerSubscriptionId, tinypal.providerSubscriptionId);
});

test("All Access remains a single entitlement that the RPC expands", () => {
  const allAccess = stripeSubscriptionToVerified(
    subscription(
      "sub_all_access",
      "futurekids_all_access",
      "futurekids_all_access_kids1_monthly",
      1,
    ),
  );
  assert.equal(allAccess.appKey, "futurekids_all_access");
  assert.equal(allAccess.planKey, "futurekids_all_access_kids1_monthly");
  assert.equal(allAccess.entitlementRank, 1000);
  assert.equal(allAccess.features.allAccess, true);
});

test("Apple lifecycle status distinguishes retry, grace, expiration, and revocation", () => {
  const future = Date.now() + 86_400_000;
  assert.equal(
    statusFromAppleTransaction({ expiresDate: future, notificationStatus: 3 }),
    "past_due",
  );
  assert.equal(
    statusFromAppleTransaction({ expiresDate: future, notificationStatus: 4 }),
    "grace_period",
  );
  assert.equal(
    statusFromAppleTransaction({ expiresDate: future, notificationStatus: 5 }),
    "revoked",
  );
  assert.equal(
    statusFromAppleTransaction({ expiresDate: Date.now() - 1 }),
    "expired",
  );
});

test("Apple appAccountToken cannot be claimed by a different Future Kids user", () => {
  process.env.APPLE_EARNLY_BUNDLE_ID = "com.futurekids.earnly";
  process.env.APPLE_EARNLY_APP_ID = "123456789";
  process.env.APPLE_EARNLY_KIDS1_MONTHLY_PRODUCT_ID =
    "com.futurekids.earnly.kids1.monthly";
  const transaction = {
    bundleId: "com.futurekids.earnly",
    productId: "com.futurekids.earnly.kids1.monthly",
    originalTransactionId: "original-1",
    transactionId: "transaction-1",
    appAccountToken: "00000000-0000-4000-8000-000000000001",
    expiresDate: Date.now() + 86_400_000,
  };

  assert.throws(
    () =>
      appleTransactionToSubscription(
        transaction,
        "00000000-0000-4000-8000-000000000002",
        "earnly",
      ),
    /not linked/,
  );
});

function subscription(
  id: string,
  appKey: string,
  planKey: string,
  quantity: number,
): Stripe.Subscription {
  const plan = productCatalog.find((candidate) => candidate.planKey === planKey);
  assert.ok(plan);
  const future = Math.floor(Date.parse("2999-01-01T00:00:00Z") / 1000);
  return {
    id,
    status: "active",
    customer: "cus_future_kids",
    cancel_at_period_end: false,
    metadata: {
      future_kids_user_id: "00000000-0000-4000-8000-000000000001",
      app_key: appKey,
      plan_key: planKey,
      child_count: String(quantity),
    },
    items: {
      data: [
        {
          quantity,
          current_period_start: future - 2_592_000,
          current_period_end: future,
          price: {
            id: plan.stripePriceId,
            product: plan.stripeProductId,
          },
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}
