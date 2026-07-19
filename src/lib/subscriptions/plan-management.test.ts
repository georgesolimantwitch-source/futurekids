import assert from "node:assert/strict";
import test from "node:test";
import {
  activeEntitlementForApp,
  planChangeTiming,
  type PlanManagementContext,
} from "./plan-management";

const context: PlanManagementContext = {
  children: [],
  pendingChanges: [],
  entitlements: [
    {
      id: "direct",
      user_id: "user",
      app_key: "earnly",
      plan_key: "earnly_kids4_monthly",
      provider: "stripe",
      status: "active",
      child_limit: 4,
      current_period_end: "2099-01-01T00:00:00.000Z",
      cancel_at_period_end: false,
      entitlement_rank: 200,
    },
    {
      id: "apple",
      user_id: "user",
      app_key: "earnly",
      plan_key: "earnly_kids2_monthly",
      provider: "apple",
      status: "active",
      child_limit: 2,
      current_period_end: "2099-01-01T00:00:00.000Z",
      cancel_at_period_end: false,
      entitlement_rank: 100,
    },
  ],
};

test("plan management chooses the strongest same-app entitlement", () => {
  assert.equal(activeEntitlementForApp(context, "earnly")?.id, "direct");
});

test("larger child access wins when entitlement ranks are tied", () => {
  const tied: PlanManagementContext = {
    ...context,
    entitlements: context.entitlements.map((entitlement) => ({
      ...entitlement,
      entitlement_rank: 300,
    })),
  };
  assert.equal(activeEntitlementForApp(tied, "earnly")?.id, "direct");
});

test("expired entitlements are not shown as current plans", () => {
  const expired: PlanManagementContext = {
    ...context,
    entitlements: context.entitlements.map((entitlement) => ({
      ...entitlement,
      current_period_end: "2020-01-01T00:00:00.000Z",
    })),
  };
  assert.equal(activeEntitlementForApp(expired, "earnly"), undefined);
});

test("same-interval child upgrades are immediate", () => {
  assert.equal(
    planChangeTiming(
      { planKey: "kids2_monthly", childLimit: 2, interval: "month" },
      { planKey: "kids4_monthly", childLimit: 4, interval: "month" },
    ),
    "immediate",
  );
});

test("child reductions and interval changes wait for renewal", () => {
  assert.equal(
    planChangeTiming(
      { planKey: "kids4_monthly", childLimit: 4, interval: "month" },
      { planKey: "kids2_monthly", childLimit: 2, interval: "month" },
    ),
    "scheduled",
  );
  assert.equal(
    planChangeTiming(
      { planKey: "kids4_monthly", childLimit: 4, interval: "month" },
      { planKey: "kids4_yearly", childLimit: 4, interval: "year" },
    ),
    "scheduled",
  );
});
