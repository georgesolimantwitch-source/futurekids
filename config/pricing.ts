/**
 * Central pricing configuration.
 * Replace placeholder prices, discounts, and CTA destinations when billing launches.
 */

import { apps, type AppSlug, getAppCtaHref, isAppLive } from "./brand";
import { bundlePrice } from "./ecosystem-bundle";
import { earnlyTotalPrice } from "./earnly-pricing";
import { ballrTotalPrice } from "./ballr-pricing";
import {
  scholarsFullTotalPrice,
  scholarsTutorMonthly,
  scholarsTutorYearly,
} from "./scholars-pricing";
import { tinypalTotalPrice } from "./tinypal-pricing";

export type { AppSlug };

export type BillingPeriod = "monthly" | "yearly";

export interface PricePlaceholder {
  /** User-facing label — e.g. "Price to be announced" */
  display: string;
  /**
   * Numeric amount for calculator previews only.
   * Set when pricing is finalized; leave null until then.
   */
  amount: number | null;
}

export interface PricingPlanConfig {
  appId: AppSlug;
  name: string;
  description: string;
  accentColor: string;
  accentColorLight: string;
  iconPath: string;
  learnMorePath: string;
  availability: "live" | "waitlist";
  monthlyPrice: PricePlaceholder;
  yearlyPrice: PricePlaceholder;
  features: string[];
  cta: {
    label: string;
    href: string;
    external?: boolean;
  };
  memberSavingsMessage: string;
  /** Optional badge shown when yearly is selected (e.g. Freshys Best Value) */
  yearlyBadge?: string;
  /** Prefer this period in the UI when present */
  recommendedPeriod?: BillingPeriod;
}

export interface SavingsTierConfig {
  id: "one" | "two" | "three_plus";
  title: string;
  subtitle: string;
  minApps: number;
  maxApps: number;
  benefits: string[];
  /** Placeholder — set e.g. "10%" when finalized */
  discountLabel: string;
  /** Placeholder numeric discount for calculator; null until finalized */
  discountPercent: number | null;
}

export interface ComparisonRow {
  feature: string;
  oneApp: boolean | string;
  twoApps: boolean | string;
  threePlus: boolean | string;
}

export interface PricingFaq {
  question: string;
  answer: string;
}

export const pricingPageMeta = {
  title: "Plans & Pricing",
  description:
    "Genlyn All Access — every app in one subscription. Or choose individual plans for Earnly, Scholars Notes, Ballr Live, TinyPal, and Freshys.",
};

export const pricingHero = {
  eyebrow: "Individual apps",
  headline: "Need just one app?",
  supportingText:
    "Subscribe to a single app — or save more with All Access above.",
  pricingNotice: "Individual plans do not include ecosystem bundle savings.",
};

export const billingOptions: {
  id: BillingPeriod;
  label: string;
  badge?: string;
}[] = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly", badge: "2 mo free" },
];

/** Per-app pricing details — colors/icons synced from brand apps */
const pricingPlanOverrides: Record<
  AppSlug,
  Omit<
    PricingPlanConfig,
    | "appId"
    | "name"
    | "accentColor"
    | "accentColorLight"
    | "iconPath"
    | "learnMorePath"
    | "availability"
    | "cta"
  >
> = {
  earnly: {
    description:
      "Teach kids how to earn, save, and build better money habits.",
    monthlyPrice: { display: "$1.99 / child / mo", amount: 1.99 },
    yearlyPrice: { display: "$19.90 / child / yr", amount: 19.9 },
    features: [
      "Chores & allowances",
      "Savings goals",
      "Parent approvals",
      "Family dashboard",
      "School rewards",
    ],
    memberSavingsMessage:
      "Already subscribed to another app? Unlock member savings.",
  },
  scholars: {
    description:
      "AI-powered tools that make learning and studying easier.",
    monthlyPrice: {
      display: "From $9.99 / mo",
      amount: scholarsTutorMonthly,
    },
    yearlyPrice: {
      display: `From $${scholarsTutorYearly.toFixed(2)} / yr`,
      amount: scholarsTutorYearly,
    },
    features: [
      "Full $14.99 · Tutor & Study Guide $9.99 / child",
      "AI tutor, study guides & quizzes",
      "Notes workspace",
      "Handwriting practice (Full)",
    ],
    memberSavingsMessage:
      "Already subscribed to another app? Unlock member savings.",
  },
  ballr: {
    description:
      "Find games, train, compete, and grow your sports community.",
    monthlyPrice: { display: "From $4.99 / mo", amount: 4.99 },
    yearlyPrice: { display: "From $49.90 / yr", amount: 49.9 },
    features: [
      "$4.99 for 1 child",
      "+$1.99 per additional child",
      "Pickup game finder",
      "Nearby parks",
      "Sports communities",
    ],
    memberSavingsMessage:
      "Already subscribed to another app? Unlock member savings.",
  },
  tinypal: {
    description:
      "Safe communication designed for kids and managed by parents.",
    monthlyPrice: { display: "From $4.99 / mo", amount: 4.99 },
    yearlyPrice: { display: "From $49.90 / yr", amount: 49.9 },
    features: [
      "$4.99 for 1 child",
      "+$1.99 per additional child",
      "Parent-managed setup",
      "Verified family contacts",
      "Safe messaging",
    ],
    memberSavingsMessage:
      "Already subscribed to another app? Unlock member savings.",
  },
  fresher: {
    description: "Find real food near your family.",
    monthlyPrice: { display: "$1.50 / mo", amount: 1.5 },
    yearlyPrice: { display: "$9.99 / yr", amount: 9.99 },
    features: [
      "Interactive local map",
      "Nearby farms",
      "Farmers markets",
      "Farm stores",
      "Locally produced food",
    ],
    memberSavingsMessage:
      "Already subscribed to another app? Unlock member savings.",
    yearlyBadge: "Best Value · Save 44%",
    recommendedPeriod: "yearly",
  },
};

export const pricingPlans: PricingPlanConfig[] = apps.map((app) => {
  const override = pricingPlanOverrides[app.slug];
  const live = isAppLive(app);

  return {
    appId: app.slug,
    name: app.name,
    description: override.description,
    accentColor: app.accentColor,
    accentColorLight: app.accentColorLight,
    iconPath: app.iconPath,
    learnMorePath: app.learnMorePath,
    availability: app.availability,
    monthlyPrice: override.monthlyPrice,
    yearlyPrice: override.yearlyPrice,
    features: override.features,
    cta: live
      ? {
          label: `Get ${app.name}`,
          href: getAppCtaHref(app),
          external: true,
        }
      : {
          label: app.cta.label,
          href: app.cta.href,
          external: false,
        },
    memberSavingsMessage: override.memberSavingsMessage,
    yearlyBadge: override.yearlyBadge,
    recommendedPeriod: override.recommendedPeriod,
  };
});

export const savingsTiers: SavingsTierConfig[] = [
  {
    id: "one",
    title: "One App",
    subtitle: "One individual app subscription",
    minApps: 1,
    maxApps: 1,
    benefits: [
      "One individual app subscription",
      "Standard pricing",
      "Access to that app’s full features",
    ],
    discountLabel: "Standard pricing",
    discountPercent: null,
  },
  {
    id: "two",
    title: "Two Apps",
    subtitle: "Choose any two apps",
    minApps: 2,
    maxApps: 2,
    benefits: [
      "Choose any two apps",
      "Discount applied to the second app",
      "One account for managing subscriptions",
    ],
    discountLabel: "Ecosystem savings unlocked",
    discountPercent: null,
  },
  {
    id: "three_plus",
    title: "Three or More Apps",
    subtitle: "Combine three or more apps",
    minApps: 3,
    maxApps: 5,
    benefits: [
      "Combine three or more apps",
      "Compare vs Genlyn All Access",
      "Centralized subscription management",
      "Early access to future ecosystem benefits",
    ],
    discountLabel: "Maximum savings — compare All Access",
    discountPercent: null,
  },
];

export const ecosystemBuilderCopy = {
  title: "Build your ecosystem",
  description:
    "Select the apps your family uses. Totals use real app prices — Scholars Full at $14.99/mo.",
  empty: "Select an app to begin building your plan.",
  oneApp: "Add another app to compare with All Access.",
  multiApp: "Compare your selection with Genlyn All Access.",
  labels: {
    selectedCount: "Apps selected",
    includedApps: "Included apps",
    originalTotal: "À la carte total",
    ecosystemSavings: "vs All Access",
    estimatedTotal: "Your selection",
    currentTier: "Current tier",
    allAccessPrice: "Genlyn All Access",
  },
};

export const existingSubscriberSection = {
  headline: "Already part of the ecosystem?",
  text: "Sign in with the account connected to your existing app subscription to view personalized savings on additional apps.",
  signInHref: "/login",
  viewAppsHref: "/account",
};

export const multiAppSavingsSection = {
  headline: "More apps. More value.",
  supportingText:
    "Your active subscriptions unlock savings across the entire ecosystem.",
};

export const comparisonRows: ComparisonRow[] = [
  {
    feature: "Full app access",
    oneApp: true,
    twoApps: true,
    threePlus: true,
  },
  {
    feature: "Flexible app selection",
    oneApp: "One app",
    twoApps: "Any two apps",
    threePlus: "Any three or more apps",
  },
  {
    feature: "Additional-app savings",
    oneApp: false,
    twoApps: "Placeholder discount",
    threePlus: "Largest placeholder discount",
  },
  {
    feature: "Central subscription management",
    oneApp: false,
    twoApps: true,
    threePlus: true,
  },
  {
    feature: "Yearly billing option",
    oneApp: true,
    twoApps: true,
    threePlus: true,
  },
  {
    feature: "Future member benefits",
    oneApp: false,
    twoApps: "Coming soon",
    threePlus: "Priority access",
  },
  {
    feature: "Priority access to new ecosystem apps",
    oneApp: false,
    twoApps: false,
    threePlus: "Coming soon",
  },
];

export const comparisonColumns = [
  { id: "oneApp", label: "Individual App" },
  { id: "twoApps", label: "Two Apps" },
  { id: "threePlus", label: "Three or More Apps" },
] as const;

export const pricingFaqs: PricingFaq[] = [
  {
    question: "Can I subscribe to only one app?",
    answer:
      "Yes. Each app can be subscribed to individually. You only pay for the apps your family uses.",
  },
  {
    question: "How do additional-app discounts work?",
    answer:
      "If you already subscribe to one app, you will receive savings when adding another. Exact discount amounts are not finalized yet and will be announced before launch.",
  },
  {
    question: "Can I choose which apps are included?",
    answer:
      "Yes. You can mix and match any combination of Earnly, Scholars Notes, Ballr, TinyPal, and Freshys based on what your family needs.",
  },
  {
    question: "Can I change my apps later?",
    answer:
      "We plan to support adding or removing apps from your plan. Final change policies will be confirmed before launch.",
  },
  {
    question: "Are subscriptions managed through Apple?",
    answer:
      "Some apps may use Apple’s in-app subscription system on iOS. Final billing details will be confirmed before launch.",
  },
  {
    question: "Will Android subscriptions be supported?",
    answer:
      "Android billing options are being evaluated. Final billing details will be confirmed before launch.",
  },
  {
    question: "Can parents manage every subscription from one account?",
    answer:
      "Centralized family subscription management is a goal of the ecosystem. Specific features and availability will be confirmed before launch.",
  },
  {
    question: "When will final pricing be announced?",
    answer:
      "Pricing is not finalized yet. Join our apps or contact list to be notified when plans and discounts go live.",
  },
];

export const pricingCta = {
  headline: "Start with one. Grow with your family.",
  supportingText:
    "Choose the apps your family needs today and unlock more value as your ecosystem grows.",
  exploreAppsHref: "/#apps",
  comparePlansHref: "#comparison",
};

export function getPricingPlan(appId: AppSlug): PricingPlanConfig | undefined {
  return pricingPlans.find((plan) => plan.appId === appId);
}

export function getSavingsTierForCount(count: number): SavingsTierConfig {
  if (count >= 3) return savingsTiers[2];
  if (count === 2) return savingsTiers[1];
  return savingsTiers[0];
}

export function getPriceForPeriod(
  plan: PricingPlanConfig,
  period: BillingPeriod,
): PricePlaceholder {
  return period === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
}

const ALL_APP_SLUGS: AppSlug[] = [
  "earnly",
  "scholars",
  "ballr",
  "tinypal",
  "fresher",
];

/** Real per-app price for the ecosystem calculator (1 Earnly child, Scholars Full) */
export function getCalculatorAppAmount(
  appId: AppSlug,
  period: BillingPeriod,
  earnlyChildren = 1,
): number {
  switch (appId) {
    case "earnly":
      return earnlyTotalPrice(earnlyChildren, period);
    case "scholars":
      return scholarsFullTotalPrice(1, period);
    case "ballr":
      return ballrTotalPrice(1, period);
    case "tinypal":
      return tinypalTotalPrice(1, period);
    case "fresher":
      return period === "monthly" ? 1.5 : 9.99;
    default:
      return 0;
  }
}

function formatCalculatorTotal(amount: number, period: BillingPeriod): string {
  const suffix = period === "monthly" ? "mo" : "yr";
  return `$${amount.toFixed(2)} / ${suffix}`;
}

export function calculateEcosystemTotals(
  selectedAppIds: AppSlug[],
  period: BillingPeriod,
): {
  originalTotal: string;
  savings: string;
  estimatedTotal: string;
  allAccessPrice: string | null;
  tier: SavingsTierConfig;
} {
  const tier = getSavingsTierForCount(selectedAppIds.length);
  const suffix = period === "monthly" ? "mo" : "yr";

  if (selectedAppIds.length === 0) {
    return {
      originalTotal: "—",
      savings: "—",
      estimatedTotal: "—",
      allAccessPrice: null,
      tier,
    };
  }

  const selectionTotal = selectedAppIds.reduce(
    (sum, id) => sum + getCalculatorAppAmount(id, period),
    0,
  );
  const allFourSelected = ALL_APP_SLUGS.every((id) => selectedAppIds.includes(id));
  const fullAlaCarte = ALL_APP_SLUGS.reduce(
    (sum, id) => sum + getCalculatorAppAmount(id, period),
    0,
  );
  const allAccessAmount = bundlePrice(1, period);

  if (selectedAppIds.length === 1) {
    return {
      originalTotal: formatCalculatorTotal(selectionTotal, period),
      savings: "—",
      estimatedTotal: formatCalculatorTotal(selectionTotal, period),
      allAccessPrice: formatCalculatorTotal(allAccessAmount, period),
      tier,
    };
  }

  const vsAllAccess = selectionTotal - allAccessAmount;

  if (allFourSelected) {
    const savingsAmount = Math.max(0, fullAlaCarte - allAccessAmount);
    return {
      originalTotal: formatCalculatorTotal(fullAlaCarte, period),
      savings:
        savingsAmount > 0
          ? `Save $${savingsAmount.toFixed(2)}/${suffix} with All Access`
          : `All Access $${allAccessAmount.toFixed(2)}/${suffix} — one bill, every feature`,
      estimatedTotal: formatCalculatorTotal(selectionTotal, period),
      allAccessPrice: formatCalculatorTotal(allAccessAmount, period),
      tier,
    };
  }

  return {
    originalTotal: formatCalculatorTotal(selectionTotal, period),
    savings:
      vsAllAccess > 0
        ? `$${vsAllAccess.toFixed(2)}/${suffix} less than All Access now`
        : `All Access saves $${Math.abs(vsAllAccess).toFixed(2)}/${suffix} at full ecosystem`,
    estimatedTotal: formatCalculatorTotal(selectionTotal, period),
    allAccessPrice: formatCalculatorTotal(allAccessAmount, period),
    tier,
  };
}

export function getBuilderStatusMessage(count: number): string {
  if (count === 0) return ecosystemBuilderCopy.empty;
  if (count === 1) return ecosystemBuilderCopy.oneApp;
  return ecosystemBuilderCopy.multiApp;
}

/** Accent colors for ecosystem visual strip */
export const ecosystemAccentColors = pricingPlans.map((p) => p.accentColor);
