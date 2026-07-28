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

export type StripeCatalogApp =
  | "earnly"
  | "scholars"
  | "ballr"
  | "tinypal"
  | "fresher"
  | "ecosystem";

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

export function getBallrStripePriceId(
  period: BillingPeriod,
  childCount = 1,
): string | undefined {
  const count = Math.min(6, Math.max(1, childCount));
  const catalogId =
    count === 1
      ? period === "monthly"
        ? "ballr.live.monthly"
        : "ballr.live.yearly"
      : period === "monthly"
        ? `ballr.kids${count}.monthly`
        : `ballr.kids${count}.yearly`;
  return getStripePriceByCatalogId(catalogId)?.stripePriceId;
}

export function getTinyPalStripePriceId(
  period: BillingPeriod,
  childCount = 1,
): string | undefined {
  const count = Math.min(6, Math.max(1, childCount));
  const catalogId =
    period === "monthly"
      ? `tinypal.kids${count}.monthly`
      : `tinypal.kids${count}.yearly`;
  return getStripePriceByCatalogId(catalogId)?.stripePriceId;
}

export function getFresherStripePriceId(period: BillingPeriod): string | undefined {
  const catalogId = period === "monthly" ? "fresher.monthly" : "fresher.yearly";
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
  catalogId?: string;
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
        catalogId: period === "monthly" ? "earnly.live.monthly" : "earnly.live.yearly",
        priceId: getEarnlyStripePriceId(period),
        quantity: childCount,
        app,
        childCount,
      };
    case "scholars":
      return {
        catalogId:
          scholarsTier === "full" && childCount > 1
            ? period === "monthly"
              ? `scholars.full.kids${childCount}.monthly`
              : `scholars.full.kids${childCount}.yearly`
            : scholarsTierCatalogId(scholarsTier, period),
        priceId: getScholarsStripePriceId(period, scholarsTier),
        quantity: scholarsTier === "full" ? 1 : childCount,
        app,
        childCount,
      };
    case "ballr":
      return {
        catalogId:
          childCount === 1
            ? period === "monthly"
              ? "ballr.live.monthly"
              : "ballr.live.yearly"
            : period === "monthly"
              ? `ballr.kids${childCount}.monthly`
              : `ballr.kids${childCount}.yearly`,
        priceId: getBallrStripePriceId(period, childCount),
        quantity: 1,
        app,
        childCount,
      };
    case "tinypal":
      return {
        catalogId:
          period === "monthly"
            ? `tinypal.kids${childCount}.monthly`
            : `tinypal.kids${childCount}.yearly`,
        priceId: getTinyPalStripePriceId(period, childCount),
        quantity: 1,
        app,
        childCount,
      };
    case "fresher":
      return {
        catalogId: period === "monthly" ? "fresher.monthly" : "fresher.yearly",
        priceId: getFresherStripePriceId(period),
        quantity: 1,
        app,
      };
    default:
      return { quantity: 1, app };
  }
}
