/**
 * Ballr Live fixed child-count tiers.
 * $4.99 for the first child each month, +$1.99 per additional child.
 * Yearly plans charge for 10 months (2 months free).
 */

export const ballrPricing = {
  minChildren: 1,
  maxChildren: 6,
  firstChildMonthly: 4.99,
  additionalChildMonthly: 1.99,
  firstChildYearly: 49.9,
  additionalChildYearly: 19.9,
  billedMonthsInYearlyPlan: 10,
  productName: "Ballr Live",
  description:
    "Find pickup games, train, compete, and grow your sports community. Choose how many children are on your Ballr plan.",
} as const;

export type BallrBillingPeriod = "monthly" | "yearly";

export function clampBallrChildCount(count: number): number {
  return Math.min(
    ballrPricing.maxChildren,
    Math.max(ballrPricing.minChildren, count),
  );
}

export function ballrTotalPrice(
  childCount: number,
  period: BallrBillingPeriod,
): number {
  const count = clampBallrChildCount(childCount);
  const first =
    period === "monthly"
      ? ballrPricing.firstChildMonthly
      : ballrPricing.firstChildYearly;
  const additional =
    period === "monthly"
      ? ballrPricing.additionalChildMonthly
      : ballrPricing.additionalChildYearly;
  return Math.round((first + (count - 1) * additional) * 100) / 100;
}

export function formatBallrPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ballrPriceLine(
  childCount: number,
  period: BallrBillingPeriod,
): string {
  const total = ballrTotalPrice(childCount, period);
  const suffix = period === "monthly" ? "month" : "year";
  return `${formatBallrPrice(total)} / ${suffix}`;
}

export function ballrUnitPriceLine(period: BallrBillingPeriod): string {
  const amount =
    period === "monthly"
      ? ballrPricing.firstChildMonthly
      : ballrPricing.firstChildYearly;
  const suffix = period === "monthly" ? "month" : "year";
  return `From ${formatBallrPrice(amount)} / ${suffix}`;
}

/** Extra Ballr seats beyond the first (included in All Access base). */
export function ballrExtraSeatPrice(
  childCount: number,
  period: BallrBillingPeriod,
): number {
  const count = clampBallrChildCount(childCount);
  if (count <= 1) return 0;
  const additional =
    period === "monthly"
      ? ballrPricing.additionalChildMonthly
      : ballrPricing.additionalChildYearly;
  return Math.round((count - 1) * additional * 100) / 100;
}
