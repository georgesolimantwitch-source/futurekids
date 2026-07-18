/**
 * Future Kids All Access — full ecosystem bundle (Creative Cloud style).
 * $19.99/mo for 1 Earnly child + $0.99/mo per additional child.
 */

import {
  clampEarnlyChildCount,
  earnlyLivePricing,
  earnlyTotalPrice,
  type EarnlyBillingPeriod,
} from "./earnly-pricing";
import { scholarsAllAccessMonthly, scholarsAllAccessYearly } from "./scholars-pricing";

export const ecosystemBundle = {
  name: "All Access",
  productName: "Future Kids All Access",
  tagline: "Every app. One subscription.",
  description:
    "Earnly, Scholars Notes, Ballr Live, and TinyPal — the complete ecosystem for learning, earning, playing, and connecting.",
  /** $19.99/mo with 1 Earnly child; +$0.99/mo per additional child */
  monthlyBase: 19.99,
  monthlyPerExtraChild: 0.99,
  /** Annual base + $9.99 per additional child */
  yearlyBase: 199.9,
  yearlyPerExtraChild: 9.99,
  scholarsYearlyEquivalent: scholarsAllAccessYearly,
  includedApps: [
    { slug: "earnly" as const, name: "Earnly Live", icon: "/images/apps/earnly/icon.png" },
    { slug: "scholars" as const, name: "Scholars Notes", icon: "/images/apps/scholars/icon.png" },
    { slug: "ballr" as const, name: "Ballr Live", icon: "/images/apps/ballr/icon.png" },
    { slug: "tinypal" as const, name: "TinyPal", icon: "/images/apps/tinypal/icon.png" },
  ],
  highlights: [
    "All four apps included",
    "Every feature in each app",
    "One account across the ecosystem",
    "Best value for growing families",
    "Cancel anytime",
  ],
} as const;

function buildBundleTable(base: number, perExtra: number): Record<number, number> {
  const table: Record<number, number> = {};
  for (let n = 1; n <= earnlyLivePricing.maxChildren; n += 1) {
    table[n] = Math.round((base + (n - 1) * perExtra) * 100) / 100;
  }
  return table;
}

export const ecosystemMonthlyByChild = buildBundleTable(
  ecosystemBundle.monthlyBase,
  ecosystemBundle.monthlyPerExtraChild,
);

export const ecosystemYearlyByChild = buildBundleTable(
  ecosystemBundle.yearlyBase,
  ecosystemBundle.yearlyPerExtraChild,
);

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** À la carte monthly total if subscribing to each app separately */
export function individualMonthlyTotal(childCount: number): number {
  const count = clampEarnlyChildCount(childCount);
  const earnly = earnlyTotalPrice(count, "monthly");
  const scholars = scholarsAllAccessMonthly;
  const ballr = 4.99;
  const tinypal = 4.99;
  return Math.round((earnly + scholars + ballr + tinypal) * 100) / 100;
}

/** À la carte yearly total */
export function individualYearlyTotal(childCount: number): number {
  const count = clampEarnlyChildCount(childCount);
  const earnly = earnlyTotalPrice(count, "yearly");
  const scholars = ecosystemBundle.scholarsYearlyEquivalent;
  const ballr = 49.99;
  const tinypal = 49.99;
  return Math.round((earnly + scholars + ballr + tinypal) * 100) / 100;
}

export function bundlePrice(
  childCount: number,
  period: EarnlyBillingPeriod,
): number {
  const count = clampEarnlyChildCount(childCount);
  const table = period === "monthly" ? ecosystemMonthlyByChild : ecosystemYearlyByChild;
  return table[count];
}

export function bundleSavings(
  childCount: number,
  period: EarnlyBillingPeriod,
): number {
  const individual =
    period === "monthly"
      ? individualMonthlyTotal(childCount)
      : individualYearlyTotal(childCount);
  const bundle = bundlePrice(childCount, period);
  return Math.max(0, Math.round((individual - bundle) * 100) / 100);
}

export function bundleSavingsPercent(
  childCount: number,
  period: EarnlyBillingPeriod,
): number {
  const individual =
    period === "monthly"
      ? individualMonthlyTotal(childCount)
      : individualYearlyTotal(childCount);
  if (individual <= 0) return 0;
  const savings = bundleSavings(childCount, period);
  return Math.round((savings / individual) * 100);
}

export function bundlePriceLine(
  childCount: number,
  period: EarnlyBillingPeriod,
): string {
  const total = bundlePrice(childCount, period);
  const suffix = period === "monthly" ? "mo" : "yr";
  return `${formatUsd(total)} / ${suffix}`;
}

export function bundleCatalogId(
  childCount: number,
  period: EarnlyBillingPeriod,
): string {
  const count = clampEarnlyChildCount(childCount);
  const suffix = period === "monthly" ? "monthly" : "yearly";
  return `ecosystem.all.kids${count}.${suffix}`;
}

export function bundleStartingPrice(period: EarnlyBillingPeriod): string {
  const amount = bundlePrice(1, period);
  const suffix = period === "monthly" ? "mo" : "yr";
  return `From ${formatUsd(amount)}/${suffix}`;
}

/** Shown under bundle price when à la carte is cheaper than the bundle */
export function bundleValueLine(childCount: number): string {
  const count = clampEarnlyChildCount(childCount);
  if (count === 1) {
    return "All 4 apps · one subscription · +$0.99/mo per extra Earnly child";
  }
  return `Includes ${count} Earnly children · +$0.99/mo per additional child`;
}
