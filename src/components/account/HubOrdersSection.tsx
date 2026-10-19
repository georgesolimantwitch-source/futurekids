"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getHubSize } from "@/config/hub";
import { formatAccountDate } from "@/lib/auth/account-display";
import type { HubOrderRow } from "@/lib/hub/orders";

export function HubOrdersSection() {
  const [orders, setOrders] = useState<HubOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/hub/orders");
        const data = (await res.json()) as { orders?: HubOrderRow[]; error?: string };
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "Could not load orders.");
          return;
        }
        if (!cancelled) setOrders(data.orders ?? []);
      } catch {
        if (!cancelled) setError("Could not load orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-6 space-y-4">
      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-ink-faint">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-ink/10 bg-white px-6 py-12 text-center">
          <p className="font-extrabold text-ink">No Hub orders yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            When you buy a Genlyn Hub, tracking and shipping updates show up here.
          </p>
          <Link
            href="/genlyn-hub"
            className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white"
          >
            Shop Genlyn Hub
          </Link>
        </div>
      ) : (
        orders.map((order) => {
          const size = getHubSize(order.size);
          return (
            <Link
              key={order.id}
              href={`/genlyn-hub/order/${order.id}`}
              className="lift block rounded-[28px] bg-white p-5 ring-1 ring-ink/5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
                    {order.order_number}
                  </p>
                  <h3 className="mt-1 text-lg font-extrabold text-ink">
                    {size?.label ?? `Genlyn Hub ${order.size}″`}
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    Placed {formatAccountDate(order.created_at)} · $
                    {(order.amount_cents / 100).toFixed(0)}
                  </p>
                </div>
                <StatusPill status={order.status} />
              </div>
              {order.tracking_number && (
                <p className="mt-4 text-sm font-semibold text-ink">
                  {order.carrier ? `${order.carrier}: ` : "Tracking: "}
                  {order.tracking_number}
                </p>
              )}
            </Link>
          );
        })
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "delivered" || status === "paid" || status === "shipped"
      ? "bg-[#ecfdf3] text-[#15803d] ring-[#16a34a]/15"
      : status === "canceled" || status === "refunded"
        ? "bg-red-50 text-red-700 ring-red-100"
        : "bg-[#f7f8fc] text-ink-soft ring-ink/10";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
