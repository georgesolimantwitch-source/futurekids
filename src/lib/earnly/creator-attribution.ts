/**
 * Notify earnlyus.com of an Earnly Live Stripe payment attributed to a creator code.
 * Safe for the grant path: logs errors, never throws.
 */

export type EarnlyCreatorAttributionEvent =
  | "purchase"
  | "renewal"
  | "cancel"
  | "refund";

export type EarnlyCreatorAttributionPayload = {
  creator_code: string;
  amount_cents: number;
  currency: string;
  event_type: EarnlyCreatorAttributionEvent;
  product_id?: string | null;
  /** Supabase auth user id of the paying parent, when known. */
  user_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_invoice_id?: string | null;
  stripe_subscription_id?: string | null;
  billed_at?: string;
};

function earnlyWebBaseUrl(): string | null {
  const raw =
    process.env.EARNLY_WEB_URL?.trim() ||
    process.env.EARNLY_SITE_URL?.trim() ||
    "https://www.earnlyus.com";
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

function attributionSecret(): string | null {
  return (
    process.env.BILLING_ATTRIBUTION_SECRET?.trim() ||
    process.env.CREATOR_ATTRIBUTION_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    null
  );
}

export async function notifyEarnlyCreatorAttribution(
  payload: EarnlyCreatorAttributionPayload,
): Promise<void> {
  try {
    const code = payload.creator_code?.trim();
    if (!code) return;

    const base = earnlyWebBaseUrl();
    if (!base) {
      console.warn("[earnly-attribution] EARNLY_WEB_URL not set; skip");
      return;
    }

    const secret = attributionSecret();
    if (!secret) {
      console.warn("[earnly-attribution] BILLING_ATTRIBUTION_SECRET not set; skip");
      return;
    }

    const res = await fetch(`${base}/api/billing/creator-attribution`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        creator_code: code.toUpperCase(),
        amount_cents: Math.max(0, Math.floor(payload.amount_cents || 0)),
        currency: (payload.currency || "usd").toUpperCase(),
        event_type: payload.event_type,
        product_id: payload.product_id || null,
        user_id: payload.user_id || null,
        stripe_checkout_session_id: payload.stripe_checkout_session_id || null,
        stripe_invoice_id: payload.stripe_invoice_id || null,
        stripe_subscription_id: payload.stripe_subscription_id || null,
        billed_at: payload.billed_at || new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[earnly-attribution] failed",
        res.status,
        text.slice(0, 300),
      );
    }
  } catch (error) {
    console.error("[earnly-attribution] error", error);
  }
}
