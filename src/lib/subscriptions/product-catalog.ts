import { stripeCatalogPlans, type StripeCatalogPlan } from "@/config/stripe-catalog";
import generatedStripeIds from "@/config/stripe-price-ids.generated.json";

export const APP_KEYS = [
  "earnly",
  "scholars",
  "ballr",
  "tinypal",
  "fresher",
  "futurekids_all_access",
] as const;

export type AppKey = (typeof APP_KEYS)[number];
export type BillingInterval = "month" | "year";

export interface ProductCatalogPlan {
  appKey: AppKey;
  planKey: string;
  providers: readonly ["stripe", "apple", "google"];
  stripePriceEnv: string;
  stripeProductEnv: string;
  stripePriceId: string;
  stripeProductId: string;
  appleProductEnv: string;
  googleProductId: string | null;
  googleBasePlanId: string | null;
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

/** Primary Google Play subscription SKUs for Earnly Live. */
export const GOOGLE_EARNLY_MONTHLY_PRODUCT_ID = "earnly.premium.monthly";
export const GOOGLE_EARNLY_YEARLY_PRODUCT_ID = "earnly.premium.yearly";

function googleIdsForEarnlyPlan(
  planKey: string,
  interval: BillingInterval,
  childCount: number | null,
): { googleProductId: string | null; googleBasePlanId: string | null } {
  if (!planKey.startsWith("earnly_kids") || !childCount) {
    return { googleProductId: null, googleBasePlanId: null };
  }
  return {
    googleProductId:
      interval === "year"
        ? GOOGLE_EARNLY_YEARLY_PRODUCT_ID
        : GOOGLE_EARNLY_MONTHLY_PRODUCT_ID,
    googleBasePlanId: `kids${childCount}`,
  };
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
  "tinypal.monthly": "tinypal_kids1_monthly",
  "tinypal.yearly": "tinypal_kids1_yearly",
  "fresher.monthly": "fresher_monthly",
  "fresher.yearly": "fresher_yearly",
};

const EXISTING_STRIPE_IDS: Record<
  string,
  { priceId: string; productId: string }
> = {
  earnly_kids1_monthly: {
    priceId: "price_1TuiCJLD305HTgIxk0Ni7gVH",
    productId: "prod_UsFBozbxDdl1v6",
  },
  earnly_kids1_yearly: {
    priceId: "price_1TuiCKLD305HTgIxliIyLjp5",
    productId: "prod_UsFBeXiPCZRY1V",
  },
  earnly_kids2_monthly: {
    priceId: "price_1TuiCKLD305HTgIx3KSXxoE4",
    productId: "prod_UsFBBQJLwT8SuJ",
  },
  earnly_kids2_yearly: {
    priceId: "price_1TuiCKLD305HTgIxynB8yYye",
    productId: "prod_UsFB85TLFClSjz",
  },
  earnly_kids3_monthly: {
    priceId: "price_1TuiCLLD305HTgIxeY98ZIpJ",
    productId: "prod_UsFBX0LUDwHwgz",
  },
  earnly_kids3_yearly: {
    priceId: "price_1TuiCLLD305HTgIxVueggjkJ",
    productId: "prod_UsFBOlcFx3ZeDl",
  },
  earnly_kids4_monthly: {
    priceId: "price_1TuiCMLD305HTgIxQU2nx58e",
    productId: "prod_UsFBPFrZD8YuWO",
  },
  earnly_kids4_yearly: {
    priceId: "price_1TuiCMLD305HTgIxfq4e763q",
    productId: "prod_UsFBzAGHt2ukju",
  },
  earnly_kids5_monthly: {
    priceId: "price_1TuiCMLD305HTgIxYYLXSb1a",
    productId: "prod_UsFBUlpZqdsO3i",
  },
  earnly_kids5_yearly: {
    priceId: "price_1TuiCNLD305HTgIx2bFX44wX",
    productId: "prod_UsFBsD73LrNBeg",
  },
  earnly_kids6_monthly: {
    priceId: "price_1TuiCNLD305HTgIxcyM3YfGX",
    productId: "prod_UsFBYMY8WuXC5z",
  },
  earnly_kids6_yearly: {
    priceId: "price_1TuiCOLD305HTgIxykhrAw8Y",
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
  tinypal_kids1_monthly: {
    priceId: "price_1TsUpeLD305HTgIx2PyG9x2l",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_kids1_yearly: {
    priceId: "price_1TwsacLD305HTgIxIwAfwwQG",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_kids2_monthly: {
    priceId: "price_1TwsadLD305HTgIxdGYKHWN0",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_kids2_yearly: {
    priceId: "price_1TwsadLD305HTgIxtK10h9Ye",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_kids3_monthly: {
    priceId: "price_1TwsaeLD305HTgIx8P8peBdJ",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_kids3_yearly: {
    priceId: "price_1TwsafLD305HTgIx0zEqs1Wd",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_kids4_monthly: {
    priceId: "price_1TwsafLD305HTgIxveIosWtn",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_kids4_yearly: {
    priceId: "price_1TwsagLD305HTgIxpmnxtD2B",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_kids5_monthly: {
    priceId: "price_1TwsagLD305HTgIxZwDPaEkK",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_kids5_yearly: {
    priceId: "price_1TwsahLD305HTgIx5LIvXEAy",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_kids6_monthly: {
    priceId: "price_1TwsaiLD305HTgIxdaAbk5Fo",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  tinypal_kids6_yearly: {
    priceId: "price_1TwsaiLD305HTgIx567h9s6X",
    productId: "prod_UsFKwiiqzG3lsy",
  },
  // Freshys — live Stripe catalog
  fresher_monthly: {
    priceId: "price_1TwU0yLD305HTgIxP8xnRQJn",
    productId: "prod_UwMkFFPZtOZZ3l",
  },
  fresher_yearly: {
    priceId: "price_1TwU0zLD305HTgIxsZKxR7sL",
    productId: "prod_UwMkFFPZtOZZ3l",
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
  futurekids_all_access_earnly1_tinypal2_monthly: {
    priceId: "price_1TwsajLD305HTgIxmnwN6TOI",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly1_tinypal2_yearly: {
    priceId: "price_1TwsajLD305HTgIxNgOiZF6G",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly1_tinypal3_monthly: {
    priceId: "price_1TwsakLD305HTgIxuMRKRhfY",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly1_tinypal3_yearly: {
    priceId: "price_1TwsalLD305HTgIxs1YmdV1v",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly1_tinypal4_monthly: {
    priceId: "price_1TwsalLD305HTgIxl87NsD1R",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly1_tinypal4_yearly: {
    priceId: "price_1TwsamLD305HTgIxy208fDhe",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly1_tinypal5_monthly: {
    priceId: "price_1TwsanLD305HTgIxBF4cSgn2",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly1_tinypal5_yearly: {
    priceId: "price_1TwsanLD305HTgIxCMQ1rQvR",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly1_tinypal6_monthly: {
    priceId: "price_1TwsaoLD305HTgIxOfDzuKoU",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly1_tinypal6_yearly: {
    priceId: "price_1TwsaoLD305HTgIx7CVaJ6a8",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly2_tinypal2_monthly: {
    priceId: "price_1TwsapLD305HTgIxKGct0YNh",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly2_tinypal2_yearly: {
    priceId: "price_1TwsaqLD305HTgIxGJlDQgjf",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly2_tinypal3_monthly: {
    priceId: "price_1TwsaqLD305HTgIxCE5EjtMn",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly2_tinypal3_yearly: {
    priceId: "price_1TwsarLD305HTgIxrKR8XzwK",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly2_tinypal4_monthly: {
    priceId: "price_1TwsarLD305HTgIxe3sV4bHU",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly2_tinypal4_yearly: {
    priceId: "price_1TwsasLD305HTgIxCRUIHqAO",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly2_tinypal5_monthly: {
    priceId: "price_1TwsatLD305HTgIxr3VmLod4",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly2_tinypal5_yearly: {
    priceId: "price_1TwsatLD305HTgIx5bNUNwWC",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly2_tinypal6_monthly: {
    priceId: "price_1TwsauLD305HTgIxrk01vmJB",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly2_tinypal6_yearly: {
    priceId: "price_1TwsauLD305HTgIxMfEt1TIg",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly3_tinypal2_monthly: {
    priceId: "price_1TwsavLD305HTgIxbwDos4kP",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly3_tinypal2_yearly: {
    priceId: "price_1TwsavLD305HTgIxnjoL9ZGs",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly3_tinypal3_monthly: {
    priceId: "price_1TwsawLD305HTgIxSeVSDjHp",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly3_tinypal3_yearly: {
    priceId: "price_1TwsaxLD305HTgIxqfucs0zZ",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly3_tinypal4_monthly: {
    priceId: "price_1TwsaxLD305HTgIxRb2H5BRd",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly3_tinypal4_yearly: {
    priceId: "price_1TwsayLD305HTgIxu35TatlI",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly3_tinypal5_monthly: {
    priceId: "price_1TwsayLD305HTgIxHBxWTHoS",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly3_tinypal5_yearly: {
    priceId: "price_1TwsazLD305HTgIxLV2EfUZe",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly3_tinypal6_monthly: {
    priceId: "price_1Twsb0LD305HTgIxY52JZCD6",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly3_tinypal6_yearly: {
    priceId: "price_1Twsb0LD305HTgIxovD0n6OQ",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly4_tinypal2_monthly: {
    priceId: "price_1Twsb1LD305HTgIxW8uyg1We",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly4_tinypal2_yearly: {
    priceId: "price_1Twsb1LD305HTgIxNolEP1hm",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly4_tinypal3_monthly: {
    priceId: "price_1Twsb2LD305HTgIxrGqcvy81",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly4_tinypal3_yearly: {
    priceId: "price_1Twsb3LD305HTgIxFkTTgGy5",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly4_tinypal4_monthly: {
    priceId: "price_1Twsb3LD305HTgIxkR3aY00J",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly4_tinypal4_yearly: {
    priceId: "price_1Twsb4LD305HTgIxZ3DyOYhn",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly4_tinypal5_monthly: {
    priceId: "price_1Twsb5LD305HTgIx6d94LPZB",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly4_tinypal5_yearly: {
    priceId: "price_1Twsb5LD305HTgIx7h0mNwUB",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly4_tinypal6_monthly: {
    priceId: "price_1Twsb6LD305HTgIxFOK6HpiM",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly4_tinypal6_yearly: {
    priceId: "price_1Twsb7LD305HTgIxjPDEhCkd",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly5_tinypal2_monthly: {
    priceId: "price_1Twsb7LD305HTgIxuf99cwxi",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly5_tinypal2_yearly: {
    priceId: "price_1Twsb8LD305HTgIxfx9MxNqs",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly5_tinypal3_monthly: {
    priceId: "price_1Twsb8LD305HTgIxi9vJwfdF",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly5_tinypal3_yearly: {
    priceId: "price_1Twsb9LD305HTgIx2V6SADri",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly5_tinypal4_monthly: {
    priceId: "price_1TwsbALD305HTgIxZshM8Td9",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly5_tinypal4_yearly: {
    priceId: "price_1TwsbALD305HTgIxGjmYJMl6",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly5_tinypal5_monthly: {
    priceId: "price_1TwsbBLD305HTgIxTJ7MsGvp",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly5_tinypal5_yearly: {
    priceId: "price_1TwsbBLD305HTgIxFkhlK4Ge",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly5_tinypal6_monthly: {
    priceId: "price_1TwsbCLD305HTgIxAluU46aE",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly5_tinypal6_yearly: {
    priceId: "price_1TwsbDLD305HTgIxBevQMpmo",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly6_tinypal2_monthly: {
    priceId: "price_1TwsbDLD305HTgIxABOE0BZE",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly6_tinypal2_yearly: {
    priceId: "price_1TwsbELD305HTgIxcc8j3aZn",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly6_tinypal3_monthly: {
    priceId: "price_1TwsbFLD305HTgIxohN3NMPk",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly6_tinypal3_yearly: {
    priceId: "price_1TwsbFLD305HTgIxZo3f0gbx",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly6_tinypal4_monthly: {
    priceId: "price_1TwsbGLD305HTgIxnXpqU68O",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly6_tinypal4_yearly: {
    priceId: "price_1TwsbGLD305HTgIxThtm1yKb",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly6_tinypal5_monthly: {
    priceId: "price_1TwsbHLD305HTgIxaS281Zjz",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly6_tinypal5_yearly: {
    priceId: "price_1TwsbILD305HTgIxMzLqnUxv",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly6_tinypal6_monthly: {
    priceId: "price_1TwsbILD305HTgIxtjI0kAae",
    productId: "prod_UsFMZVziq3wNAv",
  },
  futurekids_all_access_earnly6_tinypal6_yearly: {
    priceId: "price_1TwsbJLD305HTgIxNMIXRJKN",
    productId: "prod_UsFMZVziq3wNAv",
  },
};

const ALL_STRIPE_IDS: Record<string, { priceId: string; productId: string }> = {
  ...EXISTING_STRIPE_IDS,
  ...(generatedStripeIds as Record<string, { priceId: string; productId: string }>),
};

function planKeyForLegacyCatalogId(catalogId: string): string {
  const direct = LEGACY_PLAN_KEYS[catalogId];
  if (direct) return direct;

  const earnly = /^earnly\.kids([1-6])\.(monthly|yearly)$/.exec(catalogId);
  if (earnly) {
    return `earnly_kids${earnly[1]}_${earnly[2]}`;
  }

  const tinypal = /^tinypal\.kids([1-6])\.(monthly|yearly)$/.exec(catalogId);
  if (tinypal) {
    return `tinypal_kids${tinypal[1]}_${tinypal[2]}`;
  }

  const ballrKids = /^ballr\.kids([2-6])\.(monthly|yearly)$/.exec(catalogId);
  if (ballrKids) {
    return `ballr_kids${ballrKids[1]}_${ballrKids[2]}`;
  }

  const scholarsKids =
    /^scholars\.full\.kids([2-6])\.(monthly|yearly)$/.exec(catalogId);
  if (scholarsKids) {
    return `scholars_all_access_kids${scholarsKids[1]}_${scholarsKids[2]}`;
  }

  const bundle = /^ecosystem\.all\.kids([1-6])\.(monthly|yearly)$/.exec(catalogId);
  if (bundle) {
    return `futurekids_all_access_kids${bundle[1]}_${bundle[2]}`;
  }

  const bundleTiny =
    /^ecosystem\.all\.earnly([1-6])\.tinypal([1-6])\.(monthly|yearly)$/.exec(
      catalogId,
    );
  if (bundleTiny) {
    return `futurekids_all_access_earnly${bundleTiny[1]}_tinypal${bundleTiny[2]}_${bundleTiny[3]}`;
  }

  const bundleSeats =
    /^ecosystem\.all\.e([1-6])\.s([1-6])\.b([1-6])\.t([1-6])\.(monthly|yearly)$/.exec(
      catalogId,
    );
  if (bundleSeats) {
    return `futurekids_all_access_e${bundleSeats[1]}_s${bundleSeats[2]}_b${bundleSeats[3]}_t${bundleSeats[4]}_${bundleSeats[5]}`;
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

function tinypalChildCountFromPlan(plan: StripeCatalogPlan): number | null {
  const value = Number(plan.metadata?.tinypal_child_count);
  return Number.isInteger(value) ? value : null;
}

function scholarsChildCountFromPlan(plan: StripeCatalogPlan): number | null {
  const value = Number(plan.metadata?.scholars_child_count);
  return Number.isInteger(value) ? value : null;
}

function ballrChildCountFromPlan(plan: StripeCatalogPlan): number | null {
  const value = Number(plan.metadata?.ballr_child_count);
  return Number.isInteger(value) ? value : null;
}

function capabilities(
  appKey: AppKey,
  planKey: string,
  childCount: number | null,
  tinypalChildCount: number | null = null,
  scholarsChildCount: number | null = null,
  ballrChildCount: number | null = null,
): Pick<
  ProductCatalogPlan,
  "tierKey" | "entitlementRank" | "childLimit" | "limits" | "features"
> {
  if (appKey === "futurekids_all_access") {
    const tiny = tinypalChildCount ?? 1;
    const scholars = scholarsChildCount ?? 1;
    const ballr = ballrChildCount ?? 1;
    return {
      tierKey: "all_access",
      entitlementRank: 1000,
      childLimit: childCount,
      limits: {
        ...(childCount ? { childLimit: childCount } : {}),
        tinypalChildLimit: tiny,
        scholarsChildLimit: scholars,
        ballrChildLimit: ballr,
      },
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
  if (appKey === "tinypal") {
    return {
      tierKey: "family",
      entitlementRank: 300,
      childLimit: childCount,
      limits: childCount ? { childLimit: childCount, tinypalChildLimit: childCount } : {},
      features: { premium: true, messaging: true },
    };
  }
  if (appKey === "ballr") {
    return {
      tierKey: "premium",
      entitlementRank: 300,
      childLimit: childCount,
      limits: childCount ? { childLimit: childCount, ballrChildLimit: childCount } : {},
      features: { premium: true },
    };
  }
  if (appKey === "scholars") {
    if (planKey.includes("_all_access")) {
      return {
        tierKey: "all_access",
        entitlementRank: 300,
        childLimit: childCount,
        limits: childCount
          ? { childLimit: childCount, scholarsChildLimit: childCount }
          : {},
        features: {
          aiTutor: true,
          studyGuides: true,
          handwriting: true,
          studyPodcasts: true,
        },
      };
    }
    if (planKey.includes("_tutor")) {
      return {
        tierKey: "tutor",
        entitlementRank: 200,
        childLimit: childCount,
        limits: childCount
          ? { childLimit: childCount, scholarsChildLimit: childCount }
          : {},
        features: { aiTutor: true },
      };
    }
    return {
      tierKey: "study_guide",
      entitlementRank: 200,
      childLimit: childCount,
      limits: childCount
        ? { childLimit: childCount, scholarsChildLimit: childCount }
        : {},
      features: { studyGuides: true },
    };
  }
  return {
    tierKey: appKey === "fresher" ? "premium" : "family",
    entitlementRank: 300,
    childLimit: null,
    limits: {},
    features:
      appKey === "fresher"
        ? { localFoodMap: true, premium: true }
        : { premium: true },
  };
}

export const productCatalog: readonly ProductCatalogPlan[] = stripeCatalogPlans.map((plan) => {
  const planKey = planKeyForLegacyCatalogId(plan.catalogId);
  const prefix = envPrefix(planKey);
  const stripe = ALL_STRIPE_IDS[planKey];
  if (!stripe) throw new Error(`Missing existing Stripe mapping for ${planKey}`);
  const appKey = appKeyForPlan(plan);
  const childCount = fixedChildCount(plan);
  const tinypalChildCount = tinypalChildCountFromPlan(plan);
  const scholarsChildCount = scholarsChildCountFromPlan(plan);
  const ballrChildCount = ballrChildCountFromPlan(plan);

  return {
    appKey,
    planKey,
    providers: ["stripe", "apple", "google"] as const,
    stripePriceEnv: `STRIPE_${prefix}_PRICE_ID`,
    stripeProductEnv: `STRIPE_${prefix}_PRODUCT_ID`,
    stripePriceId: stripe.priceId,
    stripeProductId: stripe.productId,
    appleProductEnv: `APPLE_${prefix}_PRODUCT_ID`,
    ...googleIdsForEarnlyPlan(planKey, plan.interval, childCount),
    interval: plan.interval,
    displayName: plan.name,
    expectedAmountCents: Math.round(plan.unitAmount * 100),
    perChildQuantity: Boolean(plan.perChildQuantity),
    fixedChildCount: childCount,
    ...capabilities(
      appKey,
      planKey,
      childCount,
      tinypalChildCount,
      scholarsChildCount,
      ballrChildCount,
    ),
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

/**
 * Map Google Play product + base plan → catalog plan.
 * Primary: earnly.premium.monthly|yearly + kids1…kids6
 * Legacy restore: earnly.kidsN.monthly|yearly (product id alone)
 */
export function findPlanByGoogleProductAndBasePlan(
  productId: string,
  basePlanId: string,
): ProductCatalogPlan | null {
  const normalizedProduct = productId.trim();
  const normalizedBase = basePlanId.trim().toLowerCase();

  const byIds = productCatalog.find(
    (plan) =>
      plan.googleProductId === normalizedProduct &&
      plan.googleBasePlanId === normalizedBase,
  );
  if (byIds) return byIds;

  const legacy = getProductPlanByCatalogId(normalizedProduct);
  if (legacy) return legacy;

  const legacyKids = /^earnly\.kids([1-6])\.(monthly|yearly)$/.exec(normalizedProduct);
  if (legacyKids) {
    return getProductPlan(`earnly_kids${legacyKids[1]}_${legacyKids[2]}`);
  }

  return null;
}

export function isAppKey(value: string): value is AppKey {
  return (APP_KEYS as readonly string[]).includes(value);
}

