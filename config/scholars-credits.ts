/**
 * Scholars AI credits — combined generations + tutor minutes.
 * Lookup: com.scholarsnotes.plan.g{GENS}.m{MINS}.{refill|monthly|yearly}
 *
 * Prices are the App Store / StoreKit catalog (same JSON as scholars-web).
 * Formula fallback only covers rare missing SKUs.
 */

import catalog from "./scholars-pricing-catalog.json";

export type ScholarsCreditPeriod = "refill" | "monthly" | "yearly";
export type ScholarsCreditKind = "generations" | "tutor_minutes";

type CatalogPlan = {
  productId: string;
  gens: number;
  mins: number;
  period: ScholarsCreditPeriod;
  price: number;
  displayName: string;
};

const catalogPlans = catalog.plans as CatalogPlan[];

const planByKey = new Map(
  catalogPlans.map(
    (plan) => [`${plan.gens}:${plan.mins}:${plan.period}`, plan] as const,
  ),
);

/** Matches App Store / scholars-web `scholars-pricing-catalog.json` unitPricing. */
export const scholarsCreditPricing = {
  generations: {
    step: 5,
    min: 0,
    max: 60,
    default: 20,
    /** Per block of 5 */
    refillPerBlock: catalog.unitPricing.refill.per5Gens,
    monthlyPerBlock: catalog.unitPricing.monthly.per5Gens,
    yearlyPerBlockMonthly: catalog.unitPricing.yearly.per5GensMonthly,
  },
  tutorMinutes: {
    step: 15,
    min: 0,
    max: 180,
    default: 60,
    /** Per block of 15 (half of App Store per-30 rates). */
    refillPerBlock: Number(
      (catalog.unitPricing.refill.per30Mins / 2).toFixed(2),
    ),
    monthlyPerBlock: Number(
      (catalog.unitPricing.monthly.per30Mins / 2).toFixed(2),
    ),
    yearlyPerBlockMonthly: Number(
      (catalog.unitPricing.yearly.per30MinsMonthly / 2).toFixed(2),
    ),
  },
  defaultPeriod: "refill" as ScholarsCreditPeriod,
} as const;

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function clampGenerations(qty: number): number {
  const { step, min, max } = scholarsCreditPricing.generations;
  const rounded = Math.round(qty / step) * step;
  return Math.min(max, Math.max(min, rounded));
}

export function clampTutorMinutes(qty: number, _generations = 0): number {
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  const { step, max } = scholarsCreditPricing.tutorMinutes;
  const rounded = Math.round(qty / step) * step;
  return Math.min(max, Math.max(0, rounded));
}

export function generationBlocks(qty: number): number {
  const n = clampGenerations(qty);
  return n === 0 ? 0 : n / scholarsCreditPricing.generations.step;
}

export function tutorMinuteBlocks(qty: number, generations = 0): number {
  const n = clampTutorMinutes(qty, generations);
  if (n === 0) return 0;
  return n / scholarsCreditPricing.tutorMinutes.step;
}

function gensBlockUnit(period: ScholarsCreditPeriod): number {
  const p = scholarsCreditPricing.generations;
  if (period === "refill") return p.refillPerBlock;
  if (period === "monthly") return p.monthlyPerBlock;
  return p.yearlyPerBlockMonthly;
}

function tutorBlockUnit(period: ScholarsCreditPeriod): number {
  const p = scholarsCreditPricing.tutorMinutes;
  if (period === "refill") return p.refillPerBlock;
  if (period === "monthly") return p.monthlyPerBlock;
  return p.yearlyPerBlockMonthly;
}

export function generationsPrice(
  qty: number,
  period: ScholarsCreditPeriod,
): number {
  const blocks = generationBlocks(qty);
  if (blocks === 0) return 0;
  const monthlyish = Math.round(blocks * gensBlockUnit(period) * 100) / 100;
  if (period === "yearly") {
    return Math.round(monthlyish * 12 * 100) / 100;
  }
  return monthlyish;
}

export function tutorMinutesPrice(
  qty: number,
  period: ScholarsCreditPeriod,
  generations = 0,
): number {
  const blocks = tutorMinuteBlocks(qty, generations);
  if (blocks === 0) return 0;
  const monthlyish = Math.round(blocks * tutorBlockUnit(period) * 100) / 100;
  if (period === "yearly") {
    return Math.round(monthlyish * 12 * 100) / 100;
  }
  return monthlyish;
}

/** Exact App Store SKU when it exists in the shared catalog. */
export function findCatalogPlan(
  generations: number,
  tutorMinutes: number,
  period: ScholarsCreditPeriod,
): CatalogPlan | null {
  const g = clampGenerations(generations);
  const m = clampTutorMinutes(tutorMinutes, g);
  return planByKey.get(`${g}:${m}:${period}`) ?? null;
}

export function isScholarsCreditSkuAvailable(
  generations: number,
  tutorMinutes: number,
  period: ScholarsCreditPeriod,
): boolean {
  if (generations === 0 && tutorMinutes === 0) return false;
  return findCatalogPlan(generations, tutorMinutes, period) != null;
}

export function combinedCreditPrice(
  generations: number,
  tutorMinutes: number,
  period: ScholarsCreditPeriod,
): number {
  const plan = findCatalogPlan(generations, tutorMinutes, period);
  if (plan) return plan.price;

  // Fallback for any SKU missing from the catalog snapshot.
  return (
    Math.round(
      (generationsPrice(generations, period) +
        tutorMinutesPrice(tutorMinutes, period, generations)) *
        100,
    ) / 100
  );
}

/** Monthly compare-at = refill; yearly compare-at = monthly × 12 */
export function combinedCompareAtPrice(
  generations: number,
  tutorMinutes: number,
  period: ScholarsCreditPeriod,
): number | null {
  if (period === "refill") return null;
  if (period === "monthly") {
    return combinedCreditPrice(generations, tutorMinutes, "refill");
  }
  return (
    Math.round(
      combinedCreditPrice(generations, tutorMinutes, "monthly") * 12 * 100,
    ) / 100
  );
}

export function combinedSavePercent(
  generations: number,
  tutorMinutes: number,
  period: ScholarsCreditPeriod,
): number | null {
  const compare = combinedCompareAtPrice(generations, tutorMinutes, period);
  const price = combinedCreditPrice(generations, tutorMinutes, period);
  if (!compare || compare <= 0 || price >= compare) return null;
  return Math.round(((compare - price) / compare) * 100);
}

export function combinedYearlyMonthlyEquivalent(
  generations: number,
  tutorMinutes: number,
): number {
  const yearly = combinedCreditPrice(generations, tutorMinutes, "yearly");
  return Math.round((yearly / 12) * 100) / 100;
}

export function creditPriceLine(
  amount: number,
  period: ScholarsCreditPeriod,
): string {
  if (period === "refill") return formatUsd(amount);
  if (period === "monthly") return `${formatUsd(amount)}/mo`;
  return `${formatUsd(amount)}/yr`;
}

export function formatCreditUsd(amount: number): string {
  return formatUsd(amount);
}

/** Combined plan lookup key matching iOS / Stripe Live. */
export function scholarsCombinedLookupKey(
  generations: number,
  tutorMinutes: number,
  period: ScholarsCreditPeriod,
): string {
  const g = clampGenerations(generations);
  const m = clampTutorMinutes(tutorMinutes, g);
  return `com.scholarsnotes.plan.g${g}.m${m}.${period}`;
}

/** @deprecated Prefer scholarsCombinedLookupKey — kept for legacy price reads */
export function scholarsGensLookupKey(
  qty: number,
  period: ScholarsCreditPeriod,
): string {
  return scholarsCombinedLookupKey(qty, 0, period);
}

/** @deprecated Prefer scholarsCombinedLookupKey */
export function scholarsTutorMinLookupKey(
  qty: number,
  period: ScholarsCreditPeriod,
): string {
  return scholarsCombinedLookupKey(0, qty, period);
}

export function grantSummaryLabel(
  generations: number,
  tutorMinutes: number,
): string {
  const g = clampGenerations(generations);
  const m = clampTutorMinutes(tutorMinutes, g);
  const parts: string[] = [];
  if (g > 0) parts.push(`${g} Generation${g === 1 ? "" : "s"}`);
  if (m > 0) parts.push(`${m} Minute${m === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" + ") : "Nothing selected";
}

export function periodLabel(period: ScholarsCreditPeriod): string {
  if (period === "refill") return "Refill credits";
  if (period === "monthly") return "Monthly";
  return "Yearly";
}

export function parseCombinedLookupKey(lookupKey: string): {
  generations: number;
  tutorMinutes: number;
  period: ScholarsCreditPeriod | null;
} | null {
  const match =
    /^com\.scholarsnotes\.plan\.g(\d+)\.m(\d+)\.(refill|monthly|yearly)$/.exec(
      lookupKey,
    );
  if (!match) return null;
  return {
    generations: Number(match[1]),
    tutorMinutes: Number(match[2]),
    period: match[3] as ScholarsCreditPeriod,
  };
}

/** All combined SKUs for Stripe — exact App Store catalog prices. */
export function allScholarsCreditSkus(): Array<{
  kind: "combined_credits";
  generations: number;
  tutorMinutes: number;
  period: ScholarsCreditPeriod;
  lookupKey: string;
  unitAmount: number;
  interval: "month" | "year" | null;
  grantGenerations: number;
  grantTutorMinutes: number;
  name: string;
}> {
  return catalogPlans.map((plan) => ({
    kind: "combined_credits" as const,
    generations: plan.gens,
    tutorMinutes: plan.mins,
    period: plan.period,
    lookupKey: plan.productId,
    unitAmount: plan.price,
    interval:
      plan.period === "refill"
        ? null
        : plan.period === "monthly"
          ? ("month" as const)
          : ("year" as const),
    grantGenerations: plan.gens,
    grantTutorMinutes: plan.mins,
    name: `Scholars AI · ${grantSummaryLabel(plan.gens, plan.mins)}`,
  }));
}
