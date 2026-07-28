/**
 * Stripe catalog — Earnly / TinyPal / Ballr / Scholars use fixed child-count tiers.
 * All Access encodes Earnly + Scholars + Ballr + TinyPal seat counts.
 */

import { ecosystemBundle, bundlePrice, bundleCatalogId } from "./ecosystem-bundle";
import { earnlyLivePricing, earnlyTotalPrice } from "./earnly-pricing";
import { ballrTotalPrice } from "./ballr-pricing";
import {
  scholarsFullTotalPrice,
  scholarsStudyGuideMonthly,
  scholarsStudyGuideYearly,
  scholarsTutorMonthly,
  scholarsTutorYearly,
} from "./scholars-pricing";
import { tinypalTotalPrice } from "./tinypal-pricing";

export type StripeCatalogApp =
  | "earnly"
  | "scholars"
  | "ballr"
  | "tinypal"
  | "fresher"
  | "ecosystem";

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

/** Existing fixed Stripe product for each child-count and billing period. */
export const earnlyStripePlans: StripeCatalogPlan[] = Array.from(
  { length: earnlyLivePricing.maxChildren },
  (_, index) => index + 1,
).flatMap((childCount) => [
  {
    app: "earnly",
    catalogId: `earnly.kids${childCount}.monthly`,
    name: `Earnly Live — ${childCount} ${childCount === 1 ? "Child" : "Children"} Monthly`,
    description: "Family banking, chores, savings goals, and premium family features.",
    unitAmount: earnlyTotalPrice(childCount, "monthly"),
    interval: "month" as const,
    metadata: {
      billing_period: "monthly",
      pricing_model: "fixed_child_count",
      child_count: String(childCount),
    },
  },
  {
    app: "earnly",
    catalogId: `earnly.kids${childCount}.yearly`,
    name: `Earnly Live — ${childCount} ${childCount === 1 ? "Child" : "Children"} Yearly`,
    description: "Annual Earnly Live family plan.",
    unitAmount: earnlyTotalPrice(childCount, "yearly"),
    interval: "year" as const,
    metadata: {
      billing_period: "yearly",
      pricing_model: "fixed_child_count",
      child_count: String(childCount),
    },
  },
]);

/** Scholars Full — fixed child-count tiers; Tutor/Study Guide bill per child */
export const scholarsStripePlans: StripeCatalogPlan[] = [
  ...Array.from({ length: 6 }, (_, index) => index + 1).flatMap((childCount) => [
    {
      app: "scholars" as const,
      catalogId:
        childCount === 1
          ? "com.scholarsnotes.full.monthly"
          : `scholars.full.kids${childCount}.monthly`,
      name: `Scholars Full — ${childCount} ${childCount === 1 ? "Child" : "Children"} Monthly`,
      description:
        "AI Tutor, AI Study Podcast, AI Study Guides, Handwriting Practice, and all premium tools.",
      unitAmount: scholarsFullTotalPrice(childCount, "monthly"),
      interval: "month" as const,
      metadata: {
        tier: "full",
        billing_period: "monthly",
        pricing_model: "fixed_child_count",
        child_count: String(childCount),
      },
    },
    {
      app: "scholars" as const,
      catalogId:
        childCount === 1
          ? "com.scholarsnotes.full.yearly"
          : `scholars.full.kids${childCount}.yearly`,
      name: `Scholars Full — ${childCount} ${childCount === 1 ? "Child" : "Children"} Yearly`,
      description: "Annual Full plan — pay for 10 months, get 12.",
      unitAmount: scholarsFullTotalPrice(childCount, "yearly"),
      interval: "year" as const,
      metadata: {
        tier: "full",
        billing_period: "yearly",
        pricing_model: "fixed_child_count",
        child_count: String(childCount),
      },
    },
  ]),
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.tutor.monthly",
    name: "Scholar Tutor",
    description: "AI voice tutor, personalized help, and study conversations.",
    unitAmount: scholarsTutorMonthly,
    interval: "month",
    perChildQuantity: true,
    metadata: { tier: "tutor", billing_period: "monthly", pricing_model: "per_child" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.tutor.yearly",
    name: "Scholar Tutor",
    description: "Annual Scholar Tutor — pay for 10 months, get 12.",
    unitAmount: scholarsTutorYearly,
    interval: "year",
    perChildQuantity: true,
    metadata: { tier: "tutor", billing_period: "yearly", pricing_model: "per_child" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.studyguide.monthly",
    name: "Scholars Study Guide",
    description: "Upload notes, AI study guides, and smart summaries.",
    unitAmount: scholarsStudyGuideMonthly,
    interval: "month",
    perChildQuantity: true,
    metadata: { tier: "study_guide", billing_period: "monthly", pricing_model: "per_child" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.studyguide.yearly",
    name: "Scholars Study Guide",
    description: "Annual Study Guide — pay for 10 months, get 12.",
    unitAmount: scholarsStudyGuideYearly,
    interval: "year",
    perChildQuantity: true,
    metadata: { tier: "study_guide", billing_period: "yearly", pricing_model: "per_child" },
  },
];

/** Ballr Live — fixed child-count tiers ($4.99 first + $1.99 each additional) */
export const ballrStripePlans: StripeCatalogPlan[] = Array.from(
  { length: 6 },
  (_, index) => index + 1,
).flatMap((childCount) => [
  {
    app: "ballr" as const,
    catalogId:
      childCount === 1 ? "ballr.live.monthly" : `ballr.kids${childCount}.monthly`,
    name: `Ballr Live — ${childCount} ${childCount === 1 ? "Child" : "Children"} Monthly`,
    description:
      "Find pickup games, train, compete, and grow your sports community.",
    unitAmount: ballrTotalPrice(childCount, "monthly"),
    interval: "month" as const,
    metadata: {
      billing_period: "monthly",
      pricing_model: "fixed_child_count",
      child_count: String(childCount),
    },
  },
  {
    app: "ballr" as const,
    catalogId:
      childCount === 1 ? "ballr.live.yearly" : `ballr.kids${childCount}.yearly`,
    name: `Ballr Live — ${childCount} ${childCount === 1 ? "Child" : "Children"} Yearly`,
    description: "Annual Ballr Live plan — pay for 10 months, get 12.",
    // Keep kids1 yearly at legacy $49.99 to match existing live Stripe price
    unitAmount: childCount === 1 ? 49.99 : ballrTotalPrice(childCount, "yearly"),
    interval: "year" as const,
    metadata: {
      billing_period: "yearly",
      pricing_model: "fixed_child_count",
      child_count: String(childCount),
    },
  },
]);

/** TinyPal — fixed child-count tiers ($4.99 first + $1.99 each additional) */
export const tinypalStripePlans: StripeCatalogPlan[] = Array.from(
  { length: 6 },
  (_, index) => index + 1,
).flatMap((childCount) => [
  {
    app: "tinypal" as const,
    catalogId: `tinypal.kids${childCount}.monthly`,
    name: `TinyPal — ${childCount} ${childCount === 1 ? "Child" : "Children"} Monthly`,
    description:
      "Safe communication designed for kids and managed by parents.",
    unitAmount: tinypalTotalPrice(childCount, "monthly"),
    interval: "month" as const,
    metadata: {
      billing_period: "monthly",
      pricing_model: "fixed_child_count",
      child_count: String(childCount),
    },
  },
  {
    app: "tinypal" as const,
    catalogId: `tinypal.kids${childCount}.yearly`,
    name: `TinyPal — ${childCount} ${childCount === 1 ? "Child" : "Children"} Yearly`,
    description: "Annual TinyPal plan — pay for 10 months, get 12.",
    unitAmount: tinypalTotalPrice(childCount, "yearly"),
    interval: "year" as const,
    metadata: {
      billing_period: "yearly",
      pricing_model: "fixed_child_count",
      child_count: String(childCount),
    },
  },
]);

/** Freshys — flat monthly / yearly (family health / local food) */
export const fresherStripePlans: StripeCatalogPlan[] = [
  {
    app: "fresher",
    catalogId: "fresher.monthly",
    name: "Freshys",
    description: "Find real food near your family on an interactive map.",
    unitAmount: 1.5,
    interval: "month",
    metadata: { billing_period: "monthly" },
  },
  {
    app: "fresher",
    catalogId: "fresher.yearly",
    name: "Freshys",
    description: "Annual Freshys plan — best value.",
    unitAmount: 9.99,
    interval: "year",
    metadata: { billing_period: "yearly", recommended: "true" },
  },
];

function buildEcosystemStripePlans(): StripeCatalogPlan[] {
  const plans: StripeCatalogPlan[] = [];
  for (let earnly = 1; earnly <= 6; earnly += 1) {
    for (let scholars = 1; scholars <= 6; scholars += 1) {
      for (let ballr = 1; ballr <= 6; ballr += 1) {
        for (let tinypal = 1; tinypal <= 6; tinypal += 1) {
          for (const period of ["monthly", "yearly"] as const) {
            const catalogId = bundleCatalogId(
              earnly,
              period,
              tinypal,
              scholars,
              ballr,
            );
            plans.push({
              app: "ecosystem",
              catalogId,
              name: "Genlyn All Access",
              description: ecosystemBundle.description,
              unitAmount: bundlePrice(earnly, period, tinypal, scholars, ballr),
              interval: period === "monthly" ? "month" : "year",
              metadata: {
                child_count: String(earnly),
                earnly_child_count: String(earnly),
                scholars_child_count: String(scholars),
                ballr_child_count: String(ballr),
                tinypal_child_count: String(tinypal),
                billing_period: period,
                bundle: "all_access",
              },
            });
          }
        }
      }
    }
  }
  return plans;
}

export const ecosystemStripePlans = buildEcosystemStripePlans();

export const stripeCatalogPlans: StripeCatalogPlan[] = [
  ...earnlyStripePlans,
  ...scholarsStripePlans,
  ...ballrStripePlans,
  ...tinypalStripePlans,
  ...fresherStripePlans,
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
