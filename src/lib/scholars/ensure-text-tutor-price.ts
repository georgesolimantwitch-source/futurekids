import type Stripe from "stripe";
import {
  scholarsTextTutorLookupKey,
  scholarsTextTutorPrice,
  type ScholarsTextTutorPeriod,
} from "@/config/scholars-text-tutor";

const PRODUCT_META = "scholars_text_tutor_unlimited";

async function ensureProduct(stripe: Stripe): Promise<string> {
  const existing = await stripe.products.search({
    query: `metadata['catalog_key']:'${PRODUCT_META}'`,
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0].id;

  const created = await stripe.products.create({
    name: "Scholars Unlimited Text Tutor",
    description:
      "Type with the AI tutor unlimited. Voice minutes and generations are separate.",
    metadata: {
      app: "scholars",
      catalog_key: PRODUCT_META,
      kind: "text_tutor_unlimited",
    },
  });
  return created.id;
}

export async function ensureScholarsTextTutorStripePrice(params: {
  stripe: Stripe;
  period: ScholarsTextTutorPeriod;
}): Promise<string> {
  const { stripe, period } = params;
  const lookupKey = scholarsTextTutorLookupKey(period);
  const expectedCents = Math.round(scholarsTextTutorPrice(period) * 100);

  const listed = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
    expand: ["data.product"],
  });
  const found = listed.data[0];
  if (found?.active && found.unit_amount === expectedCents) {
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
      : await ensureProduct(stripe);

  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: expectedCents,
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    recurring: { interval: period === "monthly" ? "month" : "year" },
    metadata: {
      app: "scholars",
      kind: "text_tutor_unlimited",
      period,
      plan_key: `scholars_text_tutor_${period}`,
      unlimited_text_tutor: "true",
    },
    nickname: `Unlimited Text Tutor · ${period}`,
  });

  return price.id;
}
