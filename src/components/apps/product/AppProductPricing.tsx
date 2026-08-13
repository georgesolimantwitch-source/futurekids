"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { AppConfig } from "@/config/brand";
import { individualAppPlanKey } from "@/config/checkout-plans";
import {
  getPriceForPeriod,
  getPricingPlan,
  type BillingPeriod,
} from "@/config/pricing";
import { earnlyTotalPrice } from "@/config/earnly-pricing";
import { ballrTotalPrice } from "@/config/ballr-pricing";
import { postCheckout } from "@/lib/checkout/client";
import { ScholarsCreditBuilder } from "@/components/pricing/ScholarsCreditBuilder";

interface AppProductPricingProps {
  app: AppConfig;
}

const FAMILY_APPS = new Set(["earnly", "ballr"]);

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function AppProductPricing({ app }: AppProductPricingProps) {
  if (app.slug === "scholars") {
    return (
      <section
        id="pricing"
        className="scroll-mt-40 border-y border-neutral-100 bg-[#fefbf6]"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: app.accentColor }}
            >
              Plans &amp; pricing
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Get {app.name}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-600">
              Pick how many generations and tutor minutes you need, then refill
              once or subscribe monthly or yearly.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
            <ScholarsCreditBuilder embedded />
          </div>

          <p className="mt-6 text-center text-xs text-neutral-500">
            Want every app?{" "}
            <Link
              href="/pricing?app=all-access"
              className="font-medium text-neutral-800 underline underline-offset-2"
            >
              Compare Genlyn All Access
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return <IndividualAppPricing app={app} />;
}

function IndividualAppPricing({ app }: { app: AppConfig }) {
  const plan = getPricingPlan(app.slug);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(
    plan?.recommendedPeriod ?? "yearly",
  );
  const [childCount, setChildCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowsMultipleChildren = FAMILY_APPS.has(app.slug);

  const total = useMemo(() => {
    if (!plan) return null;
    if (app.slug === "earnly") {
      return earnlyTotalPrice(childCount, billingPeriod);
    }
    if (app.slug === "ballr") {
      return ballrTotalPrice(childCount, billingPeriod);
    }
    return getPriceForPeriod(plan, billingPeriod).amount;
  }, [app.slug, billingPeriod, childCount, plan]);

  if (!plan) return null;

  const features = plan.features;
  const checkoutChildCount = allowsMultipleChildren ? childCount : 1;

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const url = await postCheckout({
        planKey: individualAppPlanKey(
          app.slug,
          billingPeriod,
          undefined,
          checkoutChildCount,
        ),
        childCount: checkoutChildCount,
      });
      if (url) globalThis.location.assign(url);
      else setLoading(false);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start checkout. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <section
      id="pricing"
      className="scroll-mt-40 border-y border-neutral-100 bg-[#fefbf6]"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: app.accentColor }}
          >
            Plans &amp; pricing
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Get {app.name}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-neutral-600">
            Choose your plan and subscribe here. Yearly plans include the best
            available value.
          </p>
        </div>

        <div
          className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm"
          style={{ borderTopColor: app.accentColor, borderTopWidth: 4 }}
        >
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ backgroundColor: app.accentColorLight }}
                >
                  <Image
                    src={app.iconPath}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7"
                    aria-hidden
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-950">
                    {app.name}
                  </h3>
                  <p className="text-sm text-neutral-500">Individual app plan</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {features.slice(0, 5).map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-neutral-700"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: app.accentColor }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-5">
              <fieldset>
                <legend className="text-sm font-medium text-neutral-900">
                  Billing
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["monthly", "yearly"] as const).map((period) => {
                    const selected = billingPeriod === period;
                    const price = getPriceForPeriod(plan, period).amount;
                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setBillingPeriod(period)}
                        className={`rounded-xl border px-3 py-3 text-left transition ${
                          selected
                            ? "border-neutral-900 bg-neutral-950 text-white"
                            : "border-neutral-200 text-neutral-900 hover:border-neutral-300"
                        }`}
                        aria-pressed={selected}
                      >
                        <span className="block text-sm font-semibold capitalize">
                          {period}
                        </span>
                        <span
                          className={`mt-1 block text-xs ${
                            selected ? "text-white/75" : "text-neutral-500"
                          }`}
                        >
                          {price == null
                            ? getPriceForPeriod(plan, period).display
                            : `${formatUsd(price)}${
                                FAMILY_APPS.has(app.slug) ? " for 1 child" : ""
                              }`}
                        </span>
                        {period === "yearly" && (
                          <span
                            className={`mt-1 block text-[11px] font-medium ${
                              selected ? "text-emerald-300" : "text-emerald-700"
                            }`}
                          >
                            {plan.yearlyBadge ?? "2 months free"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {allowsMultipleChildren && (
                <label className="block">
                  <span className="text-sm font-medium text-neutral-900">
                    Number of children
                  </span>
                  <select
                    value={childCount}
                    onChange={(event) =>
                      setChildCount(Number(event.target.value))
                    }
                    className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
                  >
                    {Array.from({ length: 6 }, (_, index) => index + 1).map(
                      (count) => (
                        <option key={count} value={count}>
                          {count} {count === 1 ? "child" : "children"}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              )}

              <div className="rounded-2xl bg-neutral-50 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Total
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
                      {total == null
                        ? getPriceForPeriod(plan, billingPeriod).display
                        : formatUsd(total)}
                    </p>
                  </div>
                  {total != null && (
                    <p className="pb-1 text-sm text-neutral-500">
                      / {billingPeriod === "monthly" ? "month" : "year"}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              {plan.availability === "waitlist" ? (
                <Link
                  href={plan.cta.href}
                  className="inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white"
                  style={{ backgroundColor: app.accentColor }}
                >
                  {plan.cta.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                  style={{ backgroundColor: app.accentColor }}
                >
                  {loading
                    ? "Opening secure checkout…"
                    : `Subscribe to ${app.name}`}
                </button>
              )}

              <p className="text-center text-xs leading-relaxed text-neutral-500">
                Secure checkout. You can manage or cancel your plan from your
                Genlyn account.
              </p>
              <p className="text-center text-xs text-neutral-500">
                Want every app?{" "}
                <Link
                  href="/pricing?app=all-access"
                  className="font-medium text-neutral-800 underline underline-offset-2"
                >
                  Compare Genlyn All Access
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
