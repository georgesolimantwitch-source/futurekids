"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { hubSizes, type HubSizeId } from "@/config/hub";
import {
  creatorCodeFromUrl,
  storeCreatorCode,
} from "@/lib/checkout/client";
import { Blobs } from "@/components/site/ui";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Phase = "shipping" | "payment";

export function HubCheckoutForm({ initialSize }: { initialSize: HubSizeId }) {
  const [sizeId, setSizeId] = useState<HubSizeId>(initialSize);
  const size = useMemo(
    () => hubSizes.find((item) => item.id === sizeId)!,
    [sizeId],
  );
  const [phase, setPhase] = useState<Phase>("shipping");
  const [shipping, setShipping] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    phone: "",
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatorCode, setCreatorCode] = useState("");
  const [creatorValid, setCreatorValid] = useState<boolean | null>(null);

  useEffect(() => {
    const code = creatorCodeFromUrl();
    if (code) setCreatorCode(code);
  }, []);

  useEffect(() => {
    if (!creatorCode || creatorCode.length < 4) {
      setCreatorValid(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/creators/validate?code=${encodeURIComponent(creatorCode)}`,
        );
        const data = (await res.json()) as { valid?: boolean; code?: string };
        setCreatorValid(Boolean(data.valid));
        if (data.valid && data.code) setCreatorCode(data.code);
      } catch {
        setCreatorValid(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [creatorCode]);

  async function startPayment(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (creatorCode) storeCreatorCode(creatorCode);
      const res = await fetch("/api/hub/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: sizeId,
          shipping,
          creator_code: creatorCode || undefined,
        }),
      });
      const data = (await res.json()) as {
        clientSecret?: string;
        orderId?: string;
        error?: string;
        code?: string;
      };

      if (res.status === 401 || data.code === "AUTH_REQUIRED") {
        const next = `/genlyn-hub/checkout?size=${sizeId}`;
        window.location.assign(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (!res.ok || !data.clientSecret || !data.orderId) {
        throw new Error(data.error ?? "Could not start checkout");
      }
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
      setPhase("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
    } finally {
      setBusy(false);
    }
  }

  if (!publishableKey || !stripePromise) {
    return (
      <Shell>
        <div className="rounded-[28px] bg-white p-8 text-center ring-1 ring-ink/5">
          <h1 className="font-display text-2xl font-extrabold text-ink">
            Checkout unavailable
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Stripe publishable key is not configured yet. Add{" "}
            <code className="rounded bg-[#f7f8fc] px-1.5 py-0.5 text-xs">
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
            </code>{" "}
            and Hub price IDs, then try again.
          </p>
          <Link
            href="/genlyn-hub"
            className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white"
          >
            Back to Genlyn Hub
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Checkout
          </p>
          <h1 className="font-display mt-3 text-4xl font-extrabold text-ink sm:text-5xl">
            Buy Genlyn Hub
          </h1>
          <p className="mt-3 max-w-lg text-ink-soft">
            Secure payment stays on Genlyn. We’ll ship to the address you enter
            below.
          </p>

          <div className="mt-8 space-y-3">
            {hubSizes.map((item) => {
              const active = item.id === sizeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={phase === "payment"}
                  onClick={() => setSizeId(item.id)}
                  className={`flex w-full items-center gap-4 rounded-[24px] px-4 py-3 text-left ring-1 transition sm:px-5 sm:py-4 ${
                    active
                      ? "bg-white ring-ink/20 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.4)]"
                      : "bg-white/70 ring-ink/5"
                  } disabled:opacity-70`}
                >
                  <Image
                    src={item.image}
                    alt=""
                    width={96}
                    height={96}
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-ink/5 sm:h-20 sm:w-20"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold text-ink">
                      {item.label}
                    </span>
                    <span className="block text-sm text-ink-soft">{item.blurb}</span>
                  </span>
                  <span className="font-display shrink-0 text-2xl font-extrabold text-ink">
                    {item.priceDisplay}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 overflow-hidden rounded-[28px] bg-white p-4 ring-1 ring-ink/5 lg:hidden">
            <Image
              src={size.image}
              alt={size.imageAlt}
              width={1024}
              height={1024}
              className="h-auto w-full rounded-[20px] object-cover"
            />
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-6 shadow-[0_40px_90px_-44px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 sm:p-8">
          {phase === "shipping" ? (
            <form onSubmit={startPayment} className="space-y-4">
              <h2 className="font-display text-2xl font-extrabold text-ink">
                Shipping
              </h2>
              <Field
                label="Full name"
                value={shipping.name}
                onChange={(value) => setShipping((s) => ({ ...s, name: value }))}
                required
              />
              <Field
                label="Address"
                value={shipping.line1}
                onChange={(value) => setShipping((s) => ({ ...s, line1: value }))}
                required
              />
              <Field
                label="Apartment, suite (optional)"
                value={shipping.line2}
                onChange={(value) => setShipping((s) => ({ ...s, line2: value }))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="City"
                  value={shipping.city}
                  onChange={(value) => setShipping((s) => ({ ...s, city: value }))}
                  required
                />
                <Field
                  label="State"
                  value={shipping.state}
                  onChange={(value) => setShipping((s) => ({ ...s, state: value }))}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="ZIP"
                  value={shipping.postal_code}
                  onChange={(value) =>
                    setShipping((s) => ({ ...s, postal_code: value }))
                  }
                  required
                />
                <Field
                  label="Country"
                  value={shipping.country}
                  onChange={(value) =>
                    setShipping((s) => ({ ...s, country: value.toUpperCase() }))
                  }
                  required
                />
              </div>
              <Field
                label="Phone (optional)"
                value={shipping.phone}
                onChange={(value) => setShipping((s) => ({ ...s, phone: value }))}
              />
              <label className="block">
                <span className="text-xs font-bold text-ink-soft">
                  Creator code (optional)
                </span>
                <input
                  value={creatorCode}
                  onChange={(e) =>
                    setCreatorCode(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                    )
                  }
                  placeholder="e.g. MAYA"
                  maxLength={6}
                  className="mt-1.5 w-full rounded-2xl bg-[#f7f8fc] px-4 py-3 text-[15px] font-bold tracking-wider text-ink outline-none ring-1 ring-ink/[0.06] focus:bg-white focus:ring-2 focus:ring-brand/40"
                />
                {creatorValid === true && (
                  <span className="mt-2 block text-xs font-bold text-[#15803d]">
                    Code applied — creator earns 20%
                  </span>
                )}
                {creatorValid === false && creatorCode.length >= 4 && (
                  <span className="mt-2 block text-xs font-bold text-[#c2410c]">
                    Code not found
                  </span>
                )}
              </label>
              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="shine press flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
              >
                {busy ? "Preparing payment…" : `Pay ${size.priceDisplay}`}
              </button>
            </form>
          ) : clientSecret && orderId ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#0b1020",
                    borderRadius: "16px",
                    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
                  },
                },
              }}
            >
              <PaymentStep
                orderId={orderId}
                amountLabel={size.priceDisplay}
                onBack={() => {
                  setPhase("shipping");
                  setClientSecret(null);
                  setOrderId(null);
                  setError(null);
                }}
              />
            </Elements>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

function PaymentStep({
  orderId,
  amountLabel,
  onBack,
}: {
  orderId: string;
  amountLabel: string;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const returnUrl = `${window.location.origin}/genlyn-hub/order/${orderId}`;
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      setBusy(false);
      return;
    }
    router.push(`/genlyn-hub/order/${orderId}`);
    router.refresh();
  }

  return (
    <form onSubmit={pay} className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold text-ink">Payment</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-bold text-ink-soft underline underline-offset-4"
        >
          Edit shipping
        </button>
      </div>
      <PaymentElement />
      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || busy}
        className="shine press flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
      >
        {busy ? "Processing…" : `Pay ${amountLabel}`}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-ink-soft">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-1.5 w-full rounded-2xl bg-[#f7f8fc] px-4 py-3 text-[15px] text-ink outline-none ring-1 ring-ink/[0.06] transition focus:bg-white focus:ring-2 focus:ring-brand/40"
      />
    </label>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mt-[68px] min-h-screen overflow-hidden pt-[68px]">
      <Blobs intensity={0.55} />
      <div className="relative px-5 py-12 sm:px-8 sm:py-16 lg:px-10">{children}</div>
    </div>
  );
}
