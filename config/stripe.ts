/**
 * Stripe price IDs — see config/stripe-prices.json (npm run setup:stripe)
 */

import type { EarnlyBillingPeriod } from "./earnly-pricing";
import type { AppSlug } from "./brand";
import {
  scholarsTierCatalogId,
  type ScholarsTierId,
} from "./scholars-pricing";
import { bundleCatalogId } from "./ecosystem-bundle";
import type { BillingPeriod } from "./pricing";
import generated from "./stripe-prices.json";

export type StripeCatalogApp = "earnly" | "scholars" | "ballr" | "tinypal" | "ecosystem";

export interface StripePriceRecord {
  app: StripeCatalogApp;
  catalogId: string;
  name: string;
  amount: number;
  interval: "month" | "year";
  perChildQuantity?: boolean;
  stripeProductId: string;
  stripePriceId: string;
}

export const stripePriceCatalog = generated.plans as StripePriceRecord[];
export const stripePricesGeneratedAt = generated.generatedAt;

export function getStripePriceByCatalogId(
  catalogId: string,
): StripePriceRecord | undefined {
  return stripePriceCatalog.find((p) => p.catalogId === catalogId);
}

export function getEarnlyStripePriceId(
  period: EarnlyBillingPeriod,
): string | undefined {
  const catalogId = period === "monthly" ? "earnly.live.monthly" : "earnly.live.yearly";
  return getStripePriceByCatalogId(catalogId)?.stripePriceId;
}

export function getBallrStripePriceId(period: BillingPeriod): string | undefined {
  const catalogId = period === "monthly" ? "ballr.live.monthly" : "ballr.live.yearly";
  return getStripePriceByCatalogId(catalogId)?.stripePriceId;
}

export function getTinyPalStripePriceId(period: BillingPeriod): string | undefined {
  const catalogId = period === "monthly" ? "tinypal.monthly" : "tinypal.yearly";
  return getStripePriceByCatalogId(catalogId)?.stripePriceId;
}

export function getEcosystemBundleStripePriceId(
  childCount: number,
  period: EarnlyBillingPeriod,
): string | undefined {
  return getStripePriceByCatalogId(bundleCatalogId(childCount, period))?.stripePriceId;
}

export function getStripePricesForApp(app: StripeCatalogApp): StripePriceRecord[] {
  return stripePriceCatalog.filter((p) => p.app === app);
}

export function getScholarsStripePriceId(
  period: BillingPeriod,
  tier: ScholarsTierId = "full",
): string | undefined {
  return getStripePriceByCatalogId(scholarsTierCatalogId(tier, period))?.stripePriceId;
}

/** Scholars checkout price IDs */
export const scholarsStripePriceIds = {
  fullMonthly: getStripePriceByCatalogId("com.scholarsnotes.full.monthly")?.stripePriceId,
  fullYearly: getStripePriceByCatalogId("com.scholarsnotes.full.yearly")?.stripePriceId,
  tutorMonthly: getStripePriceByCatalogId("com.scholarsnotes.tutor.monthly")?.stripePriceId,
  tutorYearly: getStripePriceByCatalogId("com.scholarsnotes.tutor.yearly")?.stripePriceId,
  studyGuideMonthly: getStripePriceByCatalogId("com.scholarsnotes.studyguide.monthly")
    ?.stripePriceId,
  studyGuideYearly: getStripePriceByCatalogId("com.scholarsnotes.studyguide.yearly")
    ?.stripePriceId,
} as const;

export interface IndividualAppCheckoutParams {
  priceId?: string;
  quantity: number;
  app: AppSlug;
  childCount?: number;
}

export function getIndividualAppCheckout(
  app: AppSlug,
  period: EarnlyBillingPeriod,
  childCount = 1,
  scholarsTier: ScholarsTierId = "full",
): IndividualAppCheckoutParams {
  switch (app) {
    case "earnly":
      return {
        priceId: getEarnlyStripePriceId(period),
        quantity: childCount,
        app,
        childCount,
      };
    case "scholars":
      return {
        priceId: getScholarsStripePriceId(period, scholarsTier),
        quantity: 1,
        app,
      };
    case "ballr":
      return { priceId: getBallrStripePriceId(period), quantity: 1, app };
    case "tinypal":
      return { priceId: getTinyPalStripePriceId(period), quantity: 1, app };
    default:
      return { quantity: 1, app };
  }
}
