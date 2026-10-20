/**
 * Stripe Global Payouts (Accounts v2 + Account Links + OutboundPayments).
 * Creators only enter bank details on a Stripe-hosted form — no Connect Express.
 */

const STRIPE_GP_VERSION =
  process.env.STRIPE_GLOBAL_PAYOUTS_API_VERSION?.trim() ||
  "2026-09-30.preview";

type Json = Record<string, unknown>;

async function stripeV2<T = Json>(
  method: string,
  path: string,
  body?: Json,
): Promise<T> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");

  const res = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Stripe-Version": STRIPE_GP_VERSION,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as T & {
    error?: { message?: string; code?: string };
  };
  if (!res.ok) {
    const message =
      data.error?.message ||
      (typeof data === "object" && data && "message" in data
        ? String((data as { message?: string }).message)
        : `Stripe v2 ${res.status}`);
    throw new Error(message);
  }
  return data;
}

export function financialAccountId(): string | null {
  return process.env.STRIPE_FINANCIAL_ACCOUNT_ID?.trim() || null;
}

export interface GlobalRecipient {
  id: string;
  contact_email?: string | null;
  display_name?: string | null;
  configuration?: {
    recipient?: {
      capabilities?: {
        bank_accounts?: Record<string, { status?: string } | undefined>;
        cards?: { status?: string };
      };
    };
  };
  requirements?: {
    entries?: unknown[];
  };
}

function capabilityActive(recipient: GlobalRecipient): boolean {
  const caps = recipient.configuration?.recipient?.capabilities;
  if (!caps) return false;
  const banks = caps.bank_accounts ?? {};
  for (const value of Object.values(banks)) {
    if (value?.status === "active") return true;
  }
  if (caps.cards?.status === "active") return true;
  return false;
}

function detailsLikelySubmitted(recipient: GlobalRecipient): boolean {
  if (capabilityActive(recipient)) return true;
  const entries = recipient.requirements?.entries;
  // Empty requirements after onboarding usually means submitted
  if (Array.isArray(entries) && entries.length === 0) return true;
  const caps = recipient.configuration?.recipient?.capabilities;
  if (!caps) return false;
  const banks = caps.bank_accounts ?? {};
  return Object.values(banks).some(
    (value) =>
      value?.status === "pending" ||
      value?.status === "restricted" ||
      value?.status === "active",
  );
}

export async function createGlobalRecipient(options: {
  email?: string | null;
  displayName?: string | null;
  country?: string;
  metadata?: Record<string, string>;
}): Promise<GlobalRecipient> {
  const country = (options.country || "us").toLowerCase();
  return stripeV2<GlobalRecipient>("POST", "/v2/core/accounts", {
    contact_email: options.email || undefined,
    display_name: options.displayName || undefined,
    identity: {
      country,
      entity_type: "individual",
    },
    configuration: {
      recipient: {
        capabilities: {
          // OutboundPayments uses local banking rails
          bank_accounts: {
            local: { requested: true },
            ...(country === "us" ? { ach: { requested: true } } : {}),
          },
        },
      },
    },
    metadata: options.metadata ?? undefined,
    include: ["requirements", "configuration.recipient", "identity"],
  });
}

export async function retrieveGlobalRecipient(
  accountId: string,
): Promise<GlobalRecipient> {
  const params = new URLSearchParams();
  params.append("include", "requirements");
  params.append("include", "configuration.recipient");
  params.append("include", "identity");
  return stripeV2<GlobalRecipient>(
    "GET",
    `/v2/core/accounts/${encodeURIComponent(accountId)}?${params.toString()}`,
  );
}

export async function createRecipientOnboardingLink(options: {
  accountId: string;
  returnUrl: string;
  refreshUrl: string;
}): Promise<{ url: string }> {
  const link = await stripeV2<{ url?: string }>(
    "POST",
    "/v2/core/account_links",
    {
      account: options.accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          return_url: options.returnUrl,
          refresh_url: options.refreshUrl,
        },
      },
    },
  );
  if (!link.url) throw new Error("Could not create payout setup link");
  return { url: link.url };
}

export function recipientReady(recipient: GlobalRecipient): {
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
} {
  return {
    payoutsEnabled: capabilityActive(recipient),
    detailsSubmitted: detailsLikelySubmitted(recipient),
  };
}

/** True if this ID is usable as a Global Payouts recipient (v2 retrieve works). */
export async function isGlobalRecipientAccount(
  accountId: string,
): Promise<boolean> {
  try {
    await retrieveGlobalRecipient(accountId);
    return true;
  } catch {
    return false;
  }
}

export async function sendGlobalOutboundPayment(options: {
  recipientId: string;
  amountCents: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}): Promise<{ id: string }> {
  const fa = financialAccountId();
  if (!fa) {
    throw new Error(
      "STRIPE_FINANCIAL_ACCOUNT_ID is not configured for Global Payouts",
    );
  }
  if (options.amountCents <= 0) {
    throw new Error("Payout amount must be positive");
  }

  const currency = (options.currency || "usd").toLowerCase();
  const payment = await stripeV2<{ id?: string }>(
    "POST",
    "/v2/money_management/outbound_payments",
    {
      from: {
        financial_account: fa,
        currency,
      },
      to: {
        recipient: options.recipientId,
      },
      amount: {
        value: options.amountCents,
        currency,
      },
      description: options.description || "Genlyn creator commission",
      metadata: options.metadata,
    },
  );

  if (!payment.id) throw new Error("Outbound payment missing id");
  return { id: payment.id };
}
