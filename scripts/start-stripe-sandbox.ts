import fs from "node:fs";
import { spawn } from "node:child_process";
import Stripe from "stripe";

function parseEnvFile(path: string): Record<string, string> {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return [
          line.slice(0, separator).trim(),
          line.slice(separator + 1).trim(),
        ];
      })
      .filter(([key]) => key),
  );
}

async function tunnelOrigin(): Promise<string> {
  const response = await fetch("http://127.0.0.1:4040/api/tunnels");
  if (!response.ok) throw new Error("ngrok is not running");
  const payload = (await response.json()) as {
    tunnels?: Array<{ proto?: string; public_url?: string }>;
  };
  const url = payload.tunnels?.find((tunnel) => tunnel.proto === "https")?.public_url;
  if (!url) throw new Error("No HTTPS ngrok tunnel was found");
  return url;
}

async function main() {
  const legacy = parseEnvFile("env.local");
  const sandbox = parseEnvFile(".env.local");
  const secretKey = sandbox.STRIPE_SECRET_KEY;
  if (!secretKey?.startsWith("sk_test_")) {
    throw new Error(".env.local must contain STRIPE_SECRET_KEY=sk_test_...");
  }

  const stripe = new Stripe(secretKey);
  const origin = await tunnelOrigin();
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  for (const endpoint of existing.data) {
    if (endpoint.description === "Future Kids local Stripe sandbox") {
      await stripe.webhookEndpoints.del(endpoint.id);
    }
  }
  const endpoint = await stripe.webhookEndpoints.create({
    url: `${origin}/api/webhooks/stripe`,
    description: "Future Kids local Stripe sandbox",
    enabled_events: [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
    ],
  });
  if (!endpoint.secret) throw new Error("Stripe did not return a webhook secret");

  console.log(`Stripe sandbox webhook: ${endpoint.url}`);
  console.log("Starting Future Kids at http://localhost:3000");
  const child = spawn("npm", ["run", "dev"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...legacy,
      ...sandbox,
      STRIPE_WEBHOOK_SECRET: endpoint.secret,
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    },
    stdio: "inherit",
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
