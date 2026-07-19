"use client";

import Image from "next/image";
import { useState } from "react";
import { apps, type AppSlug } from "@/config/brand";
import {
  allAccessPlanKey,
  individualAppPlanKey,
} from "@/config/checkout-plans";
import {
  ecosystemBundle,
  bundlePriceLine,
  bundleSavings,
  bundleSavingsPercent,
  bundleValueLine,
  formatUsd,
  individualMonthlyTotal,
  individualYearlyTotal,
} from "@/config/ecosystem-bundle";
import {
  clampEarnlyChildCount,
  earnlyPriceLine,
  earnlyUnitPriceLine,
  type EarnlyBillingPeriod,
} from "@/config/earnly-pricing";
import {
  getScholarsTier,
  scholarsTierPriceLine,
  scholarsTiers,
  type ScholarsTierId,
} from "@/config/scholars-pricing";
import { getPricingPlan } from "@/config/pricing";
import { postCheckout } from "@/lib/checkout/client";
import {
  activeEntitlementForApp,
  type PlanManagementContext,
} from "@/lib/subscriptions/plan-management";
import { BillingToggle } from "./PricingPlansSection";

type SelectedPlan = "all-access" | AppSlug;

const planTabs: { id: SelectedPlan; label: string; icon?: string }[] = [
  { id: "all-access", label: "All Access" },
  ...ecosystemBundle.includedApps.map((app) => ({
    id: app.slug,
    label: app.name,
    icon: app.icon,
  })),
];

export function EcosystemAllAccessHero({
  planContext,
  initialSelectedPlan = "all-access",
}: {
  planContext: PlanManagementContext;
  initialSelectedPlan?: string;
}) {
  const normalizedInitialPlan = planTabs.some(
    (tab) => tab.id === initialSelectedPlan,
  )
    ? (initialSelectedPlan as SelectedPlan)
    : "all-access";
  const initialEntitlement = activeEntitlementForApp(
    planContext,
    normalizedInitialPlan === "all-access"
      ? "futurekids_all_access"
      : normalizedInitialPlan,
  );
  const [selectedPlan, setSelectedPlan] =
    useState<SelectedPlan>(normalizedInitialPlan);
  const [scholarsTier, setScholarsTier] = useState<ScholarsTierId>("full");
  const [childCount, setChildCount] = useState(
    initialEntitlement?.child_limit ?? 1,
  );
  const [billingPeriod, setBillingPeriod] = useState<EarnlyBillingPeriod>(
    initialEntitlement?.plan_key.endsWith("_yearly") ? "yearly" : "monthly",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);

  const count = clampEarnlyChildCount(childCount);
  const isBundle = selectedPlan === "all-access";
  const isEarnly = selectedPlan === "earnly";
  const isScholars = selectedPlan === "scholars";
  const showChildStepper = isBundle || isEarnly;
  const activeScholarsTier = getScholarsTier(scholarsTier);
  const selectedAppKey =
    selectedPlan === "all-access" ? "futurekids_all_access" : selectedPlan;
  const currentEntitlement = activeEntitlementForApp(
    planContext,
    selectedAppKey,
  );
  const pendingChange = currentEntitlement
    ? planContext.pendingChanges.find(
        (change) => change.entitlement_id === currentEntitlement.id,
      )
    : undefined;
  const requiredActiveChildCount = Math.min(planContext.children.length, count);
  const activeChildCount = planContext.children.filter(
    (child) => child.earnlyStatus === "active",
  ).length;
  const currentChildSelectionComplete =
    activeChildCount >= requiredActiveChildCount;

  const individualPlan =
    !isBundle ? getPricingPlan(selectedPlan as AppSlug) : undefined;

  const checkoutPlanKey = isBundle
    ? allAccessPlanKey(count, billingPeriod)
    : individualAppPlanKey(
        selectedPlan as AppSlug,
        billingPeriod,
        isScholars ? scholarsTier : undefined,
        count,
      );

  const individualTotal =
    billingPeriod === "monthly"
      ? individualMonthlyTotal(count)
      : individualYearlyTotal(count);
  const savings = isBundle ? bundleSavings(count, billingPeriod) : 0;
  const savingsPct = isBundle ? bundleSavingsPercent(count, billingPeriod) : 0;

  function adjustChildren(delta: number) {
    setChildCount((c) => clampEarnlyChildCount(c + delta));
  }

  function selectPlan(plan: SelectedPlan) {
    setSelectedPlan(plan);
    setError(null);
    const entitlement = activeEntitlementForApp(
      planContext,
      plan === "all-access" ? "futurekids_all_access" : plan,
    );
    if (entitlement?.child_limit) {
      setChildCount(entitlement.child_limit);
    } else if (plan === "all-access" || plan === "earnly") {
      setChildCount(1);
    }
    if (entitlement) {
      setBillingPeriod(
        entitlement.plan_key.endsWith("_yearly") ? "yearly" : "monthly",
      );
    }
    if (plan === "scholars") {
      setScholarsTier("full");
    }
  }

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      if (currentEntitlement) {
        if (currentEntitlement.provider === "apple") {
          throw new Error(
            "This subscription is managed through Apple. Change it in App Store subscriptions.",
          );
        }
        if (
          currentEntitlement.plan_key === checkoutPlanKey &&
          currentChildSelectionComplete
        ) {
          throw new Error("This is already your current plan.");
        }
        if (pendingChange) {
          throw new Error("Cancel or update your pending change before choosing another plan.");
        }

        const requiredCount = requiredActiveChildCount;
        const currentlyActive = planContext.children
          .filter((child) => child.earnlyStatus === "active")
          .map((child) => child.id);
        const initial = [
          ...currentlyActive,
          ...planContext.children.map((child) => child.id),
        ]
          .filter((childId, index, all) => all.indexOf(childId) === index)
          .slice(0, requiredCount);
        setSelectedChildIds(initial);
        setShowChildPicker(true);
        setLoading(false);
        return;
      }

      const url = await postCheckout({
        planKey: checkoutPlanKey,
        ...(showChildStepper ? { childCount: count } : {}),
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

  function toggleChild(childId: string) {
    setSelectedChildIds((current) =>
      current.includes(childId)
        ? current.filter((id) => id !== childId)
        : current.length < Math.min(planContext.children.length, count)
          ? [...current, childId]
          : current,
    );
  }

  async function submitPlanChange() {
    if (!currentEntitlement) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/subscriptions/stripe/change-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entitlementId: currentEntitlement.id,
          targetPlanKey: checkoutPlanKey,
          activeChildIds: selectedChildIds,
          requestId: crypto.randomUUID(),
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        outcome?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Plan change failed");
      setShowChildPicker(false);
      globalThis.location.reload();
    } catch (changeError) {
      setError(
        changeError instanceof Error ? changeError.message : "Plan change failed",
      );
      setLoading(false);
    }
  }

  async function cancelPendingChange() {
    if (!pendingChange) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/subscriptions/stripe/change-plan", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ changeId: pendingChange.id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not cancel change");
      globalThis.location.reload();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Could not cancel change",
      );
      setLoading(false);
    }
  }

  function renderPriceDisplay() {
    const suffix = billingPeriod === "monthly" ? "mo" : "yr";

    if (isBundle) {
      return (
        <>
          {savings > 0 && (
            <span className="mb-3 inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
              Save {formatUsd(savings)}/ {suffix} ({savingsPct}% off)
            </span>
          )}
          <p className="text-4xl font-semibold tracking-tight">
            {bundlePriceLine(count, billingPeriod)}
          </p>
          {savings > 0 ? (
            <p className="mt-1 text-sm text-neutral-400 line-through">
              {formatUsd(individualTotal)} if purchased separately
            </p>
          ) : (
            <p className="mt-1 text-sm text-neutral-400">{bundleValueLine(count)}</p>
          )}
        </>
      );
    }

    if (isEarnly) {
      return (
        <>
          <p className="text-4xl font-semibold tracking-tight">
            {earnlyPriceLine(count, billingPeriod).replace("month", "mo").replace("year", "yr")}
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            {earnlyUnitPriceLine(billingPeriod).replace("month", "mo").replace("year", "yr")}
          </p>
        </>
      );
    }

    if (isScholars) {
      return (
        <>
          <p className="text-4xl font-semibold tracking-tight">
            {scholarsTierPriceLine(activeScholarsTier, billingPeriod)}
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            {activeScholarsTier.name}
            {billingPeriod === "yearly" ? " · pay 10 mo, get 12" : ""}
          </p>
        </>
      );
    }

    if (individualPlan) {
      const price =
        billingPeriod === "monthly"
          ? individualPlan.monthlyPrice
          : individualPlan.yearlyPrice;

      return (
        <>
          <p className="text-4xl font-semibold tracking-tight">{price.display}</p>
          <p className="mt-1 text-sm text-neutral-400">per {suffix}</p>
        </>
      );
    }

    return null;
  }

  function renderFeatures() {
    const items = isBundle
      ? ecosystemBundle.highlights
      : isEarnly
        ? getPricingPlan("earnly")?.features ?? []
        : isScholars
          ? activeScholarsTier.features
          : individualPlan?.features.slice(0, 5) ?? [];

    const accent = isBundle
      ? "#34d399"
      : individualPlan?.accentColor ?? apps.find((a) => a.slug === selectedPlan)?.accentColor ?? "#fff";

    return (
      <ul className="mt-6 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-neutral-200">
            <svg
              className="h-4 w-4 shrink-0"
              style={{ color: accent }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  const ctaLabel = currentEntitlement
    ? currentEntitlement.plan_key === checkoutPlanKey
      ? currentChildSelectionComplete
        ? "Current Plan"
        : "Choose Active Children"
      : count < (currentEntitlement.child_limit ?? count) ||
          currentEntitlement.plan_key.endsWith("_monthly") !==
            checkoutPlanKey.endsWith("_monthly")
        ? "Schedule Plan Change"
        : "Upgrade Plan"
    : isBundle
      ? "Get All Access"
      : isScholars
        ? `Get ${activeScholarsTier.name}`
        : `Get ${individualPlan?.name ?? "Plan"}`;

  return (
    <>
    <section id="top" className="relative overflow-hidden border-b border-neutral-100 bg-neutral-950 text-white">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, #6366f1 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 100%, #059669 0%, transparent 45%), radial-gradient(ellipse 50% 35% at 10% 90%, #ea580c 0%, transparent 40%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Recommended
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {ecosystemBundle.productName}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-neutral-300 sm:text-lg">
            {ecosystemBundle.description}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Choose a plan
        </p>
        <div
          className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
          role="tablist"
          aria-label="Select plan"
        >
          {planTabs.map((tab) => {
            const selected = selectedPlan === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => selectPlan(tab.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition ${
                  selected
                    ? "border-white bg-white text-neutral-900 shadow-sm"
                    : "border-white/10 bg-white/5 text-white/90 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                {tab.id === "all-access" ? (
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      selected ? "bg-neutral-900 text-white" : "bg-white/20 text-white"
                    }`}
                    aria-hidden
                  >
                    4
                  </span>
                ) : tab.icon ? (
                  <Image src={tab.icon} alt="" width={20} height={20} className="h-5 w-5" aria-hidden />
                ) : null}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div
          className="mx-auto mt-10 max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          role="tabpanel"
        >
          {currentEntitlement && (
            <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Current plan
              </p>
              <p className="mt-1 text-sm text-white">
                {currentEntitlement.plan_key.replaceAll("_", " ")}
                {currentEntitlement.child_limit
                  ? ` · ${currentEntitlement.child_limit} ${
                      currentEntitlement.child_limit === 1 ? "child" : "children"
                    }`
                  : ""}
              </p>
              {currentEntitlement.child_limit && (
                <p className="mt-1 text-xs text-emerald-100/80">
                  {activeChildCount}{" "}
                  active child profiles
                </p>
              )}
              {pendingChange && (
                <div className="mt-3 border-t border-emerald-300/20 pt-3 text-xs text-emerald-100">
                  <p>
                    Change to {pendingChange.target_child_limit} children on{" "}
                    {new Date(pendingChange.effective_at).toLocaleDateString()}.
                  </p>
                  <button
                    type="button"
                    onClick={cancelPendingChange}
                    disabled={loading}
                    className="mt-2 font-medium underline underline-offset-2"
                  >
                    Cancel pending change
                  </button>
                </div>
              )}
            </div>
          )}
          {!isBundle && individualPlan && (
            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-5">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${individualPlan.accentColor}22` }}
              >
                <Image
                  src={individualPlan.iconPath}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6"
                  aria-hidden
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500">Individual plan</p>
                <p className="text-lg font-semibold">{individualPlan.name}</p>
              </div>
            </div>
          )}

          {isScholars && (
            <div className="mb-6">
              <label className="text-sm font-medium text-white/90">Choose your plan</label>
              <div className="mt-3 space-y-2" role="radiogroup" aria-label="Scholars plan tier">
                {scholarsTiers.map((tier) => {
                  const selected = scholarsTier === tier.id;
                  const price = scholarsTierPriceLine(tier, billingPeriod);

                  return (
                    <button
                      key={tier.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setScholarsTier(tier.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                        selected
                          ? "border-indigo-400/60 bg-indigo-500/15"
                          : "border-white/10 bg-black/20 hover:border-white/20"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-white">{tier.name}</p>
                        <p className="mt-0.5 text-xs text-neutral-400">{tier.description}</p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          selected ? "text-white" : "text-neutral-300"
                        }`}
                      >
                        {price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showChildStepper && (
            <div>
              <label className="text-sm font-medium text-white/90">
                {isBundle ? "Children on Earnly" : "Children on your plan"}
              </label>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <button
                  type="button"
                  onClick={() => adjustChildren(-1)}
                  disabled={count <= 1}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl font-medium transition hover:bg-white/20 disabled:opacity-40"
                  aria-label="Fewer children"
                >
                  −
                </button>
                <span className="min-w-[3rem] text-center text-2xl font-semibold tabular-nums">
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => adjustChildren(1)}
                  disabled={count >= 6}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl font-medium transition hover:bg-white/20 disabled:opacity-40"
                  aria-label="More children"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-neutral-400">
                {isBundle
                  ? `${formatUsd(ecosystemBundle.monthlyBase)}/mo for all apps · +${formatUsd(ecosystemBundle.monthlyPerExtraChild)}/mo per extra child`
                  : `$1.99/mo or $19.90/yr per child · up to 6 children · yearly includes 2 months free`}
              </p>
            </div>
          )}

          <div className={showChildStepper || isScholars ? "mt-6" : ""}>
            <BillingToggle value={billingPeriod} onChange={setBillingPeriod} className="w-full max-w-none" />
          </div>

          <div className="mt-6 text-center">{renderPriceDisplay()}</div>

          {renderFeatures()}

          {!isBundle && individualPlan && (
            <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/80">
              All Access includes every app — often the better deal for families using more than one.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={
              loading ||
              (currentEntitlement?.plan_key === checkoutPlanKey &&
                currentChildSelectionComplete) ||
              Boolean(pendingChange)
            }
            className="mt-6 flex w-full items-center justify-center rounded-2xl bg-white px-6 py-4 text-base font-semibold text-neutral-900 shadow-lg transition hover:bg-neutral-100 disabled:opacity-60"
          >
            {loading ? "Redirecting…" : ctaLabel}
          </button>
          <p className="mt-3 text-center text-xs text-neutral-500">
            Secure checkout · Cancel anytime
          </p>
        </div>
      </div>
    </section>
    {showChildPicker && currentEntitlement && (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-change-title"
      >
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 text-neutral-900 shadow-2xl sm:p-8">
          <h2 id="plan-change-title" className="text-xl font-semibold">
            Choose children who stay active
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Select exactly {Math.min(planContext.children.length, count)}. Profiles,
            wallets, chores, savings, and history are not deleted. Children outside
            the new limit are paused only in Earnly when the change takes effect.
          </p>
          {count < (currentEntitlement.child_limit ?? count) && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Your current {currentEntitlement.child_limit}-child access stays active
              until{" "}
              {currentEntitlement.current_period_end
                ? new Date(currentEntitlement.current_period_end).toLocaleDateString()
                : "your next renewal"}.
            </p>
          )}
          <div className="mt-5 max-h-64 space-y-2 overflow-y-auto">
            {planContext.children.map((child) => {
              const selected = selectedChildIds.includes(child.id);
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => toggleChild(child.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                    selected
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white"
                  }`}
                  aria-pressed={selected}
                >
                  <span className="font-medium">{child.name}</span>
                  <span className="text-sm">{selected ? "Stays active" : "Paused"}</span>
                </button>
              );
            })}
          </div>
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setShowChildPicker(false)}
              disabled={loading}
              className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 font-medium"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={submitPlanChange}
              disabled={
                loading ||
                selectedChildIds.length !==
                  Math.min(planContext.children.length, count)
              }
              className="flex-1 rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Saving…"
                : count < (currentEntitlement.child_limit ?? count)
                  ? "Schedule downgrade"
                  : "Confirm change"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
