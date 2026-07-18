/**
 * Stripe catalog — Earnly uses one product + per-child quantity pricing.
 * Scholars keeps separate tier products.
 */

import { ecosystemBundle, ecosystemMonthlyByChild, ecosystemYearlyByChild } from "./ecosystem-bundle";
import {
  scholarsAllAccessMonthly,
  scholarsAllAccessYearly,
  scholarsStudyGuideMonthly,
  scholarsStudyGuideYearly,
  scholarsTutorMonthly,
  scholarsTutorYearly,
} from "./scholars-pricing";

export type StripeCatalogApp = "earnly" | "scholars" | "ballr" | "tinypal" | "ecosystem";

export interface StripeCatalogPlan {
  app: StripeCatalogApp;
  /** Unique key stored in Stripe metadata */
  catalogId: string;
  name: string;
  description: string;
  /** USD per unit (one child) */
  unitAmount: number;
  interval: "month" | "year";
  /** Per-unit billing — quantity = number of children */
  perChildQuantity?: boolean;
  metadata?: Record<string, string>;
}

/** One Earnly product — quantity = children on the plan */
export const earnlyStripePlans: StripeCatalogPlan[] = [
  {
    app: "earnly",
    catalogId: "earnly.live.monthly",
    name: "Earnly Live",
    description:
      "Family banking, chores, savings goals, and premium family features. Billed per child.",
    unitAmount: 0.99,
    interval: "month",
    perChildQuantity: true,
    metadata: { billing_period: "monthly", pricing_model: "per_child" },
  },
  {
    app: "earnly",
    catalogId: "earnly.live.yearly",
    name: "Earnly Live",
    description: "Annual Earnly Live plan. Billed per child.",
    unitAmount: 9.99,
    interval: "year",
    perChildQuantity: true,
    metadata: { billing_period: "yearly", pricing_model: "per_child" },
  },
];

export const scholarsStripePlans: StripeCatalogPlan[] = [
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.full.monthly",
    name: "Scholars All Access",
    description:
      "AI Tutor, AI Study Podcast, AI Study Guides, Handwriting Practice, and all premium tools.",
    unitAmount: scholarsAllAccessMonthly,
    interval: "month",
    metadata: { tier: "full", billing_period: "monthly" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.full.yearly",
    name: "Scholars All Access",
    description: "Annual All Access — pay for 10 months, get 12.",
    unitAmount: scholarsAllAccessYearly,
    interval: "year",
    metadata: { tier: "full", billing_period: "yearly" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.tutor.monthly",
    name: "Scholar Tutor",
    description: "AI voice tutor, personalized help, and study conversations.",
    unitAmount: scholarsTutorMonthly,
    interval: "month",
    metadata: { tier: "tutor", billing_period: "monthly" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.tutor.yearly",
    name: "Scholar Tutor",
    description: "Annual Scholar Tutor — pay for 10 months, get 12.",
    unitAmount: scholarsTutorYearly,
    interval: "year",
    metadata: { tier: "tutor", billing_period: "yearly" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.studyguide.monthly",
    name: "Scholars Study Guide",
    description: "Upload notes, AI study guides, and smart summaries.",
    unitAmount: scholarsStudyGuideMonthly,
    interval: "month",
    metadata: { tier: "study_guide", billing_period: "monthly" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.studyguide.yearly",
    name: "Scholars Study Guide",
    description: "Annual Study Guide — pay for 10 months, get 12.",
    unitAmount: scholarsStudyGuideYearly,
    interval: "year",
    metadata: { tier: "study_guide", billing_period: "yearly" },
  },
];

/** Ballr Live — flat monthly / yearly */
export const ballrStripePlans: StripeCatalogPlan[] = [
  {
    app: "ballr",
    catalogId: "ballr.live.monthly",
    name: "Ballr Live",
    description:
      "Find pickup games, train, compete, and grow your sports community.",
    unitAmount: 4.99,
    interval: "month",
    metadata: { billing_period: "monthly" },
  },
  {
    app: "ballr",
    catalogId: "ballr.live.yearly",
    name: "Ballr Live",
    description: "Annual Ballr Live plan.",
    unitAmount: 49.99,
    interval: "year",
    metadata: { billing_period: "yearly" },
  },
];

/** TinyPal — flat monthly / yearly */
export const tinypalStripePlans: StripeCatalogPlan[] = [
  {
    app: "tinypal",
    catalogId: "tinypal.monthly",
    name: "TinyPal",
    description:
      "Safe communication designed for kids and managed by parents.",
    unitAmount: 4.99,
    interval: "month",
    metadata: { billing_period: "monthly" },
  },
  {
    app: "tinypal",
    catalogId: "tinypal.yearly",
    name: "TinyPal",
    description: "Annual TinyPal plan.",
    unitAmount: 49.99,
    interval: "year",
    metadata: { billing_period: "yearly" },
  },
];

function buildEcosystemStripePlans(): StripeCatalogPlan[] {
  const plans: StripeCatalogPlan[] = [];
  for (let n = 1; n <= 6; n += 1) {
    plans.push({
      app: "ecosystem",
      catalogId: `ecosystem.all.kids${n}.monthly`,
      name: "Future Kids All Access",
      description: ecosystemBundle.description,
      unitAmount: ecosystemMonthlyByChild[n],
      interval: "month",
      metadata: { child_count: String(n), billing_period: "monthly", bundle: "all_access" },
    });
    plans.push({
      app: "ecosystem",
      catalogId: `ecosystem.all.kids${n}.yearly`,
      name: "Future Kids All Access",
      description: ecosystemBundle.description,
      unitAmount: ecosystemYearlyByChild[n],
      interval: "year",
      metadata: { child_count: String(n), billing_period: "yearly", bundle: "all_access" },
    });
  }
  return plans;
}

export const ecosystemStripePlans = buildEcosystemStripePlans();

export const stripeCatalogPlans: StripeCatalogPlan[] = [
  ...earnlyStripePlans,
  ...scholarsStripePlans,
  ...ballrStripePlans,
  ...tinypalStripePlans,
  ...ecosystemStripePlans,
];

/** Legacy per-tier Earnly product IDs to archive when consolidating */
export const legacyEarnlyCatalogIds = [
  "earnly.kids1.monthly",
  "earnly.kids2.monthly",
  "earnly.kids3.monthly",
  "earnly.kids4.monthly",
  "earnly.kids5.monthly",
  "earnly.kids6.monthly",
  "earnly.kids1.yearly",
  "earnly.kids2.yearly",
  "earnly.kids3.yearly",
  "earnly.kids4.yearly",
  "earnly.kids5.yearly",
  "earnly.kids6.yearly",
];
