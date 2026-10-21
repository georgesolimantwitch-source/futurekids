import type Stripe from "stripe";
import {
  combinedCreditPrice,
  findCatalogPlan,
  type ScholarsCreditPeriod,
} from "@/config/scholars-credits";

const PRODUCT_META = "scholars_credits_combined";

async function ensureCreditProduct(stripe: Stripe): Promise<string> {
  const existing = await stripe.products.search({
    query: `metadata['catalog_key']:'${PRODUCT_META}'`,
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0].id;

  const created = await stripe.products.create({
    name: "Scholars AI Credits",
    description:
      "Combined AI generations and tutor minutes for Scholars Notes.",
    metadata: {
      app: "scholars",
      catalog_key: PRODUCT_META,
      kind: "combined_credits",
    },
  });
  return created.id;
}

/**
 * Resolve a Stripe price for a Scholars credit SKU. If the live lookup key
 * still points at an old amount, archive it and recreate at the catalog price
 * so Genlyn charges match App Store / scholars-web.
 */
export async function ensureScholarsCreditStripePrice(params: {
  stripe: Stripe;
  generations: number;
  tutorMinutes: number;
  period: ScholarsCreditPeriod;
  lookupKey: string;
}): Promise<string> {
  const { stripe, generations, tutorMinutes, period, lookupKey } = params;
  const expectedCents = Math.round(
    (findCatalogPlan(generations, tutorMinutes, period)?.price ??
      combinedCreditPrice(generations, tutorMinutes, period)) *
      100,
  );

  const listed = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
    expand: ["data.product"],
  });
  const found = listed.data[0];
  if (found && found.active && found.unit_amount === expectedCents) {
    return found.id;
  }

  if (found?.active) {
    await stripe.prices.update(found.id, { active: false });
  }

  const productId =
    found && found.product
      ? typeof found.product === "string"
        ? found.product
        : found.product.id
      : await ensureCreditProduct(stripe);

  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: expectedCents,
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    ...(period === "refill"
      ? {}
      : {
          recurring: {
            interval: period === "monthly" ? "month" : "year",
          },
        }),
    metadata: {
      app: "scholars",
      kind: "combined_credits",
      generations: String(generations),
      tutor_minutes: String(tutorMinutes),
      period,
      grant_generations: String(generations),
      grant_tutor_minutes: String(tutorMinutes),
    },
    nickname: `Scholars AI · g${generations}.m${tutorMinutes} · ${period}`,
  });

  return price.id;
}
