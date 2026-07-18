import { stripeCatalogPlans, type StripeCatalogPlan } from "@/config/stripe-catalog";

export const APP_KEYS = [
  "earnly",
  "scholars",
  "ballr",
  "tinypal",
  "futurekids_all_access",
] as const;

export type AppKey = (typeof APP_KEYS)[number];
export type BillingInterval = "month" | "year";

export interface ProductCatalogPlan {
  appKey: AppKey;
  planKey: string;
  providers: readonly ["stripe", "apple"];
  stripePriceEnv: string;
  stripeProductEnv: string;
  stripePriceId: string;
  stripeProductId: string;
  appleProductEnv: string;
  interval: BillingInterval;
  displayName: string;
  expectedAmountCents: number;
  perChildQuantity: boolean;
  fixedChildCount: number | null;
  tierKey: string;
  entitlementRank: number;
  childLimit: number | null;
  limits: Record<string, number | boolean | string>;
  features: Record<string, boolean>;
  legacyCatalogId: string;
}

const LEGACY_PLAN_KEYS: Record<string, string> = {
  "com.scholarsnotes.full.monthly": "scholars_all_access_monthly",
  "com.scholarsnotes.full.yearly": "scholars_all_access_yearly",
  "com.scholarsnotes.tutor.monthly": "scholars_tutor_monthly",
  "com.scholarsnotes.tutor.yearly": "scholars_tutor_yearly",
  "com.scholarsnotes.studyguide.monthly": "scholars_study_guide_monthly",
  "com.scholarsnotes.studyguide.yearly": "scholars_study_guide_yearly",
  "ballr.live.monthly": "ballr_monthly",
  "ballr.live.yearly": "ballr_yearly",
  "tinypal.monthly": "tinypal_monthly",
  "tinypal.yearly": "tinypal_yearly",
};

const EXISTING_STRIPE_IDS: Record<
  string,
  { priceId: string; productId: string }
> = {
  earnly_kids1_monthly: {
    priceId: "price_1TsUh7LD305HTgIx3noteXjw",
    productId: "prod_UsFBozbxDdl1v6",
  },
  earnly_kids1_yearly: {
    priceId: "price_1TsUhCLD305HTgIxPJLs0I2F",
    productId: "prod_UsFBeXiPCZRY1V",
  },
  earnly_kids2_monthly: {
    priceId: "price_1TsUh7LD305HTgIxKrtzEBbq",
    productId: "prod_UsFBBQJLwT8SuJ",
  },
  earnly_kids2_yearly: {
    priceId: "price_1TsUhDLD305HTgIx9bcd6Sf9",
    productId: "prod_UsFB85TLFClSjz",
  },
  earnly_kids3_monthly: {
    priceId: "price_1TsUh9LD305HTgIxTcWDOWOd",
    productId: "prod_UsFBX0LUDwHwgz",
  },
  earnly_kids3_yearly: {
    priceId: "price_1TsUhDLD305HTgIxInwdq4z5",
    productId: "prod_UsFBOlcFx3ZeDl",
  },
  earnly_kids4_monthly: {
    priceId: "price_1TsUhALD305HTgIxYobb9hOr",
    productId: "prod_UsFBPFrZD8YuWO",
  },
  earnly_kids4_yearly: {
    priceId: "price_1TsUhELD305HTgIxlZfAYNft",
    productId: "prod_UsFBzAGHt2ukju",
  },
  earnly_kids5_monthly: {
    priceId: "price_1TsUhALD305HTgIxWW0i3jH3",
    productId: "prod_UsFBUlpZqdsO3i",
  },
  earnly_kids5_yearly: {
    priceId: "price_1TsUhFLD305HTgIxv7DV4AlY",
    productId: "prod_UsFBsD73LrNBeg",
  },
  earnly_kids6_monthly: {
    priceId: "price_1TsUhBLD305HTgIx4KwFJ2Ua",
    productId: "prod_UsFBYMY8WuXC5z",
  },
  earnly_kids6_yearly: {
    priceId: "price_1TsUhGLD305HTgIx5tSruxg6",
    productId: "prod_UsFBKvluLL6FYw",
  },
  scholars_all_access_monthly: {
    priceId: "price_1TsVYFLD305HTgIx2wnYgRNs",
    productId: "prod_UsFHSnfK7VtUHn",
  },
  scholars_all_access_yearly: {
    priceId: "price_1TsVYFLD305HTgIxjIv2RGkN",
    productId: "prod_UsFHSnfK7VtUHn",
  },
  scholars_tutor_monthly: {
    priceId: "price_1TsVYGLD305HTgIxoFA3R8Lu",
    productId: "prod_UsFHr0OvfxUttR",
  },
  scholars_tutor_yearly: {
    priceId: "price_1TsVYHLD305HTgIxlxmwi6P7",
    productId: "prod_UsFHr0OvfxUttR",
  },
  scholars_study_guide_monthly: {
    priceId: "price_1TsVYILD305HTgIxUVLDSU8W",
    productId: "prod_UsFH3UCV7sXpTr",
  },
  scholars_study_guide_yearly: {
    priceId: "price_1TsVYILD305HTgIxSljyvZpP",
    productId: "prod_UsFH3UCV7sXpTr",
  },
  ballr_monthly: {
    priceId: "price_1TsUpcLD305HTgIxvAuElEgw",
    productId: "prod_UsFKFCUxLmVonC",
  },
  ballr_yearly: {
    priceId: "price_1TsUpdLD305HTgIxAwQfTAo5",
    productId: "prod_UsFKFCUxLmVonC",
  },
  tinypal_monthly: {
    priceId: "price_1TsUpeLD305HTgIx2PyG9x2l",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_yearly: {
    priceId: "price_1TsUpeLD305HTgIxEBPG585G",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  futurekids_all_access_kids1_monthly: {
    priceId: "price_1TsUs3LD305HTgIx5lh3ESql",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_kids1_yearly: {
    priceId: "price_1TsVs0LD305HTgIxrHo5e5lU",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_kids2_monthly: {
    priceId: "price_1TsVs0LD305HTgIxVgjmeiyY",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_kids2_yearly: {
    priceId: "price_1TsVs1LD305HTgIxSoQNI1vj",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_kids3_monthly: {
    priceId: "price_1TsVs1LD305HTgIx5nYjnJHK",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_kids3_yearly: {
    priceId: "price_1TsVs2LD305HTgIxyq2ruz6k",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_kids4_monthly: {
    priceId: "price_1TsVs2LD305HTgIx4VnUn1u3",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_kids4_yearly: {
    priceId: "price_1TsVs3LD305HTgIxuAZtCDfK",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_kids5_monthly: {
    priceId: "price_1TsVs3LD305HTgIxItP0IymZ",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_kids5_yearly: {
    priceId: "price_1TsVs4LD305HTgIxprzbB0E3",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_kids6_monthly: {
    priceId: "price_1TsVs4LD305HTgIxmZUh41mw",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_kids6_yearly: {
    priceId: "price_1TsVs5LD305HTgIx5qvDIy2u",
    productId: "prod_UsFMZVziq3wNAv",
  },
};

function planKeyForLegacyCatalogId(catalogId: string): string {
  const direct = LEGACY_PLAN_KEYS[catalogId];
  if (direct) return direct;

  const earnly = /^earnly\.kids([1-6])\.(monthly|yearly)$/.exec(catalogId);
  if (earnly) {
    return `earnly_kids${earnly[1]}_${earnly[2]}`;
  }

  const bundle = /^ecosystem\.all\.kids([1-6])\.(monthly|yearly)$/.exec(catalogId);
  if (bundle) {
    return `futurekids_all_access_kids${bundle[1]}_${bundle[2]}`;
  }

  throw new Error(`Unknown catalog plan: ${catalogId}`);
}

function appKeyForPlan(plan: StripeCatalogPlan): AppKey {
  return plan.app === "ecosystem" ? "futurekids_all_access" : plan.app;
}

function envPrefix(planKey: string): string {
  return planKey.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function fixedChildCount(plan: StripeCatalogPlan): number | null {
  const value = Number(plan.metadata?.child_count);
  return Number.isInteger(value) ? value : null;
}

function capabilities(
  appKey: AppKey,
  planKey: string,
  childCount: number | null,
): Pick<
  ProductCatalogPlan,
  "tierKey" | "entitlementRank" | "childLimit" | "limits" | "features"
> {
  if (appKey === "futurekids_all_access") {
    return {
      tierKey: "all_access",
      entitlementRank: 1000,
      childLimit: childCount,
      limits: childCount ? { childLimit: childCount } : {},
      features: { allAccess: true },
    };
  }
  if (appKey === "earnly") {
    return {
      tierKey: "family",
      entitlementRank: 300,
      childLimit: childCount,
      limits: childCount ? { childLimit: childCount } : {},
      features: {
        chores: true,
        allowances: true,
        savingsGoals: true,
        familyDashboard: true,
      },
    };
  }
  if (appKey === "scholars") {
    if (planKey.includes("_all_access_")) {
      return {
        tierKey: "all_access",
        entitlementRank: 300,
        childLimit: null,
        limits: {},
        features: {
          aiTutor: true,
          studyGuides: true,
          handwriting: true,
          studyPodcasts: true,
        },
      };
    }
    if (planKey.includes("_tutor_")) {
      return {
        tierKey: "tutor",
        entitlementRank: 200,
        childLimit: null,
        limits: {},
        features: { aiTutor: true },
      };
    }
    return {
      tierKey: "study_guide",
      entitlementRank: 200,
      childLimit: null,
      limits: {},
      features: { studyGuides: true },
    };
  }
  return {
    tierKey: appKey === "ballr" ? "premium" : "family",
    entitlementRank: 300,
    childLimit: null,
    limits: {},
    features: { premium: true },
  };
}

export const productCatalog: readonly ProductCatalogPlan[] = stripeCatalogPlans.map((plan) => {
  const planKey = planKeyForLegacyCatalogId(plan.catalogId);
  const prefix = envPrefix(planKey);
  const stripe = EXISTING_STRIPE_IDS[planKey];
  if (!stripe) throw new Error(`Missing existing Stripe mapping for ${planKey}`);
  const appKey = appKeyForPlan(plan);
  const childCount = fixedChildCount(plan);

  return {
    appKey,
    planKey,
    providers: ["stripe", "apple"] as const,
    stripePriceEnv: `STRIPE_${prefix}_PRICE_ID`,
    stripeProductEnv: `STRIPE_${prefix}_PRODUCT_ID`,
    stripePriceId: stripe.priceId,
    stripeProductId: stripe.productId,
    appleProductEnv: `APPLE_${prefix}_PRODUCT_ID`,
    interval: plan.interval,
    displayName: plan.name,
    expectedAmountCents: Math.round(plan.unitAmount * 100),
    perChildQuantity: Boolean(plan.perChildQuantity),
    fixedChildCount: childCount,
    ...capabilities(appKey, planKey, childCount),
    legacyCatalogId: plan.catalogId,
  };
});

const plansByKey = new Map(productCatalog.map((plan) => [plan.planKey, plan]));
const plansByCatalogId = new Map(
  productCatalog.map((plan) => [plan.legacyCatalogId, plan]),
);

export function getProductPlan(planKey: string): ProductCatalogPlan | null {
  return plansByKey.get(planKey) ?? null;
}

export function getProductPlanByCatalogId(catalogId: string): ProductCatalogPlan | null {
  return plansByCatalogId.get(catalogId) ?? null;
}

export function requireProductPlan(planKey: string): ProductCatalogPlan {
  const plan = getProductPlan(planKey);
  if (!plan) throw new Error("Unknown plan key");
  return plan;
}

export function configuredStripePriceId(plan: ProductCatalogPlan): string {
  return process.env[plan.stripePriceEnv]?.trim() || plan.stripePriceId;
}

export function configuredStripeProductId(plan: ProductCatalogPlan): string {
  return process.env[plan.stripeProductEnv]?.trim() || plan.stripeProductId;
}

export function configuredAppleProductId(plan: ProductCatalogPlan): string | null {
  return process.env[plan.appleProductEnv]?.trim() || null;
}

export function findPlanByStripePriceId(priceId: string): ProductCatalogPlan | null {
  return (
    productCatalog.find((plan) => configuredStripePriceId(plan) === priceId) ?? null
  );
}

export function findPlanByAppleProductId(productId: string): ProductCatalogPlan | null {
  return (
    productCatalog.find((plan) => configuredAppleProductId(plan) === productId) ?? null
  );
}

export function isAppKey(value: string): value is AppKey {
  return (APP_KEYS as readonly string[]).includes(value);
}

