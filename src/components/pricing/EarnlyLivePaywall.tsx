"use client";

import Image from "next/image";
import { useState } from "react";
import {
  earnlyLivePricing,
  earnlyPriceLine,
  earnlyUnitPriceLine,
  clampEarnlyChildCount,
  type EarnlyBillingPeriod,
} from "@/config/earnly-pricing";
import { earnlyPlanKey } from "@/config/checkout-plans";
import { postCheckout } from "@/lib/checkout/client";
import { BillingToggle } from "./PricingPlansSection";

export function EarnlyLivePaywall() {
  const [childCount, setChildCount] = useState(1);
  const [billingPeriod, setBillingPeriod] = useState<EarnlyBillingPeriod>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = clampEarnlyChildCount(childCount);
  function adjustChildren(delta: number) {
    setChildCount((c) => clampEarnlyChildCount(c + delta));
  }

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const url = await postCheckout({
        planKey: earnlyPlanKey(count, billingPeriod),
        childCount: count,
      });

      if (url) {
        globalThis.location.assign(url);
        return;
      }
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <section
      id="earnly-live"
      className="scroll-mt-24 border-b border-neutral-100 bg-white py-16 sm:py-24"
    >
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-xl ring-1 ring-black/5">
          {/* Header */}
          <div className="border-b border-neutral-100 px-6 py-5 text-center sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <Image
                src="/images/apps/earnly/icon.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
                aria-hidden
              />
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
              {earnlyLivePricing.productName}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {earnlyLivePricing.description}
            </p>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
            {/* Children quantity */}
            <div>
              <label className="text-sm font-medium text-neutral-900">Children</label>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <button
                  type="button"
                  onClick={() => adjustChildren(-1)}
                  disabled={count <= earnlyLivePricing.minChildren}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-medium text-neutral-700 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Fewer children"
                >
                  −
                </button>
                <span
                  className="min-w-[3rem] text-center text-2xl font-semibold tabular-nums text-neutral-900"
                  aria-live="polite"
                >
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => adjustChildren(1)}
                  disabled={count >= earnlyLivePricing.maxChildren}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-medium text-neutral-700 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="More children"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                {earnlyUnitPriceLine(billingPeriod)} · up to {earnlyLivePricing.maxChildren}{" "}
                children
              </p>
            </div>

            {/* Billing period */}
            <div>
              <p className="mb-3 text-sm font-medium text-neutral-900">Billing</p>
              <BillingToggle
                value={billingPeriod}
                onChange={setBillingPeriod}
                className="w-full max-w-none"
              />
              {billingPeriod === "yearly" && (
                <p className="mt-3 inline-flex items-center rounded-full bg-[#5CC6E2]/15 px-3 py-1 text-xs font-semibold text-[#2A8FA8]">
                  2 months free · billed as 10 months
                </p>
              )}
            </div>

            {/* Price display */}
            <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-center">
              <p className="text-3xl font-semibold tracking-tight text-neutral-900">
                {earnlyPriceLine(count, billingPeriod)}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                {count === 1 ? "1 child" : `${count} children`} on your family plan
              </p>
              {billingPeriod === "yearly" && (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  Save 2 months vs paying monthly
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2">
              {earnlyLivePricing.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-neutral-700"
                >
                  <svg
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5BC0DE] px-6 py-4 text-base font-semibold text-white shadow-md transition hover:bg-[#4ab0ce] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Redirecting…" : "Start Premium"}
            </button>

            <p className="text-center text-xs text-neutral-500">
              Secure checkout powered by Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
