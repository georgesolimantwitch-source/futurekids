"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  getPriceForPeriod,
  type BillingPeriod,
  type PricingPlanConfig,
} from "@/config/pricing";
import { getBallrStripePriceId, getTinyPalStripePriceId } from "@/config/stripe";
import { postCheckout } from "@/lib/checkout/client";
import { Button } from "@/components/ui/Button";

interface AppPricingCardProps {
  plan: PricingPlanConfig;
  billingPeriod: BillingPeriod;
}

const appStoreApps = new Set(["earnly", "scholars"]);

function getStripePriceIdForPlan(
  plan: PricingPlanConfig,
  billingPeriod: BillingPeriod,
): string | undefined {
  switch (plan.appId) {
    case "ballr":
      return getBallrStripePriceId(billingPeriod);
    case "tinypal":
      return getTinyPalStripePriceId(billingPeriod);
    default:
      return undefined;
  }
}

export function AppPricingCard({ plan, billingPeriod }: AppPricingCardProps) {
  const [loading, setLoading] = useState(false);
  const price = getPriceForPeriod(plan, billingPeriod);
  const periodLabel = billingPeriod === "monthly" ? "month" : "year";
  const useAppStore = appStoreApps.has(plan.appId);
  const stripePriceId = useAppStore ? undefined : getStripePriceIdForPlan(plan, billingPeriod);
  const canCheckout = Boolean(stripePriceId);

  async function handleSubscribe() {
    if (!stripePriceId) return;

    setLoading(true);
    try {
      const url = await postCheckout({
        priceId: stripePriceId,
        quantity: 1,
        app: plan.appId,
      });
      if (url) globalThis.location.assign(url);
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  return (
    <article
      className="flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-white p-5 opacity-95 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6"
      style={{ borderTopColor: plan.accentColor, borderTopWidth: 3 }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl"
          style={{ backgroundColor: plan.accentColorLight }}
        >
          <Image
            src={plan.iconPath}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 sm:h-7 sm:w-7"
            aria-hidden
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 sm:text-lg">{plan.name}</h3>
          <span className="text-xs text-neutral-500">Individual plan</span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-neutral-600">{plan.description}</p>

      <div className="mt-4">
        <p className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          {price.display}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">
          {plan.appId === "earnly"
            ? `per child / ${periodLabel}`
            : plan.appId === "scholars" && billingPeriod === "yearly"
              ? `All Access · pay 10 mo, get 12`
              : `per ${periodLabel}`}
        </p>
      </div>

      <ul className="mt-4 flex-1 space-y-2">
        {plan.features.slice(0, 4).map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: plan.accentColor }}
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

      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900/80">
        Bundle saves more — see All Access above
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        {useAppStore ? (
          <Button
            href={plan.cta.href}
            external
            size="md"
            accentColor={plan.accentColor}
            className="w-full"
          >
            {plan.cta.label}
          </Button>
        ) : canCheckout ? (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-white transition disabled:opacity-60"
            style={{ backgroundColor: plan.accentColor }}
          >
            {loading ? "Loading…" : `Get ${plan.name}`}
          </button>
        ) : plan.availability === "waitlist" ? (
          <Button
            href={plan.cta.href}
            size="md"
            accentColor={plan.accentColor}
            className="w-full"
          >
            {plan.cta.label}
          </Button>
        ) : (
          <Button
            href={plan.cta.href}
            external={plan.cta.external}
            size="md"
            accentColor={plan.accentColor}
            className="w-full"
          >
            {plan.cta.label}
          </Button>
        )}
        <Link
          href={plan.learnMorePath}
          className="text-center text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70"
          style={{ color: plan.accentColor }}
        >
          Learn More
        </Link>
      </div>
    </article>
  );
}
