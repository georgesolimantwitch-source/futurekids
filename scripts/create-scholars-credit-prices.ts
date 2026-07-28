/**
 * Create Scholars combined AI credit prices in Stripe Live.
 * Lookup keys: com.scholarsnotes.plan.g{G}.m{M}.{refill|monthly|yearly}
 * Run: npx tsx scripts/create-scholars-credit-prices.ts
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";
import { allScholarsCreditSkus } from "../config/scholars-credits";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvFile(filename: string) {
  const path = join(root, filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile("env.local");

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY");
  process.exit(1);
}
if (!secretKey.startsWith("sk_live_")) {
  console.error("Refusing to run: STRIPE_SECRET_KEY is not a live key");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

const PRODUCT_META = "scholars_credits_combined";

async function ensureProduct(): Promise<string> {
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

async function ensurePrice(
  productId: string,
  sku: ReturnType<typeof allScholarsCreditSkus>[number],
): Promise<{ stripePriceId: string; stripeProductId: string }> {
  const byLookup = await stripe.prices.list({
    lookup_keys: [sku.lookupKey],
    limit: 1,
    expand: ["data.product"],
  });
  const found = byLookup.data[0];
  if (found) {
    return {
      stripePriceId: found.id,
      stripeProductId:
        typeof found.product === "string" ? found.product : found.product.id,
    };
  }

  const unitAmount = Math.round(sku.unitAmount * 100);
  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: unitAmount,
    lookup_key: sku.lookupKey,
    transfer_lookup_key: true,
    ...(sku.interval ? { recurring: { interval: sku.interval } } : {}),
    metadata: {
      app: "scholars",
      kind: "combined_credits",
      generations: String(sku.generations),
      tutor_minutes: String(sku.tutorMinutes),
      period: sku.period,
      grant_generations: String(sku.grantGenerations),
      grant_tutor_minutes: String(sku.grantTutorMinutes),
    },
    nickname: `${sku.name} · ${sku.period}`,
  });

  return { stripePriceId: price.id, stripeProductId: productId };
}

async function main() {
  const productId = await ensureProduct();
  console.log("Product", productId);

  const skus = allScholarsCreditSkus();
  console.log(`Creating/ensuring ${skus.length} prices…`);

  const records: Array<{
    lookupKey: string;
    generations: number;
    tutorMinutes: number;
    period: string;
    amount: number;
    stripePriceId: string;
    stripeProductId: string;
  }> = [];

  let i = 0;
  for (const sku of skus) {
    i += 1;
    const ensured = await ensurePrice(productId, sku);
    records.push({
      lookupKey: sku.lookupKey,
      generations: sku.generations,
      tutorMinutes: sku.tutorMinutes,
      period: sku.period,
      amount: sku.unitAmount,
      ...ensured,
    });
    if (i % 30 === 0 || i === skus.length) {
      console.log(`… ${i}/${skus.length}`);
    }
  }

  const outPath = join(root, "config/scholars-credit-prices.json");
  writeFileSync(
    outPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), mode: "live", plans: records },
      null,
      2,
    ),
  );
  console.log(`Wrote ${records.length} prices → ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
