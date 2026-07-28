"use client";

import Image from "next/image";
import { useState } from "react";
import {
  calculateEcosystemTotals,
  ecosystemBuilderCopy,
  getBuilderStatusMessage,
  getPriceForPeriod,
  pricingPlans,
  type AppSlug,
  type BillingPeriod,
} from "@/config/pricing";
import { PricingSummary } from "./PricingSummary";

interface EcosystemPlanBuilderProps {
  billingPeriod: BillingPeriod;
}

export function EcosystemPlanBuilder({ billingPeriod }: EcosystemPlanBuilderProps) {
  const [selected, setSelected] = useState<AppSlug[]>([]);

  const toggleApp = (appId: AppSlug) => {
    setSelected((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId],
    );
  };

  const totals = calculateEcosystemTotals(selected, billingPeriod);
  const statusMessage = getBuilderStatusMessage(selected.length);
  const selectedPlans = pricingPlans.filter((p) => selected.includes(p.appId));

  return (
    <section id="plan-builder" className="scroll-mt-24 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            {ecosystemBuilderCopy.title}
          </h2>
          <p className="mt-3 text-base text-neutral-600 sm:text-lg">
            {ecosystemBuilderCopy.description}
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="grid gap-3 sm:grid-cols-2">
            {pricingPlans.map((plan) => {
              const isSelected = selected.includes(plan.appId);
              return (
                <button
                  key={plan.appId}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleApp(plan.appId)}
                  className={`flex min-h-[72px] items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "shadow-md"
                      : "border-neutral-100 bg-[#fefbf6] hover:border-neutral-200 hover:bg-white"
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: plan.accentColorLight,
                          boxShadow: `0 0 0 2px ${plan.accentColor}`,
                        }
                      : undefined
                  }
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isSelected ? "white" : plan.accentColorLight }}
                  >
                    <Image
                      src={plan.iconPath}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-neutral-900">{plan.name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {getPriceForPeriod(plan, billingPeriod).display}
                    </p>
                  </div>
                  {isSelected && (
                    <svg
                      className="h-5 w-5 shrink-0"
                      style={{ color: plan.accentColor }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <PricingSummary
            selectedCount={selected.length}
            selectedPlans={selectedPlans}
            totals={totals}
            statusMessage={statusMessage}
            billingPeriod={billingPeriod}
          />
        </div>
      </div>
    </section>
  );
}
