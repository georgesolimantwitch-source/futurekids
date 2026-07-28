/**
 * Scholars Notes pricing — yearly = 10 months (2 months free).
 * Full (all-access) seats are flat quantity: $14.99 per child (no cheaper extras).
 */

import type { EarnlyBillingPeriod } from "./earnly-pricing";

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export const scholarsAllAccessMonthly = 14.99;
export const scholarsTutorMonthly = 9.99;
export const scholarsStudyGuideMonthly = 9.99;

/** Pay for 10 months, get 12 */
export function scholarsYearlyFromMonthly(monthly: number): number {
  return Math.round(monthly * 10 * 100) / 100;
}

export const scholarsAllAccessYearly = scholarsYearlyFromMonthly(scholarsAllAccessMonthly);
export const scholarsTutorYearly = scholarsYearlyFromMonthly(scholarsTutorMonthly);
export const scholarsStudyGuideYearly = scholarsYearlyFromMonthly(scholarsStudyGuideMonthly);

/** Flat per-seat rate (same for every child). */
export const scholarsSeatMonthly = scholarsAllAccessMonthly;
export const scholarsSeatYearly = scholarsAllAccessYearly;

export const scholarsPricing = {
  minChildren: 1,
  maxChildren: 6,
  /** All Access Scholars seats (kids who can use Scholars + AI credits). */
  allAccessMaxChildren: 5,
  firstChildMonthly: scholarsSeatMonthly,
  additionalChildMonthly: scholarsSeatMonthly,
  firstChildYearly: scholarsSeatYearly,
  additionalChildYearly: scholarsSeatYearly,
  seatMonthly: scholarsSeatMonthly,
  seatYearly: scholarsSeatYearly,
} as const;

export function clampScholarsChildCount(count: number): number {
  return Math.min(
    scholarsPricing.maxChildren,
    Math.max(scholarsPricing.minChildren, count),
  );
}

export function clampAllAccessScholarsChildCount(count: number): number {
  return Math.min(
    scholarsPricing.allAccessMaxChildren,
    Math.max(scholarsPricing.minChildren, count),
  );
}

export function scholarsSeatUnitPrice(period: EarnlyBillingPeriod): number {
  return period === "monthly"
    ? scholarsPricing.seatMonthly
    : scholarsPricing.seatYearly;
}

export function scholarsFullTotalPrice(
  childCount: number,
  period: EarnlyBillingPeriod,
): number {
  const count = clampScholarsChildCount(childCount);
  const unit = scholarsSeatUnitPrice(period);
  return Math.round(count * unit * 100) / 100;
}

export function scholarsFullPriceLine(
  childCount: number,
  period: EarnlyBillingPeriod,
): string {
  const total = scholarsFullTotalPrice(childCount, period);
  const suffix = period === "monthly" ? "mo" : "yr";
  return `${formatUsd(total)} / ${suffix}`;
}

export type ScholarsTierId = "full" | "tutor" | "study_guide";

/** Extra Scholars seats beyond the first (included in Genlyn All Access base). */
export function scholarsExtraSeatPrice(
  childCount: number,
  period: EarnlyBillingPeriod,
): number {
  return scholarsTierExtraSeatPrice("full", childCount, period);
}

/** Extra Scholars seats at the selected tier rate (Full $14.99 · Tutor/Study Guide $9.99). */
export function scholarsTierExtraSeatPrice(
  tierId: ScholarsTierId,
  childCount: number,
  period: EarnlyBillingPeriod,
): number {
  const count = clampScholarsChildCount(childCount);
  if (count <= 1) return 0;
  const unit = scholarsTierPrice(getScholarsTier(tierId), period);
  return Math.round((count - 1) * unit * 100) / 100;
}

export interface ScholarsTier {
  id: ScholarsTierId;
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  catalogIds: { monthly: string; yearly: string };
  features: string[];
}

export const scholarsTiers: ScholarsTier[] = [
  {
    id: "full",
    name: "Scholars Full",
    description: "AI Tutor, Study Guides, Handwriting Practice, and all future premium tools.",
    monthly: scholarsAllAccessMonthly,
    yearly: scholarsAllAccessYearly,
    catalogIds: {
      monthly: "com.scholarsnotes.full.monthly",
      yearly: "com.scholarsnotes.full.yearly",
    },
    features: [
      "Everything in Scholar Tutor",
      "Everything in Study Guide",
      "Handwriting practice",
      "All future premium tools",
    ],
  },
  {
    id: "tutor",
    name: "Scholar Tutor",
    description: "AI Tutor voice conversations, personalized tutoring, and real-time study help.",
    monthly: scholarsTutorMonthly,
    yearly: scholarsTutorYearly,
    catalogIds: {
      monthly: "com.scholarsnotes.tutor.monthly",
      yearly: "com.scholarsnotes.tutor.yearly",
    },
    features: [
      "AI Tutor voice conversations",
      "Personalized tutoring",
      "Real-time study help",
    ],
  },
  {
    id: "study_guide",
    name: "Scholars Study Guide",
    description: "Upload teacher notes, AI study guides, smart summaries, and quiz generation.",
    monthly: scholarsStudyGuideMonthly,
    yearly: scholarsStudyGuideYearly,
    catalogIds: {
      monthly: "com.scholarsnotes.studyguide.monthly",
      yearly: "com.scholarsnotes.studyguide.yearly",
    },
    features: [
      "Upload teacher notes",
      "AI study guides",
      "Smart summaries",
      "Quiz generation",
    ],
  },
];

export function getScholarsTier(id: ScholarsTierId): ScholarsTier {
  return scholarsTiers.find((t) => t.id === id) ?? scholarsTiers[0];
}

export function scholarsTierPrice(tier: ScholarsTier, period: EarnlyBillingPeriod): number {
  return period === "monthly" ? tier.monthly : tier.yearly;
}

export function scholarsTierTotalPrice(
  tierId: ScholarsTierId,
  childCount: number,
  period: EarnlyBillingPeriod,
): number {
  const tier = getScholarsTier(tierId);
  const count = clampScholarsChildCount(childCount);
  const unit = scholarsTierPrice(tier, period);
  return Math.round(count * unit * 100) / 100;
}

export function scholarsTierPriceLine(tier: ScholarsTier, period: EarnlyBillingPeriod): string {
  const amount = scholarsTierPrice(tier, period);
  const suffix = period === "monthly" ? "mo" : "yr";
  return `${formatUsd(amount)} / ${suffix}`;
}

export function scholarsTierTotalPriceLine(
  tierId: ScholarsTierId,
  childCount: number,
  period: EarnlyBillingPeriod,
): string {
  const total = scholarsTierTotalPrice(tierId, childCount, period);
  const suffix = period === "monthly" ? "mo" : "yr";
  return `${formatUsd(total)} / ${suffix}`;
}

export function scholarsTierCatalogId(
  tierId: ScholarsTierId,
  period: EarnlyBillingPeriod,
): string {
  const tier = getScholarsTier(tierId);
  return period === "monthly" ? tier.catalogIds.monthly : tier.catalogIds.yearly;
}
