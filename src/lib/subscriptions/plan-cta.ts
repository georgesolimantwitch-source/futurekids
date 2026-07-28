import { getProductPlan } from "@/lib/subscriptions/product-catalog";

/** Normalize a catalog plan's charge to an approximate monthly USD amount. */
export function monthlyAmountFromPlanKey(planKey: string): number | null {
  const plan = getProductPlan(planKey);
  if (!plan) return null;
  const dollars = plan.expectedAmountCents / 100;
  return plan.interval === "year" ? dollars / 12 : dollars;
}

/**
 * CTA for pricing buttons:
 * - new users → Subscribe
 * - same selection → Current Plan
 * - cheaper than current → Downgrade
 * - otherwise → Upgrade
 */
export function subscribeUpgradeDowngradeLabel(input: {
  hasExistingPlan: boolean;
  isCurrentSelection: boolean;
  selectedMonthly: number | null;
  currentMonthly: number | null;
}): "Subscribe" | "Upgrade" | "Downgrade" | "Current Plan" {
  if (input.isCurrentSelection) return "Current Plan";
  if (!input.hasExistingPlan) return "Subscribe";
  if (
    input.selectedMonthly != null &&
    input.currentMonthly != null &&
    Number.isFinite(input.selectedMonthly) &&
    Number.isFinite(input.currentMonthly)
  ) {
    if (input.selectedMonthly < input.currentMonthly - 0.005) {
      return "Downgrade";
    }
    if (input.selectedMonthly > input.currentMonthly + 0.005) {
      return "Upgrade";
    }
  }
  return "Upgrade";
}
