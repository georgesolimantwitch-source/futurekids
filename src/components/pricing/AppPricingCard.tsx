"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  getPriceForPeriod,
  type BillingPeriod,
  type PricingPlanConfig,
} from "@/config/pricing";
import { individualAppPlanKey } from "@/config/checkout-plans";
import { postCheckout } from "@/lib/checkout/client";
import { Button } from "@/components/ui/Button";
import type { PlanManagementEntitlement } from "@/lib/subscriptions/plan-management";
import {
  monthlyAmountFromPlanKey,
  subscribeUpgradeDowngradeLabel,
} from "@/lib/subscriptions/plan-cta";

interface AppPricingCardProps {
  plan: PricingPlanConfig;
  billingPeriod: BillingPeriod;
  currentEntitlement?: PlanManagementEntitlement;
  hasExistingPlan?: boolean;
}

export function AppPricingCard({
  plan,
  billingPeriod,
  currentEntitlement,
  hasExistingPlan = Boolean(currentEntitlement),
}: AppPricingCardProps) {
  const [loading, setLoading] = useState(false);
  const price = getPriceForPeriod(plan, billingPeriod);
  const periodLabel = billingPeriod === "monthly" ? "month" : "year";
  const planKey = individualAppPlanKey(plan.appId, billingPeriod);
  const selectedMonthly =
    price.amount == null
      ? monthlyAmountFromPlanKey(planKey)
      : billingPeriod === "yearly"
        ? price.amount / 12
        : price.amount;
  const currentMonthly = currentEntitlement
    ? monthlyAmountFromPlanKey(currentEntitlement.plan_key)
    : null;
  const isCurrent =
    Boolean(currentEntitlement) && currentEntitlement!.plan_key === planKey;
  const ctaLabel = subscribeUpgradeDowngradeLabel({
    hasExistingPlan,
    isCurrentSelection: isCurrent,
    selectedMonthly: Number.isFinite(selectedMonthly) ? selectedMonthly : null,
    currentMonthly,
  });

  async function handleSubscribe() {
    setLoading(true);
    try {
      const url = await postCheckout({
        planKey: individualAppPlanKey(plan.appId, billingPeriod),
        ...(plan.appId === "earnly" ? { childCount: 1 } : {}),
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

      {currentEntitlement && (
        <p className="mt-4 rounded-full bg-emerald-50 px-3 py-1.5 text-center text-xs font-semibold text-emerald-700">
          Current plan · {currentEntitlement.provider === "apple" ? "Apple" : "Website"}
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-neutral-600">{plan.description}</p>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
            {price.display}
          </p>
          {billingPeriod === "yearly" && plan.yearlyBadge ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: plan.accentColor }}
            >
              {plan.yearlyBadge}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">
          {plan.appId === "earnly"
            ? `per child / ${periodLabel}`
            : plan.appId === "scholars" && billingPeriod === "yearly"
              ? `All Access · pay 10 mo, get 12`
              : plan.appId === "fresher" && billingPeriod === "yearly"
                ? "Recommended · best value"
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
        {plan.availability === "waitlist" ? (
          <Button
            href={plan.cta.href}
            size="md"
            accentColor={plan.accentColor}
            className="w-full"
          >
            {plan.cta.label}
          </Button>
        ) : isCurrent ? (
          <Link
            href={plan.appId === "earnly" ? "#top" : "/account"}
            className="inline-flex w-full items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-900"
          >
            Current Plan
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-white transition disabled:opacity-60"
            style={{ backgroundColor: plan.accentColor }}
          >
            {loading ? "Loading…" : ctaLabel}
          </button>
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
