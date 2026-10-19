import Link from "next/link";
import { redirect } from "next/navigation";
import { getHubSize } from "@/config/hub";
import { Blobs } from "@/components/site/ui";
import { formatAccountDate } from "@/lib/auth/account-display";
import { getHubOrderByIdForUser } from "@/lib/hub/orders";
import { createClient } from "@/lib/supabase/server";

const TIMELINE: { status: string; label: string }[] = [
  { status: "paid", label: "Paid" },
  { status: "processing", label: "Processing" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

function timelineIndex(status: string): number {
  if (status === "pending") return -1;
  if (status === "canceled" || status === "refunded") return -1;
  const index = TIMELINE.findIndex((step) => step.status === status);
  return index;
}

export default async function HubOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/genlyn-hub/order/${orderId}`)}`);
  }

  const order = await getHubOrderByIdForUser(orderId, user.id);
  if (!order) {
    return (
      <div className="relative -mt-[68px] min-h-screen pt-[68px]">
        <Blobs intensity={0.45} />
        <div className="relative mx-auto max-w-lg px-5 py-20 text-center">
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Order not found
          </h1>
          <p className="mt-3 text-ink-soft">
            This Hub order isn’t on your account, or it hasn’t been created yet.
          </p>
          <Link
            href="/account#orders"
            className="mt-8 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white"
          >
            View your orders
          </Link>
        </div>
      </div>
    );
  }

  const size = getHubSize(order.size);
  const activeIndex = timelineIndex(order.status);

  return (
    <div className="relative -mt-[68px] min-h-screen pt-[68px]">
      <Blobs intensity={0.5} />
      <div className="relative mx-auto max-w-2xl px-5 py-14 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
          Order {order.order_number}
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold text-ink">
          {order.status === "pending"
            ? "Confirming your payment…"
            : order.status === "canceled"
              ? "Order canceled"
              : "Thanks for your order"}
        </h1>
        <p className="mt-3 text-ink-soft">
          {size?.label ?? `Genlyn Hub ${order.size}″`} · $
          {(order.amount_cents / 100).toFixed(0)}
        </p>

        <div className="mt-10 rounded-[32px] bg-white p-6 shadow-[0_40px_90px_-44px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 sm:p-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink-faint">
            Status
          </h2>
          <ol className="mt-5 space-y-4">
            {TIMELINE.map((step, index) => {
              const done = activeIndex >= index;
              return (
                <li key={step.status} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      done ? "bg-ink text-white" : "bg-[#f7f8fc] text-ink-faint"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <span className={`font-bold ${done ? "text-ink" : "text-ink-faint"}`}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>

          {order.tracking_number && (
            <div className="mt-8 rounded-2xl bg-[#f7f8fc] p-5 ring-1 ring-ink/5">
              <p className="text-sm font-bold text-ink">
                {order.carrier ? `${order.carrier} tracking` : "Tracking"}
              </p>
              <p className="mt-1 font-mono text-sm text-ink-soft">
                {order.tracking_number}
              </p>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-sm font-bold text-brand underline underline-offset-4"
                >
                  Track package
                </a>
              )}
            </div>
          )}

          <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-faint">Placed</dt>
              <dd className="mt-1 font-bold text-ink">
                {formatAccountDate(order.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">Ship to</dt>
              <dd className="mt-1 font-bold text-ink">
                {order.shipping_name}
                <br />
                {order.shipping_line1}
                {order.shipping_line2 ? (
                  <>
                    <br />
                    {order.shipping_line2}
                  </>
                ) : null}
                <br />
                {order.shipping_city}, {order.shipping_state}{" "}
                {order.shipping_postal_code}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/account#orders"
            className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white"
          >
            All orders
          </Link>
          <Link
            href="/genlyn-hub"
            className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink ring-1 ring-ink/10"
          >
            Back to Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
