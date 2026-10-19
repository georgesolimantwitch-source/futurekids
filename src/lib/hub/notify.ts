import { getHubSize } from "@/config/hub";
import type { HubOrderRow } from "@/lib/hub/orders";

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://genlyn.app"
  );
}

function fromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Genlyn <orders@genlyn.app>"
  );
}

export async function resolveCustomerEmail(
  userId: string,
): Promise<string | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.email) return profile.email;

  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

/** Email the buyer when tracking is added or changed. No-ops without RESEND_API_KEY. */
export async function notifyHubOrderShipped(options: {
  order: HubOrderRow;
  customerEmail?: string | null;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const email =
    options.customerEmail?.trim() ||
    (await resolveCustomerEmail(options.order.user_id));
  if (!email) {
    return { sent: false, reason: "No customer email" };
  }

  const order = options.order;
  const size = getHubSize(order.size);
  const product = size?.label ?? `Genlyn Hub ${order.size}″`;
  const trackUrl =
    order.tracking_url ||
    `${siteOrigin()}/genlyn-hub/order/${order.id}`;
  const orderUrl = `${siteOrigin()}/genlyn-hub/order/${order.id}`;

  const subject = `Your Genlyn Hub is on the way — ${order.order_number}`;
  const text = [
    `Hi ${order.shipping_name || "there"},`,
    ``,
    `Good news — your ${product} (${order.order_number}) has shipped.`,
    order.carrier ? `Carrier: ${order.carrier}` : null,
    order.tracking_number ? `Tracking: ${order.tracking_number}` : null,
    `Track: ${trackUrl}`,
    ``,
    `Order details: ${orderUrl}`,
    ``,
    `— Genlyn`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#0b1020;">
      <p style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6366f1;">Genlyn Hub</p>
      <h1 style="font-size:24px;line-height:1.2;margin:8px 0 16px;">Your Hub is on the way</h1>
      <p style="font-size:15px;line-height:1.55;color:#475569;">
        Hi ${escapeHtml(order.shipping_name || "there")}, your
        <strong>${escapeHtml(product)}</strong>
        (<strong>${escapeHtml(order.order_number)}</strong>) has shipped.
      </p>
      <div style="background:#f7f8fc;border-radius:16px;padding:16px 18px;margin:20px 0;">
        ${
          order.carrier
            ? `<p style="margin:0 0 6px;font-size:13px;color:#64748b;">Carrier<br/><strong style="color:#0b1020;">${escapeHtml(order.carrier)}</strong></p>`
            : ""
        }
        ${
          order.tracking_number
            ? `<p style="margin:0;font-size:13px;color:#64748b;">Tracking<br/><strong style="color:#0b1020;font-family:ui-monospace,monospace;">${escapeHtml(order.tracking_number)}</strong></p>`
            : ""
        }
      </div>
      <p style="margin:24px 0;">
        <a href="${escapeAttr(trackUrl)}" style="display:inline-block;background:#0b1020;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:999px;">
          Track package
        </a>
      </p>
      <p style="font-size:13px;color:#64748b;">
        <a href="${escapeAttr(orderUrl)}" style="color:#0b1020;">View order</a>
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `hub-shipped/${order.id}/${order.tracking_number ?? "none"}`,
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [email],
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[hub-notify] resend failed", res.status, detail);
    return { sent: false, reason: `Resend ${res.status}` };
  }

  return { sent: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
