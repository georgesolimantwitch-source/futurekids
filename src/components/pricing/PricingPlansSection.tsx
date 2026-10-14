"use client";

import {
  billingOptions,
  pricingHero,
  pricingPlans,
  type BillingPeriod,
} from "@/config/pricing";
import { getSiteApp } from "@/config/site";
import { AppPricingCard } from "./AppPricingCard";
import {
  activeEntitlementForApp,
  type PlanManagementContext,
} from "@/lib/subscriptions/plan-management";

interface BillingToggleProps {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  className?: string;
}

export function BillingToggle({ value, onChange, className = "" }: BillingToggleProps) {
  return (
    <div
      className={`inline-flex w-full max-w-xs rounded-full border border-neutral-200 bg-white p-1 shadow-sm sm:w-auto sm:max-w-sm ${className}`}
      role="radiogroup"
      aria-label="Billing period"
    >
      {billingOptions.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-5 sm:py-2.5 ${
              selected
                ? "bg-neutral-900 text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {option.label}
            {option.badge && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  selected
                    ? "bg-white/20 text-white"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface PricingPlansSectionProps {
  billingPeriod: BillingPeriod;
  onBillingChange: (period: BillingPeriod) => void;
  planContext: PlanManagementContext;
}

/** Individual apps — secondary section below All Access */
export function IndividualAppsSection({
  billingPeriod,
  onBillingChange,
  planContext,
}: PricingPlansSectionProps) {
  return (
    <section id="individual-apps" className="scroll-mt-24 border-y border-ink/[0.05] bg-[#f7f8fc]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Compact hero */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
              {pricingHero.eyebrow}
            </p>
            <h2 className="font-display mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
              {pricingHero.headline}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {pricingHero.supportingText}
            </p>
            <p className="mt-2 text-xs text-neutral-500">{pricingHero.pricingNotice}</p>
          </div>
          <div className="flex shrink-0 justify-center lg:justify-end">
            <BillingToggle value={billingPeriod} onChange={onBillingChange} />
          </div>
        </div>

        {/* Plans — immediately below */}
        <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          {pricingPlans.map((plan) => {
            const site = getSiteApp(plan.appId);
            return (
            <AppPricingCard
              key={plan.appId}
              plan={site ? { ...plan, accentColor: site.color, accentColorLight: site.colorSoft } : plan}
              billingPeriod={billingPeriod}
              currentEntitlement={activeEntitlementForApp(planContext, plan.appId)}
              hasExistingPlan={planContext.entitlements.some((entitlement) =>
                ["active", "trialing", "grace_period", "canceled"].includes(
                  entitlement.status,
                ),
              )}
            />
            );
          })}
        </div>
      </div>
    </section>
  );
}
