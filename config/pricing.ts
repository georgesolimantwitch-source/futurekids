/**
 * Central pricing configuration.
 * Replace placeholder prices, discounts, and CTA destinations when billing launches.
 */

import { apps, type AppSlug, getAppCtaHref, isAppLive } from "./brand";

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
    "Explore individual app plans and ecosystem savings across Earnly, Scholars Notes, Ballr, and TinyPal. Final pricing coming soon.",
};

export const pricingHero = {
  eyebrow: "Plans & Pricing",
  headline: "Choose the apps that fit your family.",
  supportingText:
    "Start with one app and save when you add more to your ecosystem.",
  pricingNotice:
    "Pricing is not finalized yet. Amounts shown are placeholders until launch.",
};

export const billingOptions: {
  id: BillingPeriod;
  label: string;
  badge?: string;
}[] = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly", badge: "Save more" },
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
    monthlyPrice: { display: "Price to be announced", amount: null },
    yearlyPrice: { display: "Price to be announced", amount: null },
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
    monthlyPrice: { display: "Price to be announced", amount: null },
    yearlyPrice: { display: "Price to be announced", amount: null },
    features: [
      "Notes workspace",
      "AI tutor",
      "Study guides & quizzes",
      "Assignments tracker",
      "Podcasts from notes",
    ],
    memberSavingsMessage:
      "Already subscribed to another app? Unlock member savings.",
  },
  ballr: {
    description:
      "Find games, train, compete, and grow your sports community.",
    monthlyPrice: { display: "Price to be announced", amount: null },
    yearlyPrice: { display: "Price to be announced", amount: null },
    features: [
      "Pickup game finder",
      "Nearby parks",
      "Sports communities",
      "Player ratings",
      "Training progress",
    ],
    memberSavingsMessage:
      "Already subscribed to another app? Unlock member savings.",
  },
  tinypal: {
    description:
      "Safe communication designed for kids and managed by parents.",
    monthlyPrice: { display: "Coming soon", amount: null },
    yearlyPrice: { display: "Coming soon", amount: null },
    features: [
      "Parent-managed setup",
      "Verified family contacts",
      "Safe messaging",
      "Family controls",
      "Child-focused privacy",
    ],
    memberSavingsMessage:
      "Join the waitlist — ecosystem pricing will be available at launch.",
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
    discountLabel: "Ecosystem savings — amount TBA",
    discountPercent: null,
  },
  {
    id: "three_plus",
    title: "Three or More Apps",
    subtitle: "Combine three or all four apps",
    minApps: 3,
    maxApps: 4,
    benefits: [
      "Combine three or all four apps",
      "Largest ecosystem savings",
      "Centralized subscription management",
      "Early access to future ecosystem benefits",
    ],
    discountLabel: "Maximum savings — amount TBA",
    discountPercent: null,
  },
];

export const ecosystemBuilderCopy = {
  title: "Build your ecosystem",
  description:
    "Select the apps your family uses today. Savings tiers update automatically — no checkout yet.",
  empty: "Select an app to begin building your plan.",
  oneApp: "Add another app to unlock ecosystem savings.",
  multiApp: "Your ecosystem savings have been unlocked.",
  labels: {
    selectedCount: "Apps selected",
    includedApps: "Included apps",
    originalTotal: "Original total (placeholder)",
    ecosystemSavings: "Ecosystem savings (placeholder)",
    estimatedTotal: "Estimated total (placeholder)",
    currentTier: "Current savings tier",
  },
};

export const existingSubscriberSection = {
  headline: "Already part of the ecosystem?",
  text: "Sign in with the account connected to your existing app subscription to view personalized savings on additional apps.",
  signInHref: "/contact?intent=sign-in",
  viewAppsHref: "/#apps",
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
    threePlus: "Any three or four apps",
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
      "Yes. You can mix and match any combination of Earnly, Scholars Notes, Ballr, and TinyPal based on what your family needs.",
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

/** Calculator totals — returns null displays when amounts are not set */
export function calculateEcosystemTotals(
  selectedAppIds: AppSlug[],
  period: BillingPeriod,
): {
  originalTotal: string;
  savings: string;
  estimatedTotal: string;
  tier: SavingsTierConfig;
} {
  const tier = getSavingsTierForCount(selectedAppIds.length);
  const plans = selectedAppIds
    .map((id) => getPricingPlan(id))
    .filter(Boolean) as PricingPlanConfig[];

  const amounts = plans.map((p) => getPriceForPeriod(p, period).amount);
  const hasAmounts = amounts.every((a) => a !== null);

  if (!hasAmounts || selectedAppIds.length === 0) {
    return {
      originalTotal: "Price to be announced",
      savings: tier.discountPercent
        ? `${tier.discountPercent}% (placeholder)`
        : "Amount TBA",
      estimatedTotal: "Price to be announced",
      tier,
    };
  }

  const original = amounts.reduce((sum, a) => sum + (a ?? 0), 0);
  const discount = tier.discountPercent ?? 0;
  const savingsAmount = original * (discount / 100);
  const estimated = original - savingsAmount;

  return {
    originalTotal: `$${original.toFixed(2)} / ${period === "monthly" ? "mo" : "yr"}`,
    savings:
      discount > 0
        ? `$${savingsAmount.toFixed(2)} (${discount}% placeholder)`
        : "Amount TBA",
    estimatedTotal: `$${estimated.toFixed(2)} / ${period === "monthly" ? "mo" : "yr"}`,
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
