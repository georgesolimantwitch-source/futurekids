import type { HubSizeId } from "@/config/hub";
import { HUB_KIND, getHubSize } from "@/config/hub";
import { createAdminClient } from "@/lib/supabase/admin";

export type HubOrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "canceled"
  | "refunded";

export interface HubShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  phone?: string;
}

export interface HubOrderRow {
  id: string;
  order_number: string;
  user_id: string;
  size: HubSizeId;
  amount_cents: number;
  currency: string;
  status: HubOrderStatus;
  shipping_name: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  shipping_phone: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  creator_code: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HubOrderAdminRow extends HubOrderRow {
  customer_email: string | null;
  customer_name: string | null;
}

export function formatHubShippingBlock(order: HubOrderRow): string {
  const lines = [
    order.shipping_name,
    order.shipping_line1,
    order.shipping_line2,
    [
      [order.shipping_city, order.shipping_state].filter(Boolean).join(", "),
      order.shipping_postal_code,
    ]
      .filter(Boolean)
      .join(" "),
    order.shipping_country,
    order.shipping_phone ? `Phone: ${order.shipping_phone}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GH-${stamp}-${rand}`;
}

export function isHubAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.HUB_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}

export function trackingUrlFor(
  carrier: string | null | undefined,
  trackingNumber: string | null | undefined,
): string | null {
  const number = trackingNumber?.trim();
  if (!number) return null;
  const key = (carrier ?? "").trim().toLowerCase();
  if (key.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${encodeURIComponent(number)}`;
  }
  if (key.includes("usps") || key.includes("postal")) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(number)}`;
  }
  if (key.includes("fedex") || key.includes("fdx")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(number)}`;
  }
  if (key.includes("dhl")) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(number)}`;
  }
  return null;
}

export function validateShipping(input: unknown): HubShippingAddress | null {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const line1 = typeof body.line1 === "string" ? body.line1.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const state = typeof body.state === "string" ? body.state.trim() : "";
  const postal_code =
    typeof body.postal_code === "string" ? body.postal_code.trim() : "";
  const country =
    typeof body.country === "string" && body.country.trim()
      ? body.country.trim().toUpperCase()
      : "US";
  const line2 =
    typeof body.line2 === "string" && body.line2.trim()
      ? body.line2.trim()
      : undefined;
  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? body.phone.trim()
      : undefined;

  if (!name || !line1 || !city || !state || !postal_code) return null;
  if (country.length !== 2) return null;

  return { name, line1, line2, city, state, postal_code, country, phone };
}

export async function createPendingHubOrder(options: {
  userId: string;
  size: HubSizeId;
  paymentIntentId: string;
  customerId: string;
  shipping: HubShippingAddress;
  creatorCode?: string;
}): Promise<HubOrderRow> {
  const size = getHubSize(options.size);
  if (!size) throw new Error("Invalid hub size");

  const admin = createAdminClient();
  const orderNumber = generateOrderNumber();
  const { data, error } = await admin
    .from("hub_orders")
    .insert({
      order_number: orderNumber,
      user_id: options.userId,
      size: options.size,
      amount_cents: size.priceCents,
      currency: "usd",
      status: "pending",
      shipping_name: options.shipping.name,
      shipping_line1: options.shipping.line1,
      shipping_line2: options.shipping.line2 ?? null,
      shipping_city: options.shipping.city,
      shipping_state: options.shipping.state,
      shipping_postal_code: options.shipping.postal_code,
      shipping_country: options.shipping.country ?? "US",
      shipping_phone: options.shipping.phone ?? null,
      stripe_payment_intent_id: options.paymentIntentId,
      stripe_customer_id: options.customerId,
      creator_code: options.creatorCode ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create hub order");
  }
  return data as HubOrderRow;
}

export async function markHubOrderPaid(paymentIntentId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("hub_orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .in("status", ["pending", "paid"]);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markHubOrderPaymentFailed(
  paymentIntentId: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("hub_orders")
    .update({ status: "canceled" })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("status", "pending");
}

export async function getHubOrderByIdForUser(
  orderId: string,
  userId: string,
): Promise<HubOrderRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("hub_orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as HubOrderRow | null) ?? null;
}

export async function listHubOrdersForUser(userId: string): Promise<HubOrderRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("hub_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as HubOrderRow[] | null) ?? [];
}

export async function listAllHubOrders(): Promise<HubOrderAdminRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("hub_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  const orders = (data as HubOrderRow[] | null) ?? [];
  if (orders.length === 0) return [];

  const userIds = [...new Set(orders.map((order) => order.user_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);
  const byId = new Map(
    (profiles ?? []).map((row) => [
      row.id as string,
      {
        email: (row.email as string | null) ?? null,
        name: (row.full_name as string | null) ?? null,
      },
    ]),
  );

  return orders.map((order) => ({
    ...order,
    customer_email: byId.get(order.user_id)?.email ?? null,
    customer_name: byId.get(order.user_id)?.name ?? null,
  }));
}

export async function getHubOrderById(
  orderId: string,
): Promise<HubOrderRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("hub_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  return (data as HubOrderRow | null) ?? null;
}

export async function updateHubOrderFulfillment(options: {
  orderId: string;
  status?: HubOrderStatus | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  /** When true (default), adding a tracking number promotes status to shipped. */
  autoShipOnTracking?: boolean;
}): Promise<{
  order: HubOrderRow;
  trackingChanged: boolean;
  previousTracking: string | null;
}> {
  const existing = await getHubOrderById(options.orderId);
  if (!existing) throw new Error("Order not found");

  const carrier =
    options.carrier !== undefined
      ? options.carrier?.trim() || null
      : existing.carrier;
  const trackingNumber =
    options.trackingNumber !== undefined
      ? options.trackingNumber?.trim() || null
      : existing.tracking_number;
  const trackingUrl = trackingUrlFor(carrier, trackingNumber);

  let status = options.status ?? existing.status;
  const autoShip = options.autoShipOnTracking !== false;
  const terminal = ["canceled", "refunded", "delivered"].includes(status);
  if (autoShip && trackingNumber && !terminal) {
    status = "shipped";
  }

  const patch: Record<string, unknown> = {
    status,
    carrier,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl,
  };
  if (status === "shipped" && !existing.shipped_at) {
    patch.shipped_at = new Date().toISOString();
  }
  if (status === "delivered" && !existing.delivered_at) {
    patch.delivered_at = new Date().toISOString();
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("hub_orders")
    .update(patch)
    .eq("id", options.orderId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not update order");
  }

  const order = data as HubOrderRow;
  const previousTracking = existing.tracking_number;
  const trackingChanged =
    Boolean(trackingNumber) && trackingNumber !== previousTracking;

  return { order, trackingChanged, previousTracking };
}

export function isHubPaymentIntent(metadata: Record<string, string> | null | undefined) {
  return metadata?.kind === HUB_KIND;
}
