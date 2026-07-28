/**
 * TinyPal fixed child-count tiers.
 * $4.99 for the first child each month, +$1.99 per additional child.
 * Yearly plans charge for 10 months (2 months free).
 */

export const tinypalPricing = {
  minChildren: 1,
  maxChildren: 6,
  firstChildMonthly: 4.99,
  additionalChildMonthly: 1.99,
  firstChildYearly: 49.9,
  additionalChildYearly: 19.9,
  billedMonthsInYearlyPlan: 10,
  productName: "TinyPal",
  description:
    "Safe communication designed for kids and managed by parents. Choose how many children are on your TinyPal plan.",
} as const;

export type TinyPalBillingPeriod = "monthly" | "yearly";

export function clampTinyPalChildCount(count: number): number {
  return Math.min(
    tinypalPricing.maxChildren,
    Math.max(tinypalPricing.minChildren, count),
  );
}

export function tinypalTotalPrice(
  childCount: number,
  period: TinyPalBillingPeriod,
): number {
  const count = clampTinyPalChildCount(childCount);
  const first =
    period === "monthly"
      ? tinypalPricing.firstChildMonthly
      : tinypalPricing.firstChildYearly;
  const additional =
    period === "monthly"
      ? tinypalPricing.additionalChildMonthly
      : tinypalPricing.additionalChildYearly;
  return Math.round((first + (count - 1) * additional) * 100) / 100;
}

export function formatTinyPalPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function tinypalPriceLine(
  childCount: number,
  period: TinyPalBillingPeriod,
): string {
  const total = tinypalTotalPrice(childCount, period);
  const suffix = period === "monthly" ? "month" : "year";
  return `${formatTinyPalPrice(total)} / ${suffix}`;
}

export function tinypalUnitPriceLine(period: TinyPalBillingPeriod): string {
  const amount =
    period === "monthly"
      ? tinypalPricing.firstChildMonthly
      : tinypalPricing.firstChildYearly;
  const suffix = period === "monthly" ? "month" : "year";
  return `From ${formatTinyPalPrice(amount)} / ${suffix}`;
}

/** Extra TinyPal seats beyond the first (included in All Access base). */
export function tinypalExtraSeatPrice(
  childCount: number,
  period: TinyPalBillingPeriod,
): number {
  const count = clampTinyPalChildCount(childCount);
  if (count <= 1) return 0;
  const additional =
    period === "monthly"
      ? tinypalPricing.additionalChildMonthly
      : tinypalPricing.additionalChildYearly;
  return Math.round((count - 1) * additional * 100) / 100;
}
