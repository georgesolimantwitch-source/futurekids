"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useEffect } from "react";
import { getHubSize } from "@/config/hub";
import { formatAccountDate } from "@/lib/auth/account-display";
import {
  formatHubShippingBlock,
  type HubOrderAdminRow,
  type HubOrderStatus,
} from "@/lib/hub/orders";
import { Blobs } from "@/components/site/ui";

const STATUSES: HubOrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
];

type Filter = "needs_ship" | "shipped" | "all" | "paid" | "delivered";

export function HubAdminOrders() {
  const [orders, setOrders] = useState<HubOrderAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("needs_ship");
  const [query, setQuery] = useState("");

  async function load() {
    setError(null);
    const res = await fetch("/api/hub/orders/admin");
    const data = (await res.json()) as {
      orders?: HubOrderAdminRow[];
      error?: string;
    };
    if (!res.ok) {
      setError(data.error ?? "Could not load orders.");
      setOrders([]);
      return;
    }
    setOrders(data.orders ?? []);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const needsShip = orders.filter((o) =>
      ["paid", "processing"].includes(o.status),
    ).length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    return { needsShip, shipped, delivered, all: orders.length };
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter === "needs_ship" && !["paid", "processing"].includes(order.status)) {
        return false;
      }
      if (filter === "shipped" && order.status !== "shipped") return false;
      if (filter === "paid" && order.status !== "paid") return false;
      if (filter === "delivered" && order.status !== "delivered") return false;

      if (!q) return true;
      const hay = [
        order.order_number,
        order.shipping_name,
        order.shipping_city,
        order.shipping_state,
        order.shipping_postal_code,
        order.shipping_line1,
        order.customer_email,
        order.customer_name,
        order.tracking_number,
        order.carrier,
        order.creator_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, filter, query]);

  async function save(
    event: FormEvent<HTMLFormElement>,
    order: HubOrderAdminRow,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const trackingNumber = String(form.get("trackingNumber") ?? "").trim();
    const carrier = String(form.get("carrier") ?? "").trim();
    let status = String(form.get("status") ?? order.status) as HubOrderStatus;

    // Adding tracking auto-ships unless already delivered/canceled
    if (
      trackingNumber &&
      !["delivered", "canceled", "refunded"].includes(status)
    ) {
      status = "shipped";
    }

    setSavingId(order.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/hub/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          carrier,
          trackingNumber,
          notifyCustomer: true,
        }),
      });
      const data = (await res.json()) as {
        order?: HubOrderAdminRow;
        notified?: boolean;
        notifyReason?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Update failed");

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? {
                ...item,
                ...(data.order as HubOrderAdminRow),
                customer_email: item.customer_email,
                customer_name: item.customer_name,
              }
            : item,
        ),
      );

      if (data.notified) {
        setNotice(
          `Updated ${data.order?.order_number ?? "order"} — customer emailed.`,
        );
      } else if (trackingNumber && data.notifyReason) {
        setNotice(
          `Updated ${data.order?.order_number ?? "order"}. Email not sent: ${data.notifyReason}`,
        );
      } else {
        setNotice(`Updated ${data.order?.order_number ?? "order"}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  function copyShipping(order: HubOrderAdminRow) {
    void navigator.clipboard.writeText(formatHubShippingBlock(order));
    setNotice(`Copied shipping for ${order.order_number}`);
  }

  return (
    <div className="relative -mt-[68px] min-h-screen pt-[68px]">
      <Blobs intensity={0.45} />
      <div className="relative mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
          Admin
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold text-ink">
          Hub orders
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Fulfill Genlyn Hub hardware — full shipping details, add tracking, and
          customers get emailed automatically when a package ships.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/admin/creators"
            className="font-bold text-ink underline underline-offset-4"
          >
            Creator program
          </Link>
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {(
            [
              ["needs_ship", `Needs ship (${counts.needsShip})`],
              ["shipped", `In transit (${counts.shipped})`],
              ["delivered", `Delivered (${counts.delivered})`],
              ["all", `All (${counts.all})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === key
                  ? "bg-ink text-white"
                  : "bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="sr-only">Search orders</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, city, order #, tracking…"
            className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink outline-none ring-1 ring-ink/[0.08] focus:ring-2 focus:ring-brand/40"
          />
        </label>

        {error && (
          <p
            className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-6 rounded-2xl bg-[#ecfdf3] px-4 py-3 text-sm text-[#15803d]">
            {notice}
          </p>
        )}

        {loading ? (
          <p className="mt-10 text-sm text-ink-faint">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="mt-10 text-sm text-ink-soft">No orders in this view.</p>
        ) : (
          <div className="mt-10 space-y-5">
            {visible.map((order) => {
              const size = getHubSize(order.size);
              return (
                <article
                  key={order.id}
                  className="rounded-[28px] bg-white p-5 shadow-[0_24px_50px_-36px_rgba(15,23,42,0.4)] ring-1 ring-ink/5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
                        {order.order_number}
                      </p>
                      <h2 className="mt-1 text-lg font-extrabold text-ink">
                        {size?.label ?? order.size} · $
                        {(order.amount_cents / 100).toFixed(0)}
                      </h2>
                      <p className="mt-1 text-sm text-ink-soft">
                        Ordered {formatAccountDate(order.created_at)}
                        {order.paid_at
                          ? ` · Paid ${formatAccountDate(order.paid_at)}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#f7f8fc] px-3 py-1 text-xs font-bold capitalize text-ink ring-1 ring-ink/10">
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#f7f8fc] p-4 ring-1 ring-ink/5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                          Ship to
                        </p>
                        <button
                          type="button"
                          onClick={() => copyShipping(order)}
                          className="text-xs font-bold text-brand underline underline-offset-2"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-relaxed text-ink">
                        {formatHubShippingBlock(order) || "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#f7f8fc] p-4 ring-1 ring-ink/5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                        Customer
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink">
                        {order.customer_name || order.shipping_name || "—"}
                      </p>
                      <p className="mt-1 break-all text-sm text-ink-soft">
                        {order.customer_email || "No email on profile"}
                      </p>
                      {order.shipping_phone && (
                        <p className="mt-1 text-sm text-ink-soft">
                          {order.shipping_phone}
                        </p>
                      )}
                      {order.creator_code && (
                        <p className="mt-2 text-xs font-bold text-[#7c3aed]">
                          Creator code {order.creator_code}
                        </p>
                      )}
                      <Link
                        href={`/genlyn-hub/order/${order.id}`}
                        className="mt-3 inline-flex text-xs font-bold text-ink underline underline-offset-4"
                      >
                        Customer order page
                      </Link>
                    </div>
                  </div>

                  <form
                    onSubmit={(event) => void save(event, order)}
                    className="mt-5 grid gap-3 sm:grid-cols-4"
                  >
                    <label className="block text-xs font-bold text-ink-soft sm:col-span-1">
                      Status
                      <select
                        name="status"
                        defaultValue={order.status}
                        key={`${order.id}-status-${order.status}`}
                        className="mt-1.5 w-full rounded-2xl bg-[#f7f8fc] px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-ink/[0.06]"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-bold text-ink-soft sm:col-span-1">
                      Carrier
                      <input
                        name="carrier"
                        defaultValue={order.carrier ?? ""}
                        key={`${order.id}-carrier-${order.carrier ?? ""}`}
                        placeholder="UPS / USPS / FedEx"
                        className="mt-1.5 w-full rounded-2xl bg-[#f7f8fc] px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-ink/[0.06]"
                      />
                    </label>
                    <label className="block text-xs font-bold text-ink-soft sm:col-span-1">
                      Tracking #
                      <input
                        name="trackingNumber"
                        defaultValue={order.tracking_number ?? ""}
                        key={`${order.id}-track-${order.tracking_number ?? ""}`}
                        placeholder="Paste tracking"
                        className="mt-1.5 w-full rounded-2xl bg-[#f7f8fc] px-3 py-2.5 text-sm font-mono text-ink outline-none ring-1 ring-ink/[0.06]"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={savingId === order.id}
                        className="w-full rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                      >
                        {savingId === order.id
                          ? "Saving…"
                          : order.tracking_number
                            ? "Update & notify"
                            : "Ship & notify"}
                      </button>
                    </div>
                  </form>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex text-xs font-bold text-brand underline underline-offset-4"
                    >
                      Open carrier tracking
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
