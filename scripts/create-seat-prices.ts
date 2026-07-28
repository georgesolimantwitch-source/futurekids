/**
 * Create or replace live Stripe prices for Ballr/Scholars child tiers and
 * All Access multi-seat combinations when amounts change.
 * Writes config/stripe-price-ids.generated.json for the product catalog.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Stripe from "stripe";
import { stripeCatalogPlans } from "../config/stripe-catalog";

function loadEnvFile(filename: string) {
  const path = join(process.cwd(), filename);
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

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret?.startsWith("sk_live_")) {
  throw new Error("Need live Stripe key (sk_live_*)");
}
const stripe = new Stripe(secret);

const PRODUCT_BY_APP: Record<string, string> = {
  ballr: "prod_UsFKFCUxLmVonC",
  scholars: "prod_UsFHSnfK7VtUHn",
  ecosystem: "prod_UsFMZVziq3wNAv",
};

const OUT_PATH = join(process.cwd(), "config/stripe-price-ids.generated.json");

function planKeyFromCatalogId(catalogId: string): string | null {
  const ballrKids = /^ballr\.kids([2-6])\.(monthly|yearly)$/.exec(catalogId);
  if (ballrKids) return `ballr_kids${ballrKids[1]}_${ballrKids[2]}`;

  const scholarsKids =
    /^scholars\.full\.kids([2-6])\.(monthly|yearly)$/.exec(catalogId);
  if (scholarsKids) {
    return `scholars_all_access_kids${scholarsKids[1]}_${scholarsKids[2]}`;
  }

  const bundleSeats =
    /^ecosystem\.all\.e([1-6])\.s([1-6])\.b([1-6])\.t([1-6])\.(monthly|yearly)$/.exec(
      catalogId,
    );
  if (bundleSeats) {
    return `futurekids_all_access_e${bundleSeats[1]}_s${bundleSeats[2]}_b${bundleSeats[3]}_t${bundleSeats[4]}_${bundleSeats[5]}`;
  }

  return null;
}

/** Scholars multi-seat or All Access with scholars seats > 1 need amount refresh. */
function needsScholarsAmountRefresh(catalogId: string): boolean {
  if (/^scholars\.full\.kids[2-6]\./.test(catalogId)) return true;
  const bundle =
    /^ecosystem\.all\.e[1-6]\.s([2-6])\.b[1-6]\.t[1-6]\./.exec(catalogId);
  return Boolean(bundle);
}

async function findPrice(lookupKey: string) {
  try {
    const byLookup = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });
    if (byLookup.data[0]) return byLookup.data[0];
  } catch {
    // lookup may not exist
  }
  return null;
}

async function ensurePrice(
  productId: string,
  plan: (typeof stripeCatalogPlans)[number],
  planKey: string,
) {
  const cents = Math.round(plan.unitAmount * 100);
  let price = await findPrice(plan.catalogId);

  if (price && price.unit_amount !== cents) {
    await stripe.prices.update(price.id, { active: false });
    price = null;
  }

  if (!price) {
    try {
      price = await stripe.prices.create({
        product: productId,
        currency: "usd",
        unit_amount: cents,
        recurring: { interval: plan.interval },
        lookup_key: plan.catalogId,
        transfer_lookup_key: true,
        metadata: {
          app: plan.app === "ecosystem" ? "futurekids_all_access" : plan.app,
          catalog_id: plan.catalogId,
          plan_key: planKey,
          ...plan.metadata,
        },
      });
      return { price, created: true };
    } catch (error) {
      price = await findPrice(plan.catalogId);
      if (!price) throw error;
      if (price.unit_amount !== cents) {
        throw new Error(
          `Lookup ${plan.catalogId} still has wrong amount ${price.unit_amount} vs ${cents}`,
        );
      }
    }
  }
  return { price, created: false };
}

async function main() {
  const existing = existsSync(OUT_PATH)
    ? (JSON.parse(readFileSync(OUT_PATH, "utf8")) as Record<
        string,
        { priceId: string; productId: string }
      >)
    : {};

  const targets = stripeCatalogPlans.filter((plan) => {
    const key = planKeyFromCatalogId(plan.catalogId);
    if (!key) return false;
    if (!existing[key]?.priceId) return true;
    return needsScholarsAmountRefresh(plan.catalogId);
  });

  console.log(`Ensuring ${targets.length} seat prices (create or refresh)…`);
  let created = 0;
  let reused = 0;
  const CONCURRENCY = 6;

  for (let offset = 0; offset < targets.length; offset += CONCURRENCY) {
    const batch = targets.slice(offset, offset + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (plan) => {
        const planKey = planKeyFromCatalogId(plan.catalogId)!;
        const productId = PRODUCT_BY_APP[plan.app];
        if (!productId) throw new Error(`No product for ${plan.app}`);
        const { price, created: wasCreated } = await ensurePrice(
          productId,
          plan,
          planKey,
        );
        return { planKey, productId, price, wasCreated, unitAmount: plan.unitAmount };
      }),
    );

    for (const result of results) {
      existing[result.planKey] = {
        priceId: result.price.id,
        productId: result.productId,
      };
      if (result.wasCreated) {
        created += 1;
        console.log(`+ ${result.planKey} ${result.price.id} $${result.unitAmount}`);
      } else {
        reused += 1;
      }
    }

    writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2));
    console.log(
      `… ${Math.min(offset + CONCURRENCY, targets.length)}/${targets.length} (mapped ${Object.keys(existing).length})`,
    );
  }

  writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2));
  console.log(
    `Done. created=${created} reused=${reused} total_mapped=${Object.keys(existing).length}`,
  );
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
