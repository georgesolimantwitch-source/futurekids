/**
 * Earnly Live fixed child-count tiers already configured in Stripe.
 * One child starts at $0.99/mo or $9.99/yr; each extra child adds
 * $1/mo or $10/yr.
 */

export const earnlyLivePricing = {
  minChildren: 1,
  maxChildren: 6,
  unitMonthly: 0.99,
  unitYearly: 9.99,
  additionalChildMonthly: 1,
  additionalChildYearly: 10,
  billedMonthsInYearlyPlan: 10,
  productName: "Earnly Live",
  description:
    "Choose how many children are on your family plan. Unlock family banking, chores, savings goals, and premium family features.",
  features: [
    "Chores & allowances",
    "Savings goals",
    "Parent approvals",
    "Family dashboard",
    "School rewards",
  ],
} as const;

export type EarnlyBillingPeriod = "monthly" | "yearly";

export function clampEarnlyChildCount(count: number): number {
  return Math.min(
    earnlyLivePricing.maxChildren,
    Math.max(earnlyLivePricing.minChildren, count),
  );
}

export function earnlyUnitPrice(period: EarnlyBillingPeriod): number {
  return period === "monthly"
    ? earnlyLivePricing.unitMonthly
    : earnlyLivePricing.unitYearly;
}

export function earnlyTotalPrice(
  childCount: number,
  period: EarnlyBillingPeriod,
): number {
  const count = clampEarnlyChildCount(childCount);
  const base = earnlyUnitPrice(period);
  const additional =
    period === "monthly"
      ? earnlyLivePricing.additionalChildMonthly
      : earnlyLivePricing.additionalChildYearly;
  return Math.round((base + (count - 1) * additional) * 100) / 100;
}

export function formatEarnlyPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function earnlyPriceLine(
  childCount: number,
  period: EarnlyBillingPeriod,
): string {
  const total = earnlyTotalPrice(childCount, period);
  const suffix = period === "monthly" ? "month" : "year";
  return `${formatEarnlyPrice(total)} / ${suffix}`;
}

export function earnlyUnitPriceLine(period: EarnlyBillingPeriod): string {
  const unit = earnlyUnitPrice(period);
  const suffix = period === "monthly" ? "month" : "year";
  return `From ${formatEarnlyPrice(unit)} / ${suffix}`;
}
