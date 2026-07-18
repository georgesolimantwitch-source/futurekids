/**
 * Scholars Notes pricing — yearly = 10 months (2 months free).
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

export type ScholarsTierId = "full" | "tutor" | "study_guide";

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
    name: "Scholars All Access",
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

export function scholarsTierPriceLine(tier: ScholarsTier, period: EarnlyBillingPeriod): string {
  const amount = scholarsTierPrice(tier, period);
  const suffix = period === "monthly" ? "mo" : "yr";
  return `${formatUsd(amount)} / ${suffix}`;
}

export function scholarsTierCatalogId(
  tierId: ScholarsTierId,
  period: EarnlyBillingPeriod,
): string {
  const tier = getScholarsTier(tierId);
  return period === "monthly" ? tier.catalogIds.monthly : tier.catalogIds.yearly;
}
