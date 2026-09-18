/**
 * Notify Scholars web of a Stripe credit purchase attributed to a creator code.
 * Fire-and-forget safe: logs errors, never throws into the grant path.
 */

export type ScholarsCreatorAttributionPayload = {
  creator_code: string;
  amount_cents: number;
  currency: string;
  event_type: "purchase" | "renewal";
  lookup_key?: string | null;
  product_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_invoice_id?: string | null;
  billed_at?: string;
};

function scholarsWebBaseUrl(): string | null {
  const raw =
    process.env.SCHOLARS_WEB_URL?.trim() ||
    process.env.SCHOLARS_SITE_URL?.trim() ||
    "https://scholarsnote.com";
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

function attributionSecret(): string | null {
  return (
    process.env.BILLING_ATTRIBUTION_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    null
  );
}

export async function notifyScholarsCreatorAttribution(
  payload: ScholarsCreatorAttributionPayload,
): Promise<void> {
  const code = payload.creator_code?.trim();
  if (!code) return;

  const base = scholarsWebBaseUrl();
  if (!base) {
    console.warn("[scholars-attribution] SCHOLARS_WEB_URL not set; skip");
    return;
  }

  const secret = attributionSecret();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  try {
    const res = await fetch(`${base}/api/billing/creator-attribution`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        creator_code: code.toUpperCase(),
        amount_cents: Math.max(0, Math.floor(payload.amount_cents || 0)),
        currency: (payload.currency || "usd").toUpperCase(),
        event_type: payload.event_type,
        lookup_key: payload.lookup_key || null,
        product_id: payload.product_id || payload.lookup_key || null,
        stripe_checkout_session_id: payload.stripe_checkout_session_id || null,
        stripe_invoice_id: payload.stripe_invoice_id || null,
        billed_at: payload.billed_at || new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[scholars-attribution] failed", res.status, text.slice(0, 300));
    }
  } catch (error) {
    console.error("[scholars-attribution] network error", error);
  }
}
