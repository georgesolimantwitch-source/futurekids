/**
 * Scholars AI credits — combined generations + tutor minutes.
 * Lookup: com.scholarsnotes.plan.g{GENS}.m{MINS}.{refill|monthly|yearly}
 */

export type ScholarsCreditPeriod = "refill" | "monthly" | "yearly";
export type ScholarsCreditKind = "generations" | "tutor_minutes";

export const scholarsCreditPricing = {
  generations: {
    step: 5,
    min: 0,
    max: 60,
    default: 20,
    /** Per block of 5 */
    refillPerBlock: 2.99,
    monthlyPerBlock: 1.99,
    yearlyPerBlockMonthly: 1.49,
  },
  tutorMinutes: {
    step: 30,
    min: 0,
    max: 180,
    default: 60,
    /** Per block of 30 */
    refillPerBlock: 7.99,
    monthlyPerBlock: 6.99,
    yearlyPerBlockMonthly: 5.49,
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

export function clampTutorMinutes(qty: number): number {
  const { step, min, max } = scholarsCreditPricing.tutorMinutes;
  const rounded = Math.round(qty / step) * step;
  return Math.min(max, Math.max(min, rounded));
}

export function generationBlocks(qty: number): number {
  const n = clampGenerations(qty);
  return n === 0 ? 0 : n / scholarsCreditPricing.generations.step;
}

export function tutorMinuteBlocks(qty: number): number {
  const n = clampTutorMinutes(qty);
  return n === 0 ? 0 : n / scholarsCreditPricing.tutorMinutes.step;
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
): number {
  const blocks = tutorMinuteBlocks(qty);
  if (blocks === 0) return 0;
  const monthlyish = Math.round(blocks * tutorBlockUnit(period) * 100) / 100;
  if (period === "yearly") {
    return Math.round(monthlyish * 12 * 100) / 100;
  }
  return monthlyish;
}

export function combinedCreditPrice(
  generations: number,
  tutorMinutes: number,
  period: ScholarsCreditPeriod,
): number {
  return (
    Math.round(
      (generationsPrice(generations, period) +
        tutorMinutesPrice(tutorMinutes, period)) *
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
    Math.round(combinedCreditPrice(generations, tutorMinutes, "monthly") * 12 * 100) /
    100
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
  return (
    Math.round(
      (generationsPrice(generations, "yearly") / 12 +
        tutorMinutesPrice(tutorMinutes, "yearly") / 12) *
        100,
    ) / 100
  );
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
  const m = clampTutorMinutes(tutorMinutes);
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
  const m = clampTutorMinutes(tutorMinutes);
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
  const match = /^com\.scholarsnotes\.plan\.g(\d+)\.m(\d+)\.(refill|monthly|yearly)$/.exec(
    lookupKey,
  );
  if (!match) return null;
  return {
    generations: Number(match[1]),
    tutorMinutes: Number(match[2]),
    period: match[3] as ScholarsCreditPeriod,
  };
}

/** All combined SKUs for Stripe catalog (270). */
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
  const skus: ReturnType<typeof allScholarsCreditSkus> = [];
  const periods: ScholarsCreditPeriod[] = ["refill", "monthly", "yearly"];
  const genOptions: number[] = [];
  for (let g = 0; g <= 60; g += 5) genOptions.push(g);
  const minOptions: number[] = [];
  for (let m = 0; m <= 180; m += 30) minOptions.push(m);

  for (const generations of genOptions) {
    for (const tutorMinutes of minOptions) {
      if (generations === 0 && tutorMinutes === 0) continue;
      for (const period of periods) {
        skus.push({
          kind: "combined_credits",
          generations,
          tutorMinutes,
          period,
          lookupKey: scholarsCombinedLookupKey(generations, tutorMinutes, period),
          unitAmount: combinedCreditPrice(generations, tutorMinutes, period),
          interval:
            period === "refill" ? null : period === "monthly" ? "month" : "year",
          grantGenerations: generations,
          grantTutorMinutes: tutorMinutes,
          name: `Scholars AI · ${grantSummaryLabel(generations, tutorMinutes)}`,
        });
      }
    }
  }

  return skus;
}
