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
  throw new Error("Need live Stripe key");
}
const stripe = new Stripe(secret);

function planKeyFromCatalogId(catalogId: string): string {
  const tinypal = /^tinypal\.kids([1-6])\.(monthly|yearly)$/.exec(catalogId);
  if (tinypal) return `tinypal_kids${tinypal[1]}_${tinypal[2]}`;
  const bundle2 =
    /^ecosystem\.all\.earnly([1-6])\.tinypal([1-6])\.(monthly|yearly)$/.exec(
      catalogId,
    );
  if (bundle2) {
    return `futurekids_all_access_earnly${bundle2[1]}_tinypal${bundle2[2]}_${bundle2[3]}`;
  }
  throw new Error("No plan key for " + catalogId);
}

const PRODUCT_BY_APP: Record<string, string> = {
  tinypal: "prod_UsFKwiiqzG3lsy",
  ecosystem: "prod_UsFMZVziq3wNAv",
};

async function findPrice(
  productId: string,
  unitAmountCents: number,
  interval: string,
  lookupKey: string,
) {
  const byLookup = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  if (byLookup.data[0]) return byLookup.data[0];
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });
  return (
    prices.data.find(
      (p) =>
        p.unit_amount === unitAmountCents &&
        p.recurring?.interval === interval &&
        p.currency === "usd",
    ) ?? null
  );
}

async function main() {
  const results: Record<string, { priceId: string; productId: string }> = {};
  const tinypalAll = stripeCatalogPlans.filter((p) => p.app === "tinypal");
  const ecosystemExtra = stripeCatalogPlans.filter(
    (p) => p.app === "ecosystem" && p.catalogId.includes(".tinypal"),
  );
  console.log(
    "Ensuring",
    tinypalAll.length,
    "TinyPal +",
    ecosystemExtra.length,
    "All Access TinyPal prices",
  );

  for (const plan of [...tinypalAll, ...ecosystemExtra]) {
    const planKey = planKeyFromCatalogId(plan.catalogId);
    const productId =
      plan.app === "tinypal" ? PRODUCT_BY_APP.tinypal : PRODUCT_BY_APP.ecosystem;
    const cents = Math.round(plan.unitAmount * 100);
    let price = await findPrice(productId, cents, plan.interval, plan.catalogId);
    if (!price) {
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
      console.log("+", planKey, price.id, "$" + plan.unitAmount);
    } else {
      console.log("✓", planKey, price.id, "$" + plan.unitAmount);
    }
    results[planKey] = { priceId: price.id, productId };
  }

  writeFileSync("tmp-tinypal-stripe-ids.json", JSON.stringify(results, null, 2));
  console.log("Wrote", Object.keys(results).length, "ids");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
