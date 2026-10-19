import { NextRequest, NextResponse } from "next/server";
import {
  isHubAdminEmail,
  updateHubOrderFulfillment,
  type HubOrderStatus,
} from "@/lib/hub/orders";
import { notifyHubOrderShipped } from "@/lib/hub/notify";
import { createClient } from "@/lib/supabase/server";

const STATUSES: HubOrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isHubAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    status?: unknown;
    carrier?: unknown;
    trackingNumber?: unknown;
    notifyCustomer?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status =
    typeof body.status === "string" &&
    STATUSES.includes(body.status as HubOrderStatus)
      ? (body.status as HubOrderStatus)
      : undefined;

  try {
    const { order, trackingChanged } = await updateHubOrderFulfillment({
      orderId: id,
      status,
      carrier: typeof body.carrier === "string" ? body.carrier : undefined,
      trackingNumber:
        typeof body.trackingNumber === "string"
          ? body.trackingNumber
          : undefined,
    });

    const shouldNotify =
      body.notifyCustomer !== false &&
      trackingChanged &&
      Boolean(order.tracking_number) &&
      (order.status === "shipped" || order.status === "delivered");

    let notified = false;
    let notifyReason: string | undefined;
    if (shouldNotify) {
      const result = await notifyHubOrderShipped({ order });
      notified = result.sent;
      notifyReason = result.reason;
    }

    return NextResponse.json({
      order,
      notified,
      notifyReason: notified ? undefined : notifyReason,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not update order",
      },
      { status: 500 },
    );
  }
}
