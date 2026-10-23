/**
 * Create Genlyn Hub one-time Stripe prices (10.1" and 15.6").
 * Run: npx tsx scripts/create-hub-prices.ts
 *
 * Prints env lines for STRIPE_HUB_10_PRICE_ID / STRIPE_HUB_15_PRICE_ID.
 * Works with test or live keys.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";
import { hubSizes } from "../config/hub";

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

const stripe = new Stripe(secretKey);
const PRODUCT_META = "genlyn_hub_hardware";

async function ensureProduct(): Promise<string> {
  const existing = await stripe.products.search({
    query: `metadata['catalog_key']:'${PRODUCT_META}'`,
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0].id;

  const created = await stripe.products.create({
    name: "Genlyn Hub",
    description: "Family wall tablet — Genlyn Hub hardware (one-time purchase).",
    metadata: {
      catalog_key: PRODUCT_META,
      kind: "genlyn_hub",
    },
  });
  return created.id;
}

async function ensurePrice(
  productId: string,
  size: (typeof hubSizes)[number],
): Promise<string> {
  const byLookup = await stripe.prices.list({
    lookup_keys: [size.lookupKey],
    limit: 1,
  });
  const existing = byLookup.data[0];
  if (existing && existing.unit_amount === size.priceCents) {
    return existing.id;
  }

  // Create (or replace lookup key) so catalog matches config/hub.ts amounts.
  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: size.priceCents,
    lookup_key: size.lookupKey,
    transfer_lookup_key: true,
    metadata: {
      kind: "genlyn_hub",
      size: size.id,
    },
  });
  return price.id;
}

async function main() {
  const productId = await ensureProduct();
  console.log(`Product: ${productId}`);

  for (const size of hubSizes) {
    const priceId = await ensurePrice(productId, size);
    console.log(`${size.envPriceId}=${priceId}  # ${size.label} ${size.priceDisplay}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
