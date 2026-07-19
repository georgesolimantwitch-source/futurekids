import type { AppKey } from "./product-catalog";

export interface PlanManagementEntitlement {
  id: string;
  user_id: string;
  app_key: AppKey;
  plan_key: string;
  provider: "stripe" | "apple";
  status: string;
  child_limit: number | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  entitlement_rank: number;
}

export interface FamilyPlanChild {
  id: string;
  name: string;
  joinedAt: string;
  earnlyStatus: "active" | "paused_by_plan" | "paused_by_parent" | "revoked";
}

export interface PendingPlanChange {
  id: string;
  entitlement_id: string;
  app_key: AppKey;
  from_plan_key: string;
  target_plan_key: string;
  from_child_limit: number;
  target_child_limit: number;
  effective_at: string;
  status: "requested" | "scheduled";
  activeChildIds: string[];
}

export interface PlanManagementContext {
  entitlements: PlanManagementEntitlement[];
  children: FamilyPlanChild[];
  pendingChanges: PendingPlanChange[];
}

export const EMPTY_PLAN_MANAGEMENT_CONTEXT: PlanManagementContext = {
  entitlements: [],
  children: [],
  pendingChanges: [],
};

export function activeEntitlementForApp(
  context: PlanManagementContext,
  appKey: AppKey,
): PlanManagementEntitlement | undefined {
  return context.entitlements
    .filter(
      (entitlement) =>
        entitlement.app_key === appKey &&
        ["active", "trialing", "grace_period", "canceled"].includes(
          entitlement.status,
        ) &&
        (!entitlement.current_period_end ||
          Date.parse(entitlement.current_period_end) > Date.now()),
    )
    .sort(
      (a, b) =>
        b.entitlement_rank - a.entitlement_rank ||
        (b.child_limit ?? 0) - (a.child_limit ?? 0),
    )[0];
}

export function planChangeTiming(
  current: { planKey: string; childLimit: number; interval: string },
  target: { planKey: string; childLimit: number; interval: string },
): "unchanged" | "immediate" | "scheduled" {
  if (current.planKey === target.planKey) return "unchanged";
  if (
    target.childLimit < current.childLimit ||
    target.interval !== current.interval
  ) {
    return "scheduled";
  }
  return "immediate";
}
