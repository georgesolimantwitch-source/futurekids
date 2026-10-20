"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  creatorCodeFromUrl,
  storeCreatorCode,
} from "@/lib/checkout/client";
import { Blobs } from "@/components/site/ui";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export function SubscriptionCheckout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [creatorCode, setCreatorCode] = useState("");
  const [creatorValid, setCreatorValid] = useState<boolean | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [appKey, setAppKey] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get("creator_code") || "";
    const stored = creatorCodeFromUrl() || "";
    setCreatorCode((fromQuery || stored).toUpperCase());
    setReady(true);
  }, [searchParams]);

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
      let body: Record<string, unknown> = {};
      try {
        const raw = window.sessionStorage.getItem("genlyn_checkout_body");
        if (raw) body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        body = {};
      }

      const planKey =
        (typeof body.planKey === "string" && body.planKey) ||
        searchParams.get("planKey") ||
        "";
      if (!planKey) {
        throw new Error("Missing plan. Go back to Pricing and choose a plan.");
      }

      if (creatorCode) {
        storeCreatorCode(creatorCode);
        body.creator_code = creatorCode;
      }

      body.planKey = planKey;
      if (!body.childCount && searchParams.get("children")) {
        body.childCount = Number(searchParams.get("children"));
      }
      if (!body.scholarsTier && searchParams.get("scholarsTier")) {
        body.scholarsTier = searchParams.get("scholarsTier");
      }
      if (!body.scholarsChildCount && searchParams.get("scholarsChildCount")) {
        body.scholarsChildCount = Number(searchParams.get("scholarsChildCount"));
      }
      if (!body.scholarsGenerations && searchParams.get("scholarsGenerations")) {
        body.scholarsGenerations = Number(
          searchParams.get("scholarsGenerations"),
        );
      }
      if (
        !body.scholarsTutorMinutes &&
        searchParams.get("scholarsTutorMinutes")
      ) {
        body.scholarsTutorMinutes = Number(
          searchParams.get("scholarsTutorMinutes"),
        );
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        clientSecret?: string;
        appKey?: string;
        error?: string;
        code?: string;
      };

      if (res.status === 401 || data.code === "AUTH_REQUIRED") {
        const next = `/checkout?${searchParams.toString()}`;
        window.location.assign(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error ?? "Could not start checkout");
      }
      setClientSecret(data.clientSecret);
      setAppKey(data.appKey ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
    } finally {
      setBusy(false);
    }
  }

  if (!publishableKey || !stripePromise) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg rounded-[32px] bg-white p-8 text-center ring-1 ring-ink/5">
          <h1 className="font-display text-2xl font-extrabold text-ink">
            Checkout unavailable
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable Genlyn checkout.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto w-full max-w-lg">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
          Secure checkout
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold text-ink">
          Complete your plan
        </h1>
        <p className="mt-3 text-ink-soft">
          Pay on Genlyn — no redirect to Stripe. Have a creator code? Enter it
          below for 20% to go to your referrer.
        </p>

        <div className="mt-8 rounded-[32px] bg-white p-6 shadow-[0_40px_90px_-44px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 sm:p-8">
          {!clientSecret ? (
            <form onSubmit={startPayment} className="space-y-5">
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
                    Code applied — your creator earns 20%
                  </span>
                )}
                {creatorValid === false && creatorCode.length >= 4 && (
                  <span className="mt-2 block text-xs font-bold text-[#c2410c]">
                    Code not found
                  </span>
                )}
              </label>
              {error && (
                <p
                  className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy || !ready}
                className="shine press flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
              >
                {busy ? "Preparing…" : "Continue to payment"}
              </button>
              <Link
                href="/pricing"
                className="block text-center text-sm font-bold text-ink-soft underline underline-offset-4"
              >
                Back to pricing
              </Link>
            </form>
          ) : (
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
              <PayForm
                appKey={appKey}
                onBack={() => {
                  setClientSecret(null);
                  setError(null);
                }}
              />
            </Elements>
          )}
        </div>
      </div>
    </Shell>
  );
}

function PayForm({
  appKey,
  onBack,
}: {
  appKey: string;
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
    const returnUrl = `${window.location.origin}/account?checkout=success${
      appKey ? `&app=${appKey}` : ""
    }`;
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
    try {
      window.sessionStorage.removeItem("genlyn_checkout_body");
    } catch {
      /* ignore */
    }
    router.push(`/account?checkout=success${appKey ? `&app=${appKey}` : ""}`);
    router.refresh();
  }

  return (
    <form onSubmit={pay} className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-extrabold text-ink">Payment</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-bold text-ink-soft underline underline-offset-4"
        >
          Back
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
        {busy ? "Processing…" : "Pay now"}
      </button>
    </form>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mt-[68px] min-h-screen overflow-hidden pt-[68px]">
      <Blobs intensity={0.55} />
      <div className="relative px-5 py-12 sm:px-8 sm:py-16">{children}</div>
    </div>
  );
}
