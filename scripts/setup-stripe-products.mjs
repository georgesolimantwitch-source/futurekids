#!/usr/bin/env node
/**
 * Stripe catalog setup
 * - Earnly: ONE product, per-child monthly/yearly prices (quantity = children)
 * - Scholars: separate tier products
 * Run: npm run setup:stripe
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvFile(filename) {
  const path = join(root, filename);
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
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
  console.error("Missing STRIPE_SECRET_KEY in .env.local or env.local");
  process.exit(1);
}

const earnlyPlans = [
  {
    app: "earnly",
    catalogId: "earnly.live.monthly",
    productKey: "earnly.live",
    name: "Earnly Live",
    description:
      "Family banking, chores, savings goals, and premium family features. Billed per child.",
    unitAmount: 1.99,
    interval: "month",
    perChildQuantity: true,
    metadata: { billing_period: "monthly", pricing_model: "per_child" },
  },
  {
    app: "earnly",
    catalogId: "earnly.live.yearly",
    productKey: "earnly.live",
    name: "Earnly Live",
    description: "Annual Earnly Live plan. Billed per child.",
    unitAmount: 19.9,
    interval: "year",
    perChildQuantity: true,
    metadata: { billing_period: "yearly", pricing_model: "per_child" },
  },
];

const scholarsAllAccessMonthly = 14.99;
const scholarsTutorMonthly = 9.99;
const scholarsStudyGuideMonthly = 9.99;
const scholarsYearlyFromMonthly = (monthly) => Math.round(monthly * 10 * 100) / 100;

const scholarsPlans = [
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.full.monthly",
    productKey: null,
    name: "Scholars All Access",
    description:
      "AI Tutor, AI Study Podcast, AI Study Guides, Handwriting Practice, and all premium tools.",
    unitAmount: scholarsAllAccessMonthly,
    interval: "month",
    perChildQuantity: false,
    metadata: { tier: "full", billing_period: "monthly" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.full.yearly",
    productKey: null,
    attachProductCatalogId: "com.scholarsnotes.full.monthly",
    name: "Scholars All Access",
    description: "Annual All Access — pay for 10 months, get 12.",
    unitAmount: scholarsYearlyFromMonthly(scholarsAllAccessMonthly),
    interval: "year",
    perChildQuantity: false,
    metadata: { tier: "full", billing_period: "yearly" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.tutor.monthly",
    productKey: null,
    name: "Scholar Tutor",
    description: "AI voice tutor, personalized help, and study conversations.",
    unitAmount: scholarsTutorMonthly,
    interval: "month",
    perChildQuantity: false,
    metadata: { tier: "tutor", billing_period: "monthly" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.tutor.yearly",
    productKey: null,
    attachProductCatalogId: "com.scholarsnotes.tutor.monthly",
    name: "Scholar Tutor",
    description: "Annual Scholar Tutor — pay for 10 months, get 12.",
    unitAmount: scholarsYearlyFromMonthly(scholarsTutorMonthly),
    interval: "year",
    perChildQuantity: false,
    metadata: { tier: "tutor", billing_period: "yearly" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.studyguide.monthly",
    productKey: null,
    name: "Scholars Study Guide",
    description: "Upload notes, AI study guides, and smart summaries.",
    unitAmount: scholarsStudyGuideMonthly,
    interval: "month",
    perChildQuantity: false,
    metadata: { tier: "study_guide", billing_period: "monthly" },
  },
  {
    app: "scholars",
    catalogId: "com.scholarsnotes.studyguide.yearly",
    productKey: null,
    attachProductCatalogId: "com.scholarsnotes.studyguide.monthly",
    name: "Scholars Study Guide",
    description: "Annual Study Guide — pay for 10 months, get 12.",
    unitAmount: scholarsYearlyFromMonthly(scholarsStudyGuideMonthly),
    interval: "year",
    perChildQuantity: false,
    metadata: { tier: "study_guide", billing_period: "yearly" },
  },
];

const ballrPlans = [
  {
    app: "ballr",
    catalogId: "ballr.live.monthly",
    productKey: "ballr.live",
    name: "Ballr Live",
    description:
      "Find pickup games, train, compete, and grow your sports community.",
    unitAmount: 4.99,
    interval: "month",
    perChildQuantity: false,
    metadata: { billing_period: "monthly" },
  },
  {
    app: "ballr",
    catalogId: "ballr.live.yearly",
    productKey: "ballr.live",
    name: "Ballr Live",
    description: "Annual Ballr Live plan.",
    unitAmount: 49.99,
    interval: "year",
    perChildQuantity: false,
    metadata: { billing_period: "yearly" },
  },
];

const tinypalPlans = [
  {
    app: "tinypal",
    catalogId: "tinypal.monthly",
    productKey: "tinypal",
    name: "TinyPal",
    description:
      "Safe communication designed for kids and managed by parents.",
    unitAmount: 4.99,
    interval: "month",
    perChildQuantity: false,
    metadata: { billing_period: "monthly" },
  },
  {
    app: "tinypal",
    catalogId: "tinypal.yearly",
    productKey: "tinypal",
    name: "TinyPal",
    description: "Annual TinyPal plan.",
    unitAmount: 49.99,
    interval: "year",
    perChildQuantity: false,
    metadata: { billing_period: "yearly" },
  },
];

const fresherPlans = [
  {
    app: "fresher",
    catalogId: "fresher.monthly",
    productKey: "fresher",
    name: "Freshys",
    description:
      "Find real food near your family — farms, farm stores, farmers markets, and locally produced food.",
    unitAmount: 1.5,
    interval: "month",
    perChildQuantity: false,
    metadata: { billing_period: "monthly" },
  },
  {
    app: "fresher",
    catalogId: "fresher.yearly",
    productKey: "fresher",
    name: "Freshys",
    description: "Annual Freshys plan — best value.",
    unitAmount: 9.99,
    interval: "year",
    perChildQuantity: false,
    metadata: { billing_period: "yearly", recommended: "true" },
  },
];

/** Future Kids All Access — $19.99/mo base + $0.99 per extra Earnly child */
const ecosystemMonthlyBase = 19.99;
const ecosystemYearlyBase = 199.9;
const ecosystemPerExtraMonthly = 0.99;
const ecosystemPerExtraYearly = 9.99;

const ecosystemMonthlyByChild = {};
const ecosystemYearlyByChild = {};
for (let n = 1; n <= 6; n += 1) {
  ecosystemMonthlyByChild[n] = Math.round((ecosystemMonthlyBase + (n - 1) * ecosystemPerExtraMonthly) * 100) / 100;
  ecosystemYearlyByChild[n] = Math.round((ecosystemYearlyBase + (n - 1) * ecosystemPerExtraYearly) * 100) / 100;
}

const ecosystemPlans = [];
for (let n = 1; n <= 6; n += 1) {
  ecosystemPlans.push({
    app: "ecosystem",
    catalogId: `ecosystem.all.kids${n}.monthly`,
    productKey: "ecosystem.all",
    name: "Future Kids All Access",
    description:
      "Earnly, Scholars Notes, Ballr Live, and TinyPal — complete ecosystem access.",
    unitAmount: ecosystemMonthlyByChild[n],
    interval: "month",
    perChildQuantity: false,
    metadata: { child_count: String(n), billing_period: "monthly", bundle: "all_access" },
  });
  ecosystemPlans.push({
    app: "ecosystem",
    catalogId: `ecosystem.all.kids${n}.yearly`,
    productKey: "ecosystem.all",
    name: "Future Kids All Access",
    description:
      "Annual All Access — Earnly, Scholars Notes, Ballr Live, and TinyPal.",
    unitAmount: ecosystemYearlyByChild[n],
    interval: "year",
    perChildQuantity: false,
    metadata: { child_count: String(n), billing_period: "yearly", bundle: "all_access" },
  });
}

const legacyEarnlyIds = [
  "earnly.kids1.monthly",
  "earnly.kids2.monthly",
  "earnly.kids3.monthly",
  "earnly.kids4.monthly",
  "earnly.kids5.monthly",
  "earnly.kids6.monthly",
  "earnly.kids1.yearly",
  "earnly.kids2.yearly",
  "earnly.kids3.yearly",
  "earnly.kids4.yearly",
  "earnly.kids5.yearly",
  "earnly.kids6.yearly",
];

const stripe = new Stripe(secretKey);

const productCache = new Map();

async function findProductByCatalogId(catalogId) {
  const result = await stripe.products.search({
    query: `metadata['catalog_id']:'${catalogId}'`,
    limit: 1,
  });
  return result.data[0] ?? null;
}

async function findProductByLegacyStorekitId(storekitProductId) {
  const result = await stripe.products.search({
    query: `metadata['storekit_product_id']:'${storekitProductId}'`,
    limit: 1,
  });
  return result.data[0] ?? null;
}

async function findProductByProductKey(productKey) {
  const result = await stripe.products.search({
    query: `metadata['product_key']:'${productKey}' AND active:'true'`,
    limit: 1,
  });
  return result.data[0] ?? null;
}

async function findPriceForProduct(productId, unitAmountCents, interval) {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  return (
    prices.data.find(
      (p) =>
        p.unit_amount === unitAmountCents &&
        p.recurring?.interval === interval &&
        p.currency === "usd",
    ) ?? null
  );
}

async function ensureSharedProduct(productKey, { name, description, app, pricingModel }) {
  let product = await findProductByProductKey(productKey);

  const metadata = {
    app,
    product_key: productKey,
    catalog_id: productKey,
    ...(pricingModel ? { pricing_model: pricingModel } : {}),
  };

  if (!product) {
    product = await stripe.products.create({ name, description, metadata });
    console.log(`+ ${name} product ${product.id}`);
  } else {
    product = await stripe.products.update(product.id, { name, description, metadata });
    console.log(`✓ ${name} product ${product.id}`);
  }

  productCache.set(productKey, product);
  return product;
}

async function ensureEarnlyProduct() {
  return ensureSharedProduct("earnly.live", {
    name: "Earnly Live",
    description:
      "Family banking, chores, savings goals, and premium family features. Select how many children are on your plan.",
    app: "earnly",
    pricingModel: "per_child_quantity",
  });
}

async function ensureBallrProduct() {
  return ensureSharedProduct("ballr.live", {
    name: "Ballr Live",
    description:
      "Find pickup games, train, compete, and grow your sports community.",
    app: "ballr",
  });
}

async function ensureTinyPalProduct() {
  return ensureSharedProduct("tinypal", {
    name: "TinyPal",
    description:
      "Safe communication designed for kids and managed by parents.",
    app: "tinypal",
  });
}

async function ensureFresherProduct() {
  return ensureSharedProduct("fresher", {
    name: "Freshys",
    description:
      "Find real food near your family — farms, farm stores, farmers markets, and locally produced food.",
    app: "fresher",
  });
}

async function ensureEcosystemProduct() {
  return ensureSharedProduct("ecosystem.all", {
    name: "Future Kids All Access",
    description:
      "Complete ecosystem: Earnly Live, Scholars Notes, Ballr Live, TinyPal, and Freshys. Price varies by number of children on Earnly.",
    app: "ecosystem",
    pricingModel: "bundle_by_child_count",
  });
}

const sharedProductEnsurers = {
  "earnly.live": ensureEarnlyProduct,
  "ballr.live": ensureBallrProduct,
  tinypal: ensureTinyPalProduct,
  fresher: ensureFresherProduct,
  "ecosystem.all": ensureEcosystemProduct,
};

async function ensurePlan(plan) {
  let product;

  if (plan.productKey) {
    const ensure = sharedProductEnsurers[plan.productKey];
    if (!ensure) throw new Error(`Unknown product key: ${plan.productKey}`);
    product = productCache.get(plan.productKey) ?? (await ensure());
  } else if (plan.attachProductCatalogId) {
    product = await findProductByCatalogId(plan.attachProductCatalogId);
    if (!product) {
      throw new Error(
        `Missing Scholars product for ${plan.attachProductCatalogId} — run monthly plans first`,
      );
    }
    console.log(`✓ product ${product.id} — ${plan.name} (yearly on existing tier)`);
  } else {
    product = await findProductByCatalogId(plan.catalogId);
    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          app: plan.app,
          catalog_id: plan.catalogId,
          storekit_product_id: plan.catalogId,
          ...plan.metadata,
        },
      });
      console.log(`+ product ${product.id} — ${plan.name}`);
    } else {
      product = await stripe.products.update(product.id, {
        name: plan.name,
        description: plan.description,
        metadata: {
          app: plan.app,
          catalog_id: plan.catalogId,
          storekit_product_id: plan.catalogId,
          ...plan.metadata,
        },
      });
      console.log(`✓ product ${product.id} — ${plan.name}`);
    }
  }

  const unitAmountCents = Math.round(plan.unitAmount * 100);
  let price = await findPriceForProduct(product.id, unitAmountCents, plan.interval);

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: unitAmountCents,
      recurring: { interval: plan.interval },
      lookup_key: plan.catalogId,
      transfer_lookup_key: true,
      metadata: {
        app: plan.app,
        catalog_id: plan.catalogId,
        per_child_quantity: plan.perChildQuantity ? "true" : "false",
        ...plan.metadata,
      },
    });
    console.log(
      `  + price ${price.id} — $${plan.unitAmount}/${plan.interval}${plan.perChildQuantity ? " per child" : ""}`,
    );
  } else {
    console.log(
      `  ✓ price ${price.id} — $${plan.unitAmount}/${plan.interval}${plan.perChildQuantity ? " per child" : ""}`,
    );
  }

  return {
    app: plan.app,
    catalogId: plan.catalogId,
    name: plan.perChildQuantity ? `${plan.name} (${plan.interval})` : plan.name,
    amount: plan.unitAmount,
    interval: plan.interval,
    perChildQuantity: plan.perChildQuantity ?? false,
    stripeProductId: product.id,
    stripePriceId: price.id,
  };
}

async function archiveLegacyEarnlyProducts() {
  console.log("\nArchiving legacy per-tier Earnly products…");
  for (const legacyId of legacyEarnlyIds) {
    const product = await findProductByLegacyStorekitId(legacyId);
    if (!product || !product.active) continue;
    await stripe.products.update(product.id, { active: false });
    console.log(`  archived ${product.id} (${legacyId})`);
  }
}

const results = [];

await ensureEarnlyProduct();
for (const plan of earnlyPlans) {
  results.push(await ensurePlan(plan));
}
for (const plan of scholarsPlans) {
  results.push(await ensurePlan(plan));
}
for (const plan of ballrPlans) {
  results.push(await ensurePlan(plan));
}
for (const plan of tinypalPlans) {
  results.push(await ensurePlan(plan));
}
for (const plan of fresherPlans) {
  results.push(await ensurePlan(plan));
}
for (const plan of ecosystemPlans) {
  results.push(await ensurePlan(plan));
}

await archiveLegacyEarnlyProducts();

const outputPath = join(root, "config/stripe-prices.json");
writeFileSync(
  outputPath,
  JSON.stringify({ generatedAt: new Date().toISOString(), plans: results }, null, 2),
);
console.log(`\nWrote ${outputPath}`);
