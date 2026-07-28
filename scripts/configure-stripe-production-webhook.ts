import fs from "node:fs";
import { spawnSync } from "node:child_process";
import Stripe from "stripe";

const WEBHOOK_URL = "https://genlyn.app/api/webhooks/stripe";

function liveSecret(): string {
  const contents = fs.readFileSync("env.local", "utf8");
  const value = /^STRIPE_SECRET_KEY\s*=\s*(.+)$/m.exec(contents)?.[1]?.trim();
  if (!value?.startsWith("sk_live_")) {
    throw new Error("env.local must contain the live Stripe secret");
  }
  return value;
}

function runVercel(args: string[], input?: string) {
  return spawnSync("npx", ["vercel", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    input,
  });
}

async function main() {
  const stripe = new Stripe(liveSecret());
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  for (const endpoint of existing.data) {
    if (endpoint.url === WEBHOOK_URL) {
      await stripe.webhookEndpoints.del(endpoint.id);
    }
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    description: "Future Kids production subscription ledger",
    enabled_events: [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
      "subscription_schedule.updated",
      "subscription_schedule.completed",
      "subscription_schedule.released",
      "subscription_schedule.canceled",
      "subscription_schedule.aborted",
    ],
  });
  if (!endpoint.secret) {
    await stripe.webhookEndpoints.del(endpoint.id);
    throw new Error("Stripe did not return a production webhook secret");
  }

  const remove = runVercel([
    "env",
    "rm",
    "STRIPE_WEBHOOK_SECRET",
    "production",
    "--yes",
  ]);
  const removeOutput = `${remove.stdout}\n${remove.stderr}`;
  if (
    remove.status !== 0 &&
    !removeOutput.includes("env_not_found") &&
    !removeOutput.includes("not found")
  ) {
    await stripe.webhookEndpoints.del(endpoint.id);
    throw new Error(remove.stderr.trim() || "Could not clear the Vercel webhook secret");
  }

  const add = runVercel(
    ["env", "add", "STRIPE_WEBHOOK_SECRET", "production", "--sensitive"],
    `${endpoint.secret}\n`,
  );
  if (add.status !== 0) {
    await stripe.webhookEndpoints.del(endpoint.id);
    throw new Error(add.stderr.trim() || "Could not configure the Vercel webhook secret");
  }

  console.log(`Configured production webhook ${endpoint.id}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
