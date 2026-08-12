/**
 * Genlyn All Access — full ecosystem bundle (Creative Cloud style).
 * Base includes 1 seat each for Earnly, Scholars, Ballr, TinyPal (+ Freshys).
 * Extra seats: Earnly +$0.99, TinyPal +$1.99, Ballr +$1.99,
 * Scholars Full +$14.99 / Tutor & Study Guide +$9.99 /mo.
 */

import {
  clampEarnlyChildCount,
  earnlyLivePricing,
  earnlyTotalPrice,
  type EarnlyBillingPeriod,
} from "./earnly-pricing";
import {
  ballrExtraSeatPrice,
  ballrPricing,
  ballrTotalPrice,
  clampBallrChildCount,
} from "./ballr-pricing";
import {
  clampScholarsChildCount,
  scholarsAllAccessYearly,
  scholarsPricing,
  scholarsTierExtraSeatPrice,
  scholarsTierTotalPrice,
  type ScholarsTierId,
} from "./scholars-pricing";
import {
  clampTinyPalChildCount,
  tinypalExtraSeatPrice,
  tinypalPricing,
  tinypalTotalPrice,
} from "./tinypal-pricing";

export const ecosystemBundle = {
  name: "All Access",
  productName: "Genlyn All Access",
  tagline: "Every app. One subscription.",
  description:
    "Earnly, Scholars Notes, Ballr Live, and Freshys — the complete ecosystem for learning, earning, playing, and finding real food.",
  /** $19.99/mo with 1 Earnly child; +$0.99/mo per additional child */
  monthlyBase: 19.99,
  monthlyPerExtraChild: 0.99,
  /** Annual base + $9.99 per additional child */
  yearlyBase: 199.9,
  yearlyPerExtraChild: 9.99,
  monthlyPerExtraTinyPalChild: tinypalPricing.additionalChildMonthly,
  yearlyPerExtraTinyPalChild: tinypalPricing.additionalChildYearly,
  monthlyPerExtraBallrChild: ballrPricing.additionalChildMonthly,
  yearlyPerExtraBallrChild: ballrPricing.additionalChildYearly,
  monthlyPerExtraScholarsChild: scholarsPricing.additionalChildMonthly,
  yearlyPerExtraScholarsChild: scholarsPricing.additionalChildYearly,
  scholarsYearlyEquivalent: scholarsAllAccessYearly,
  includedApps: [
    { slug: "earnly" as const, name: "Earnly Live", icon: "/images/apps/earnly/icon.png" },
    { slug: "scholars" as const, name: "Scholars Notes", icon: "/images/apps/scholars/icon.png" },
    { slug: "ballr" as const, name: "Ballr Live", icon: "/images/apps/ballr/icon.png" },
    { slug: "fresher" as const, name: "Freshys", icon: "/images/apps/fresher/icon.png" },
  ],
  highlights: [
    "All four apps included",
    "Every feature in each app",
    "One account across the ecosystem",
    "Best value for growing families",
    "Cancel anytime",
  ],
} as const;

export type BundleSeats = {
  earnly: number;
  scholars: number;
  ballr: number;
  tinypal: number;
};

export function normalizeBundleSeats(partial?: Partial<BundleSeats>): BundleSeats {
  return {
    earnly: clampEarnlyChildCount(partial?.earnly ?? 1),
    scholars: clampScholarsChildCount(partial?.scholars ?? 1),
    ballr: clampBallrChildCount(partial?.ballr ?? 1),
    tinypal: clampTinyPalChildCount(partial?.tinypal ?? 1),
  };
}

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
export function individualMonthlyTotal(
  seats: Partial<BundleSeats> = {},
  scholarsTier: ScholarsTierId = "full",
): number {
  const s = normalizeBundleSeats(seats);
  const earnly = earnlyTotalPrice(s.earnly, "monthly");
  const scholars = scholarsTierTotalPrice(scholarsTier, s.scholars, "monthly");
  const ballr = ballrTotalPrice(s.ballr, "monthly");
  const tinypal = tinypalTotalPrice(s.tinypal, "monthly");
  const fresher = 1.5;
  return Math.round((earnly + scholars + ballr + tinypal + fresher) * 100) / 100;
}

/** À la carte yearly total */
export function individualYearlyTotal(
  seats: Partial<BundleSeats> = {},
  scholarsTier: ScholarsTierId = "full",
): number {
  const s = normalizeBundleSeats(seats);
  const earnly = earnlyTotalPrice(s.earnly, "yearly");
  const scholars = scholarsTierTotalPrice(scholarsTier, s.scholars, "yearly");
  const ballr = ballrTotalPrice(s.ballr, "yearly");
  const tinypal = tinypalTotalPrice(s.tinypal, "yearly");
  const fresher = 9.99;
  return Math.round((earnly + scholars + ballr + tinypal + fresher) * 100) / 100;
}

export function bundlePrice(
  earnlyChildCount: number,
  period: EarnlyBillingPeriod,
  tinypalChildCount = 1,
  scholarsChildCount = 1,
  ballrChildCount = 1,
  scholarsTier: ScholarsTierId = "full",
): number {
  const seats = normalizeBundleSeats({
    earnly: earnlyChildCount,
    tinypal: tinypalChildCount,
    scholars: scholarsChildCount,
    ballr: ballrChildCount,
  });
  const table = period === "monthly" ? ecosystemMonthlyByChild : ecosystemYearlyByChild;
  const base = table[seats.earnly];
  const extras =
    tinypalExtraSeatPrice(seats.tinypal, period) +
    scholarsTierExtraSeatPrice(scholarsTier, seats.scholars, period) +
    ballrExtraSeatPrice(seats.ballr, period);
  return Math.round((base + extras) * 100) / 100;
}

export function bundleSavings(
  earnlyChildCount: number,
  period: EarnlyBillingPeriod,
  tinypalChildCount = 1,
  scholarsChildCount = 1,
  ballrChildCount = 1,
  scholarsTier: ScholarsTierId = "full",
): number {
  const seats = {
    earnly: earnlyChildCount,
    tinypal: tinypalChildCount,
    scholars: scholarsChildCount,
    ballr: ballrChildCount,
  };
  const individual =
    period === "monthly"
      ? individualMonthlyTotal(seats, scholarsTier)
      : individualYearlyTotal(seats, scholarsTier);
  const bundle = bundlePrice(
    earnlyChildCount,
    period,
    tinypalChildCount,
    scholarsChildCount,
    ballrChildCount,
    scholarsTier,
  );
  return Math.max(0, Math.round((individual - bundle) * 100) / 100);
}

export function bundleSavingsPercent(
  earnlyChildCount: number,
  period: EarnlyBillingPeriod,
  tinypalChildCount = 1,
  scholarsChildCount = 1,
  ballrChildCount = 1,
  scholarsTier: ScholarsTierId = "full",
): number {
  const seats = {
    earnly: earnlyChildCount,
    tinypal: tinypalChildCount,
    scholars: scholarsChildCount,
    ballr: ballrChildCount,
  };
  const individual =
    period === "monthly"
      ? individualMonthlyTotal(seats, scholarsTier)
      : individualYearlyTotal(seats, scholarsTier);
  if (individual <= 0) return 0;
  const savings = bundleSavings(
    earnlyChildCount,
    period,
    tinypalChildCount,
    scholarsChildCount,
    ballrChildCount,
    scholarsTier,
  );
  return Math.round((savings / individual) * 100);
}

export function bundlePriceLine(
  earnlyChildCount: number,
  period: EarnlyBillingPeriod,
  tinypalChildCount = 1,
  scholarsChildCount = 1,
  ballrChildCount = 1,
  scholarsTier: ScholarsTierId = "full",
): string {
  const total = bundlePrice(
    earnlyChildCount,
    period,
    tinypalChildCount,
    scholarsChildCount,
    ballrChildCount,
    scholarsTier,
  );
  const suffix = period === "monthly" ? "mo" : "yr";
  return `${formatUsd(total)} / ${suffix}`;
}

export function bundleCatalogId(
  earnlyChildCount: number,
  period: EarnlyBillingPeriod,
  tinypalChildCount = 1,
  scholarsChildCount = 1,
  ballrChildCount = 1,
): string {
  const seats = normalizeBundleSeats({
    earnly: earnlyChildCount,
    tinypal: tinypalChildCount,
    scholars: scholarsChildCount,
    ballr: ballrChildCount,
  });
  const suffix = period === "monthly" ? "monthly" : "yearly";
  if (seats.scholars === 1 && seats.ballr === 1 && seats.tinypal === 1) {
    return `ecosystem.all.kids${seats.earnly}.${suffix}`;
  }
  if (seats.scholars === 1 && seats.ballr === 1) {
    return `ecosystem.all.earnly${seats.earnly}.tinypal${seats.tinypal}.${suffix}`;
  }
  return `ecosystem.all.e${seats.earnly}.s${seats.scholars}.b${seats.ballr}.t${seats.tinypal}.${suffix}`;
}

export function bundleStartingPrice(period: EarnlyBillingPeriod): string {
  const amount = bundlePrice(1, period, 1, 1, 1);
  const suffix = period === "monthly" ? "mo" : "yr";
  return `From ${formatUsd(amount)}/${suffix}`;
}

/** Shown under bundle price when à la carte is cheaper than the bundle */
export function bundleValueLine(
  earnlyChildCount: number,
  tinypalChildCount = 1,
  scholarsChildCount = 1,
  ballrChildCount = 1,
): string {
  const seats = normalizeBundleSeats({
    earnly: earnlyChildCount,
    tinypal: tinypalChildCount,
    scholars: scholarsChildCount,
    ballr: ballrChildCount,
  });
  if (
    seats.earnly > 1 ||
    seats.tinypal > 1 ||
    seats.scholars > 1 ||
    seats.ballr > 1
  ) {
    return `Includes ${seats.earnly} Earnly · ${seats.scholars} Scholars · ${seats.ballr} Ballr · ${seats.tinypal} TinyPal`;
  }
  return "All 5 apps · one subscription · add seats per app as your family grows";
}
