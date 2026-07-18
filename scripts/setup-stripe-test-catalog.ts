import fs from "node:fs";
import Stripe from "stripe";
import { productCatalog } from "../src/lib/subscriptions/product-catalog";

function localSecret(): string {
  const contents = fs.readFileSync(".env.local", "utf8");
  const value = /^STRIPE_SECRET_KEY\s*=\s*(.+)$/m.exec(contents)?.[1]?.trim();
  if (!value?.startsWith("sk_test_")) {
    throw new Error(".env.local must contain a Stripe sk_test_ secret");
  }
  return value;
}

async function main() {
  const stripe = new Stripe(localSecret());
  const existingProducts = await stripe.products.list({ limit: 100 });
  const output: string[] = [];
  const productsByLiveGroup = new Map<string, Stripe.Product>();

  for (const plan of productCatalog) {
    let product = productsByLiveGroup.get(plan.stripeProductId);
    if (!product) {
      product =
        existingProducts.data.find(
          (candidate) =>
            candidate.metadata.future_kids_test_product_group ===
            plan.stripeProductId,
        ) ??
        (await stripe.products.create({
          name: `[TEST] ${plan.displayName.replace(/ (Monthly|Yearly)$/i, "")}`,
          active: true,
          metadata: {
            future_kids_test_product_group: plan.stripeProductId,
            app_key: plan.appKey,
            sandbox: "true",
          },
        }));
      productsByLiveGroup.set(plan.stripeProductId, product);
    }

    const lookupKey = `future_kids_test_v2_${plan.planKey}`;
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });
    const price =
      prices.data[0] ??
      (await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: plan.expectedAmountCents,
        recurring: { interval: plan.interval },
        lookup_key: lookupKey,
        metadata: {
          future_kids_test_plan_key: plan.planKey,
          app_key: plan.appKey,
          sandbox: "true",
        },
      }));

    const prefix = plan.planKey.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
    output.push(`STRIPE_${prefix}_PRICE_ID=${price.id}`);
    output.push(`STRIPE_${prefix}_PRODUCT_ID=${product.id}`);
  }

  for (const product of existingProducts.data) {
    if (
      product.active &&
      product.metadata.sandbox === "true" &&
      product.metadata.future_kids_test_plan_key &&
      !product.metadata.future_kids_test_product_group
    ) {
      await stripe.products.update(product.id, { active: false });
    }
  }

  console.log(output.join("\n"));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
