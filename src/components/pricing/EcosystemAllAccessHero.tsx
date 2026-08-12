"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { listedApps, type AppSlug } from "@/config/brand";
import {
  allAccessPlanKey,
  individualAppPlanKey,
} from "@/config/checkout-plans";
import {
  ecosystemBundle,
  bundlePrice,
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
  ballrPriceLine,
  ballrPricing,
  clampBallrChildCount,
} from "@/config/ballr-pricing";
import {
  clampTinyPalChildCount,
  tinypalPriceLine,
  tinypalPricing,
} from "@/config/tinypal-pricing";
import {
  clampAllAccessScholarsChildCount,
  clampScholarsChildCount,
  getScholarsTier,
  scholarsTierPrice,
  scholarsTierPriceLine,
  scholarsTierTotalPriceLine,
  scholarsTiers,
  type ScholarsTierId,
} from "@/config/scholars-pricing";
import {
  clampGenerations,
  clampTutorMinutes,
  combinedCreditPrice,
  creditPriceLine,
  scholarsCreditPricing,
  type ScholarsCreditPeriod,
} from "@/config/scholars-credits";
import { getPricingPlan } from "@/config/pricing";
import { postCheckout } from "@/lib/checkout/client";
import { ScholarsCreditBuilder } from "@/components/pricing/ScholarsCreditBuilder";
import {
  activeEntitlementForApp,
  activePlanEntitlements,
  requiredFamilyChildCount,
  type PlanManagementContext,
} from "@/lib/subscriptions/plan-management";
import {
  monthlyAmountFromPlanKey,
  subscribeUpgradeDowngradeLabel,
} from "@/lib/subscriptions/plan-cta";
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
  initialSelectedPlan = "scholars",
}: {
  planContext: PlanManagementContext;
  initialSelectedPlan?: string;
}) {
  const normalizedInitialPlan = planTabs.some(
    (tab) => tab.id === initialSelectedPlan,
  )
    ? (initialSelectedPlan as SelectedPlan)
    : "scholars";
  const initialEntitlement = activeEntitlementForApp(
    planContext,
    normalizedInitialPlan === "all-access"
      ? "futurekids_all_access"
      : normalizedInitialPlan,
  );
  const initialActiveChildCount = requiredFamilyChildCount(
    planContext.children.map((child) => child.earnlyStatus),
    planContext.children.length,
  );
  const familyChildFloor = Math.max(1, initialActiveChildCount);
  const [selectedPlan, setSelectedPlan] =
    useState<SelectedPlan>(normalizedInitialPlan);
  const [scholarsTier, setScholarsTier] = useState<ScholarsTierId>("full");
  const [scholarsGens, setScholarsGens] = useState<number>(
    scholarsCreditPricing.generations.default,
  );
  const [scholarsMins, setScholarsMins] = useState<number>(
    scholarsCreditPricing.tutorMinutes.default,
  );
  const [childCount, setChildCount] = useState(
    initialEntitlement?.child_limit ?? familyChildFloor,
  );
  const [tinypalChildCount, setTinypalChildCount] = useState(() => {
    const match = /_tinypal(\d+)_|_t(\d+)_/.exec(initialEntitlement?.plan_key ?? "");
    if (match) return Number(match[1] ?? match[2]);
    if (
      initialEntitlement?.app_key === "tinypal" &&
      initialEntitlement.child_limit
    ) {
      return initialEntitlement.child_limit;
    }
    return 1;
  });
  const [scholarsChildCount, setScholarsChildCount] = useState(() => {
    const match = /_s(\d+)_/.exec(initialEntitlement?.plan_key ?? "");
    if (match) return Number(match[1]);
    if (
      initialEntitlement?.app_key === "scholars" &&
      initialEntitlement.child_limit
    ) {
      return initialEntitlement.child_limit;
    }
    return 1;
  });
  const [ballrChildCount, setBallrChildCount] = useState(() => {
    const match = /_b(\d+)_/.exec(initialEntitlement?.plan_key ?? "");
    if (match) return Number(match[1]);
    if (
      initialEntitlement?.app_key === "ballr" &&
      initialEntitlement.child_limit
    ) {
      return initialEntitlement.child_limit;
    }
    return 1;
  });
  const [billingPeriod, setBillingPeriod] = useState<EarnlyBillingPeriod>(
    initialEntitlement?.plan_key.endsWith("_yearly") ? "yearly" : "monthly",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [showAllAccessSwitch, setShowAllAccessSwitch] = useState(false);

  const tinypalCount = clampTinyPalChildCount(tinypalChildCount);
  const isBundle = selectedPlan === "all-access";
  const isEarnly = selectedPlan === "earnly";
  const isTinyPal = selectedPlan === "tinypal";
  const isScholars = selectedPlan === "scholars";
  const isBallr = selectedPlan === "ballr";
  const scholarsCount = isBundle
    ? clampAllAccessScholarsChildCount(scholarsChildCount)
    : clampScholarsChildCount(scholarsChildCount);
  const ballrCount = clampBallrChildCount(ballrChildCount);
  const showChildStepper =
    isBundle || isEarnly || isTinyPal || isBallr || isScholars;
  const activeScholarsTier = getScholarsTier(scholarsTier);
  const selectedAppKey =
    selectedPlan === "all-access" ? "futurekids_all_access" : selectedPlan;
  const currentEntitlement = activeEntitlementForApp(
    planContext,
    selectedAppKey,
  );
  const count = clampEarnlyChildCount(
    Math.max(
      childCount,
      (isBundle || isEarnly) && showChildStepper && !currentEntitlement
        ? familyChildFloor
        : 1,
    ),
  );
  const pendingChange = currentEntitlement
    ? planContext.pendingChanges.find(
        (change) => change.entitlement_id === currentEntitlement.id,
      )
    : undefined;
  const activeDirectEntitlements = activePlanEntitlements(planContext).filter(
    (entitlement) => entitlement.app_key !== "futurekids_all_access",
  );
  const stripePlansToConsolidate = activeDirectEntitlements.filter(
    (entitlement) => entitlement.provider === "stripe",
  );
  const applePlansToCancelManually = activeDirectEntitlements.filter(
    (entitlement) => entitlement.provider === "apple",
  );
  const requiredActiveChildCount = Math.min(
    planContext.children.length,
    isTinyPal
      ? tinypalCount
      : isBallr
        ? ballrCount
        : isScholars
          ? scholarsCount
          : count,
  );
  const activeChildCount = planContext.children.filter(
    (child) => child.earnlyStatus === "active",
  ).length;
  const currentChildSelectionComplete =
    activeChildCount >= requiredActiveChildCount;
  const minimumChildCount =
    showChildStepper && !currentEntitlement ? familyChildFloor : 1;

  useEffect(() => {
    if (
      (isBundle || isEarnly) &&
      !currentEntitlement &&
      childCount < familyChildFloor
    ) {
      setChildCount(familyChildFloor);
    }
  }, [
    isBundle,
    isEarnly,
    currentEntitlement,
    childCount,
    familyChildFloor,
  ]);

  const individualPlan =
    !isBundle ? getPricingPlan(selectedPlan as AppSlug) : undefined;

  const checkoutPlanKey = isBundle
    ? allAccessPlanKey(
        count,
        billingPeriod,
        tinypalCount,
        scholarsCount,
        ballrCount,
      )
    : individualAppPlanKey(
        selectedPlan as AppSlug,
        billingPeriod,
        isScholars ? scholarsTier : undefined,
        isTinyPal
          ? tinypalCount
          : isBallr
            ? ballrCount
            : isScholars
              ? scholarsCount
              : count,
      );

  const bundleCreditPeriod: ScholarsCreditPeriod =
    billingPeriod === "yearly" ? "yearly" : "monthly";
  // All Access requires both gens and mins (no 0 / 0, and no zero on either side).
  const bundleCreditGens = Math.max(
    scholarsCreditPricing.generations.step,
    clampGenerations(scholarsGens),
  );
  const bundleCreditMins = Math.max(
    scholarsCreditPricing.tutorMinutes.step,
    clampTutorMinutes(scholarsMins),
  );
  const bundleCreditAmount = isBundle
    ? combinedCreditPrice(
        bundleCreditGens,
        bundleCreditMins,
        bundleCreditPeriod,
      ) * scholarsCount
    : 0;

  const individualTotal =
    billingPeriod === "monthly"
      ? individualMonthlyTotal(
          isBundle
            ? {
                earnly: count,
                tinypal: tinypalCount,
                scholars: scholarsCount,
                ballr: ballrCount,
              }
            : { earnly: count },
          "full",
        )
      : individualYearlyTotal(
          isBundle
            ? {
                earnly: count,
                tinypal: tinypalCount,
                scholars: scholarsCount,
                ballr: ballrCount,
              }
            : { earnly: count },
          "full",
        );
  const savings = isBundle
    ? bundleSavings(
        count,
        billingPeriod,
        tinypalCount,
        scholarsCount,
        ballrCount,
        "full",
      )
    : 0;
  const savingsPct = isBundle
    ? bundleSavingsPercent(
        count,
        billingPeriod,
        tinypalCount,
        scholarsCount,
        ballrCount,
        "full",
      )
    : 0;

  function adjustChildren(delta: number) {
    if (isTinyPal && !isBundle) {
      setTinypalChildCount((current) =>
        Math.max(1, clampTinyPalChildCount(current + delta)),
      );
      return;
    }
    if (isBallr && !isBundle) {
      setBallrChildCount((current) =>
        Math.max(1, clampBallrChildCount(current + delta)),
      );
      return;
    }
    if (isScholars && !isBundle) {
      setScholarsChildCount((current) =>
        Math.max(1, clampScholarsChildCount(current + delta)),
      );
      return;
    }
    setChildCount((current) =>
      Math.max(minimumChildCount, clampEarnlyChildCount(current + delta)),
    );
  }

  function selectPlan(
    plan: SelectedPlan,
    options?: { scholarsTier?: ScholarsTierId },
  ) {
    setSelectedPlan(plan);
    setError(null);
    const entitlement = activeEntitlementForApp(
      planContext,
      plan === "all-access" ? "futurekids_all_access" : plan,
    );
    if (entitlement?.child_limit) {
      setChildCount(
        plan === "all-access" || plan === "earnly"
          ? Math.max(entitlement.child_limit, familyChildFloor)
          : entitlement.child_limit,
      );
    } else if (plan === "all-access" || plan === "earnly") {
      setChildCount(familyChildFloor);
    }
    const tinyMatch = /_tinypal(\d+)_|_t(\d+)_/.exec(entitlement?.plan_key ?? "");
    if (tinyMatch) {
      setTinypalChildCount(Number(tinyMatch[1] ?? tinyMatch[2]));
    } else if (plan === "tinypal") {
      setTinypalChildCount(entitlement?.child_limit ?? 1);
    } else if (plan === "all-access") {
      setTinypalChildCount(1);
    }
    const scholarsMatch = /_s(\d+)_/.exec(entitlement?.plan_key ?? "");
    if (scholarsMatch) {
      setScholarsChildCount(Number(scholarsMatch[1]));
    } else if (plan === "scholars") {
      setScholarsChildCount(entitlement?.child_limit ?? 1);
    } else if (plan === "all-access") {
      setScholarsChildCount(1);
    }
    const ballrMatch = /_b(\d+)_/.exec(entitlement?.plan_key ?? "");
    if (ballrMatch) {
      setBallrChildCount(Number(ballrMatch[1]));
    } else if (plan === "ballr") {
      setBallrChildCount(entitlement?.child_limit ?? 1);
    } else if (plan === "all-access") {
      setBallrChildCount(1);
    }
    if (entitlement) {
      setBillingPeriod(
        entitlement.plan_key.endsWith("_yearly") ? "yearly" : "monthly",
      );
    }
    if (plan === "scholars") {
      setScholarsTier(options?.scholarsTier ?? "full");
    }
    // Keep scholarsTier preference when switching to All Access so parents
    // can choose Full / Tutor / Study Guide without leaving the bundle.
  }

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      if (
        isBundle &&
        !currentEntitlement &&
        activeDirectEntitlements.length > 0
      ) {
        setShowAllAccessSwitch(true);
        setLoading(false);
        return;
      }
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
        ...(showChildStepper
          ? {
              childCount: isTinyPal && !isBundle
                ? tinypalCount
                : isBallr && !isBundle
                  ? ballrCount
                  : isScholars && !isBundle
                    ? scholarsCount
                    : count,
              ...(isBundle
                ? {
                    tinypalChildCount: tinypalCount,
                    scholarsChildCount: scholarsCount,
                    ballrChildCount: ballrCount,
                    scholarsGenerations: bundleCreditGens,
                    scholarsTutorMinutes: bundleCreditMins,
                  }
                : isScholars
                  ? { scholarsTier }
                  : {}),
            }
          : {}),
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
        : current.length < requiredActiveChildCount
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
      const raw = await response.text();
      let result: { error?: string; outcome?: string } = {};
      try {
        result = raw ? (JSON.parse(raw) as typeof result) : {};
      } catch {
        throw new Error(
          response.ok
            ? "Plan change failed"
            : `Plan change failed (${response.status})`,
        );
      }
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

  async function confirmAllAccessSwitch() {
    setLoading(true);
    setError(null);
    try {
      if (stripePlansToConsolidate.length === 0) {
        const url = await postCheckout({
          planKey: checkoutPlanKey,
          childCount: count,
          tinypalChildCount: tinypalCount,
          scholarsChildCount: scholarsCount,
          ballrChildCount: ballrCount,
          scholarsTier,
        });
        if (url) {
          globalThis.location.assign(url);
          return;
        }
        setLoading(false);
        return;
      }

      const requiredCount = Math.min(planContext.children.length, count);
      const activeChildIds = [
        ...planContext.children
          .filter((child) => child.earnlyStatus === "active")
          .map((child) => child.id),
        ...planContext.children.map((child) => child.id),
      ]
        .filter((childId, index, all) => all.indexOf(childId) === index)
        .slice(0, requiredCount);
      const response = await fetch(
        "/api/subscriptions/stripe/switch-all-access",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            targetPlanKey: checkoutPlanKey,
            activeChildIds,
            requestId: crypto.randomUUID(),
          }),
        },
      );
      const raw = await response.text();
      let result: { error?: string; code?: string } = {};
      try {
        result = raw ? (JSON.parse(raw) as typeof result) : {};
      } catch {
        throw new Error(
          response.ok
            ? "Could not switch plans"
            : `Could not switch plans (${response.status})`,
        );
      }
      if (
        !response.ok &&
        result.code === "stripe_subscription_mode_mismatch"
      ) {
        // Existing Ballr/Earnly rows are from the other Stripe mode — start a
        // fresh live All Access checkout instead of consolidating.
        const url = await postCheckout({
          planKey: checkoutPlanKey,
          childCount: count,
          tinypalChildCount: tinypalCount,
          scholarsChildCount: scholarsCount,
          ballrChildCount: ballrCount,
          scholarsGenerations: bundleCreditGens,
          scholarsTutorMinutes: bundleCreditMins,
        });
        if (url) {
          globalThis.location.assign(url);
          return;
        }
      }
      if (!response.ok) throw new Error(result.error ?? "Could not switch plans");
      setShowAllAccessSwitch(false);
      globalThis.location.assign("/account?plan=switch-complete");
    } catch (switchError) {
      setError(
        switchError instanceof Error
          ? switchError.message
          : "Could not switch plans",
      );
      setLoading(false);
    }
  }

  function renderPriceDisplay() {
    const suffix = billingPeriod === "monthly" ? "mo" : "yr";

    if (isBundle) {
      const base = bundlePrice(
        count,
        billingPeriod,
        tinypalCount,
        scholarsCount,
        ballrCount,
        "full",
      );
      const total = Math.round((base + bundleCreditAmount) * 100) / 100;
      return (
        <>
          {savings > 0 && (
            <span className="mb-1.5 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              Save {formatUsd(savings)}/ {suffix} ({savingsPct}% off)
            </span>
          )}
          <p className="text-3xl font-semibold tracking-tight text-[#2a1e12] sm:text-4xl">
            {formatUsd(total)} / {suffix}
          </p>
          {bundleCreditAmount > 0 && (
            <p className="mt-0.5 text-xs text-[#8a735a] sm:text-sm">
              Includes Scholars AI{" "}
              {creditPriceLine(bundleCreditAmount, bundleCreditPeriod)}
            </p>
          )}
          {savings > 0 ? (
            <p className="mt-0.5 text-xs text-[#8a735a] line-through sm:text-sm">
              {formatUsd(individualTotal)} if purchased separately
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-[#8a735a] sm:text-sm">
              {bundleValueLine(count, tinypalCount, scholarsCount, ballrCount)}
            </p>
          )}
        </>
      );
    }

    if (isEarnly) {
      return (
        <>
          <p className="text-4xl font-semibold tracking-tight text-[#2a1e12]">
            {earnlyPriceLine(count, billingPeriod).replace("month", "mo").replace("year", "yr")}
          </p>
          <p className="mt-1 text-sm text-[#8a735a]">
            {earnlyUnitPriceLine(billingPeriod).replace("month", "mo").replace("year", "yr")}
          </p>
        </>
      );
    }

    if (isTinyPal) {
      return (
        <>
          <p className="text-4xl font-semibold tracking-tight text-[#2a1e12]">
            {tinypalPriceLine(tinypalCount, billingPeriod)
              .replace("month", "mo")
              .replace("year", "yr")}
          </p>
          <p className="mt-1 text-sm text-[#8a735a]">
            ${tinypalPricing.firstChildMonthly.toFixed(2)} first child · +$
            {tinypalPricing.additionalChildMonthly.toFixed(2)} each additional
            {billingPeriod === "yearly" ? " · pay 10 mo, get 12" : ""}
          </p>
        </>
      );
    }

    if (isScholars) {
      return (
        <>
          <p className="text-4xl font-semibold tracking-tight text-[#2a1e12]">
            {scholarsTierTotalPriceLine(scholarsTier, scholarsCount, billingPeriod)}
          </p>
          <p className="mt-1 text-sm text-[#8a735a]">
            {activeScholarsTier.name}
            {` · $${scholarsTierPrice(activeScholarsTier, "monthly").toFixed(2)} per child`}
            {billingPeriod === "yearly" ? " · pay 10 mo, get 12" : ""}
          </p>
        </>
      );
    }

    if (isBallr) {
      return (
        <>
          <p className="text-4xl font-semibold tracking-tight text-[#2a1e12]">
            {ballrPriceLine(ballrCount, billingPeriod)
              .replace("month", "mo")
              .replace("year", "yr")}
          </p>
          <p className="mt-1 text-sm text-[#8a735a]">
            ${ballrPricing.firstChildMonthly.toFixed(2)} first child · +$
            {ballrPricing.additionalChildMonthly.toFixed(2)} each additional
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
          <p className="text-4xl font-semibold tracking-tight text-[#2a1e12]">{price.display}</p>
          <p className="mt-1 text-sm text-[#8a735a]">per {suffix}</p>
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
      ? "#059669"
      : individualPlan?.accentColor ?? listedApps.find((a) => a.slug === selectedPlan)?.accentColor ?? "#2a1e12";

    return (
      <ul
        className={
          isBundle
            ? "mt-3 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2"
            : "mt-6 space-y-2"
        }
      >
        {items.map((item) => (
          <li
            key={item}
            className={`flex items-center gap-2 text-[#5b4a37] ${
              isBundle ? "text-xs" : "text-sm"
            }`}
          >
            <svg
              className={`shrink-0 ${isBundle ? "h-3.5 w-3.5" : "h-4 w-4"}`}
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

  const isViewingCurrentPlan =
    Boolean(currentEntitlement) &&
    currentEntitlement!.plan_key === checkoutPlanKey;

  const hasExistingPlan = planContext.entitlements.some((entitlement) =>
    ["active", "trialing", "grace_period", "canceled"].includes(
      entitlement.status,
    ),
  );

  const selectedDisplayTotal = isBundle
    ? bundlePrice(
        count,
        billingPeriod,
        tinypalCount,
        scholarsCount,
        ballrCount,
        "full",
      ) + bundleCreditAmount
    : null;

  const selectedMonthly = (() => {
    if (isBundle && selectedDisplayTotal != null) {
      return billingPeriod === "yearly"
        ? selectedDisplayTotal / 12
        : selectedDisplayTotal;
    }
    if (isEarnly) {
      const line = earnlyPriceLine(count, billingPeriod);
      const amount = Number(line.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(amount)) return monthlyAmountFromPlanKey(checkoutPlanKey);
      return billingPeriod === "yearly" ? amount / 12 : amount;
    }
    return monthlyAmountFromPlanKey(checkoutPlanKey);
  })();

  const currentMonthly = currentEntitlement
    ? monthlyAmountFromPlanKey(currentEntitlement.plan_key)
    : null;

  const changeVerb = subscribeUpgradeDowngradeLabel({
    hasExistingPlan,
    isCurrentSelection: isViewingCurrentPlan && currentChildSelectionComplete,
    selectedMonthly,
    currentMonthly,
  });

  const ctaLabel =
    isViewingCurrentPlan && !currentChildSelectionComplete
      ? "Manage Active Children"
      : changeVerb;

  return (
    <>
    <section id="top" className="paper-bg relative overflow-hidden border-b border-neutral-200/80 text-[#2a1e12]">
      <div className="paper-vignette pointer-events-none absolute inset-0" aria-hidden />

      <div
        className={`relative mx-auto max-w-4xl px-4 ${
          isBundle
            ? "py-6 sm:px-6 sm:py-8 lg:px-8"
            : "py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        }`}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c0873c]">
            {isScholars ? "Scholars Notes" : "Recommended"}
          </p>
          <h1
            className={`font-display mt-2 font-semibold tracking-tight text-[#2a1e12] ${
              isBundle || isScholars
                ? "text-2xl sm:text-3xl"
                : "mt-3 text-3xl sm:text-4xl lg:text-5xl"
            }`}
          >
            {isScholars ? "Plans & Pricing" : ecosystemBundle.productName}
          </h1>
          <p
            className={`mx-auto text-[#5b4a37] ${
              isBundle || isScholars
                ? "mt-1.5 max-w-lg text-sm sm:text-base"
                : "mt-3 max-w-xl text-base sm:text-lg"
            }`}
          >
            {isScholars
              ? "Build your AI plan with generations and tutor minutes."
              : isBundle
                ? ecosystemBundle.tagline
                : ecosystemBundle.description}
          </p>
        </div>

        <p className={`${isBundle ? "mt-4" : "mt-6"} text-center text-xs text-[#8a735a]`}>
          Choose a plan
        </p>
        <div
          className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:mt-3 sm:gap-3"
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
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  selected
                    ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                    : "border-neutral-200/80 bg-white/80 text-[#5b4a37] shadow-sm hover:border-neutral-300 hover:bg-white"
                }`}
              >
                {tab.id === "all-access" ? (
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      selected ? "bg-white text-neutral-900" : "bg-[#fefbf6] text-[#5b4a37]"
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
          className={`mx-auto overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-lg ${
            isScholars
              ? "mt-6 max-w-2xl p-5 sm:p-7"
              : isBundle
                ? "mt-4 max-w-lg p-4 sm:p-5"
                : "mt-10 max-w-md p-6 sm:p-8"
          }`}
          role="tabpanel"
        >
          {isScholars ? (
            <ScholarsCreditBuilder
              embedded
              hasExistingPlan={planContext.entitlements.some((entitlement) =>
                ["active", "trialing", "grace_period", "canceled"].includes(
                  entitlement.status,
                ),
              )}
            />
          ) : (
          <>
          {isViewingCurrentPlan && currentEntitlement && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Current plan
              </p>
              <p className="mt-1 text-sm text-[#2a1e12]">
                {currentEntitlement.plan_key.replaceAll("_", " ")}
                {currentEntitlement.child_limit
                  ? ` · ${currentEntitlement.child_limit} ${
                      currentEntitlement.child_limit === 1 ? "child" : "children"
                    }`
                  : ""}
              </p>
              {currentEntitlement.child_limit && (
                <p className="mt-1 text-xs text-emerald-800/80">
                  {activeChildCount} active child{" "}
                  {activeChildCount === 1 ? "profile" : "profiles"}
                  {!currentChildSelectionComplete
                    ? ` · select ${requiredActiveChildCount} to use this plan`
                    : ""}
                </p>
              )}
              {pendingChange && (
                <div className="mt-3 border-t border-emerald-200 pt-3 text-xs text-emerald-900">
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
          {currentEntitlement && !isViewingCurrentPlan && (
            <div className="mb-5 rounded-2xl border border-neutral-200 bg-[#fefbf6] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8a735a]">
                Your current plan
              </p>
              <p className="mt-1 text-sm text-[#2a1e12]">
                {currentEntitlement.plan_key.replaceAll("_", " ")}
                {currentEntitlement.child_limit
                  ? ` · ${currentEntitlement.child_limit} ${
                      currentEntitlement.child_limit === 1 ? "child" : "children"
                    }`
                  : ""}
              </p>
              <p className="mt-1 text-xs text-[#8a735a]">
                Showing a different child count below. Set it to{" "}
                {currentEntitlement.child_limit ?? "your plan"} to view your
                current plan.
              </p>
            </div>
          )}
          {!isBundle && individualPlan && (
            <div className="mb-6 flex items-center gap-3 border-b border-neutral-200 pb-5">
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
                <p className="text-xs uppercase tracking-wider text-[#8a735a]">Individual plan</p>
                <p className="text-lg font-semibold text-[#2a1e12]">{individualPlan.name}</p>
              </div>
            </div>
          )}

          {/* Individual-app child stepper — Scholars kids handled under tier grid */}
          {showChildStepper && !isBundle && !isScholars && (
            <div>
              <label className="text-sm font-medium text-[#2a1e12]">
                {isTinyPal
                  ? "Children on TinyPal"
                  : isBallr
                    ? "Children on Ballr"
                    : "Children on your plan"}
              </label>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-neutral-200 bg-[#fefbf6] px-4 py-3">
                <button
                  type="button"
                  onClick={() => adjustChildren(-1)}
                  disabled={
                    isTinyPal
                      ? tinypalCount <= 1
                      : isBallr
                        ? ballrCount <= 1
                        : count <= minimumChildCount
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-medium text-[#2a1e12] shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-50 disabled:opacity-40"
                  aria-label="Fewer children"
                >
                  −
                </button>
                <div className="min-w-[3rem] text-center">
                  <span className="block text-2xl font-semibold tabular-nums text-[#2a1e12]">
                    {isTinyPal ? tinypalCount : isBallr ? ballrCount : count}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => adjustChildren(1)}
                  disabled={
                    (isTinyPal ? tinypalCount : isBallr ? ballrCount : count) >= 6
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-medium text-[#2a1e12] shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-50 disabled:opacity-40"
                  aria-label="More children"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-[#8a735a]">
                {isTinyPal
                  ? `$${tinypalPricing.firstChildMonthly.toFixed(2)}/mo for 1 child · +$${tinypalPricing.additionalChildMonthly.toFixed(2)}/mo per extra · up to 6`
                  : isBallr
                    ? `$${ballrPricing.firstChildMonthly.toFixed(2)}/mo for 1 child · +$${ballrPricing.additionalChildMonthly.toFixed(2)}/mo per extra · up to 6`
                    : `$1.99/mo or $19.90/yr per child · up to 6 children · yearly includes 2 months free`}
              </p>
              {!currentEntitlement &&
                familyChildFloor > 1 &&
                isEarnly && (
                <p className="mt-2 text-center text-xs font-medium text-amber-800">
                  Your family currently has {familyChildFloor} active children, so
                  this plan must cover all {familyChildFloor}.
                </p>
              )}
            </div>
          )}

          <div
            className={
              showChildStepper || isScholars || isBundle
                ? isBundle
                  ? "mt-3"
                  : "mt-6"
                : ""
            }
          >
            <BillingToggle value={billingPeriod} onChange={setBillingPeriod} className="w-full max-w-none" />
          </div>

          <div className={`${isBundle ? "mt-3" : "mt-6"} text-center`}>
            {renderPriceDisplay()}
          </div>

          {/* Scholars Notes: 3 plan options in a compact row under the price */}
          {isScholars && (
            <div className="mt-6">
              <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-[#8a735a]">
                Choose a Scholars plan
              </p>
              <div
                className="grid grid-cols-3 gap-2"
                role="radiogroup"
                aria-label="Scholars plan tier"
              >
                {scholarsTiers.map((tier) => {
                  const selected = scholarsTier === tier.id;
                  // Unit price on cards so Tutor/Study Guide clearly show $9.99
                  const price = scholarsTierPriceLine(tier, billingPeriod);
                  const shortName =
                    tier.id === "full"
                      ? "Full"
                      : tier.id === "tutor"
                        ? "Tutor"
                        : "Study Guide";

                  return (
                    <button
                      key={tier.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setScholarsTier(tier.id)}
                      className={`rounded-2xl border px-2.5 py-3 text-left transition sm:px-3 ${
                        selected
                          ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200"
                          : "border-neutral-200 bg-[#fefbf6] hover:border-neutral-300"
                      }`}
                    >
                      <p className="text-xs font-semibold text-[#2a1e12] sm:text-sm">
                        {shortName}
                      </p>
                      <p
                        className={`mt-1 text-sm font-semibold tabular-nums sm:text-base ${
                          selected ? "text-[#2a1e12]" : "text-[#5b4a37]"
                        }`}
                      >
                        {price}
                      </p>
                      <p className="mt-1 hidden text-[10px] leading-snug text-[#8a735a] sm:block">
                        {tier.id === "full"
                          ? "Everything included"
                          : tier.id === "tutor"
                            ? "AI voice tutor"
                            : "Guides & quizzes"}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-2xl border border-neutral-200 bg-[#fefbf6] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#2a1e12]">Children</p>
                    <p className="text-[11px] text-[#8a735a]">
                      +
                      {formatUsd(
                        scholarsTierPrice(activeScholarsTier, "monthly"),
                      )}
                      /mo each child
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustChildren(-1)}
                      disabled={scholarsCount <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg text-[#2a1e12] shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-50 disabled:opacity-40"
                      aria-label="Fewer Scholars children"
                    >
                      −
                    </button>
                    <span className="min-w-[1.75rem] text-center text-xl font-semibold tabular-nums text-[#2a1e12]">
                      {scholarsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustChildren(1)}
                      disabled={scholarsCount >= 6}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg text-[#2a1e12] shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-50 disabled:opacity-40"
                      aria-label="More Scholars children"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Access: compact per-app seat dropdowns */}
          {isBundle && (
            <div className="mt-3">
              <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wider text-[#8a735a]">
                Kids per app · first seat included
              </p>
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-[#fefbf6]">
                {(
                  [
                    {
                      key: "earnly",
                      label: "Earnly",
                      value: count,
                      hint: `+${formatUsd(ecosystemBundle.monthlyPerExtraChild)}/extra`,
                      min: minimumChildCount,
                      max: 6,
                      onChange: (next: number) =>
                        setChildCount(clampEarnlyChildCount(next)),
                    },
                    {
                      key: "ballr",
                      label: "Ballr",
                      value: ballrCount,
                      hint: `+${formatUsd(ecosystemBundle.monthlyPerExtraBallrChild)}/extra`,
                      min: 1,
                      max: 6,
                      onChange: (next: number) =>
                        setBallrChildCount(clampBallrChildCount(next)),
                    },
                  ] as const
                ).map((seat, index) => (
                  <div
                    key={seat.key}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                      index > 0 ? "border-t border-neutral-200/80" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#2a1e12]">{seat.label}</p>
                      <p className="text-[10px] tabular-nums text-[#8a735a]">
                        {seat.hint}
                      </p>
                    </div>
                    <label className="shrink-0">
                      <span className="sr-only">{seat.label} kids</span>
                      <select
                        value={seat.value}
                        onChange={(e) => seat.onChange(Number(e.target.value))}
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-semibold tabular-nums text-[#2a1e12] outline-none focus:border-neutral-400"
                      >
                        {Array.from(
                          { length: seat.max - seat.min + 1 },
                          (_, i) => seat.min + i,
                        ).map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? "kid" : "kids"}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}

                <div className="flex flex-col gap-2 border-t border-neutral-200/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#2a1e12]">Scholars</p>
                    <p className="text-[10px] tabular-nums text-[#8a735a]">
                      +
                      {creditPriceLine(bundleCreditAmount, bundleCreditPeriod)}
                      {scholarsCount > 1
                        ? ` · ${scholarsCount} seats`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
                    <label>
                      <span className="sr-only">Scholars kids</span>
                      <select
                        value={scholarsCount}
                        onChange={(e) =>
                          setScholarsChildCount(
                            clampAllAccessScholarsChildCount(
                              Number(e.target.value),
                            ),
                          )
                        }
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-semibold tabular-nums text-[#2a1e12] outline-none focus:border-neutral-400"
                      >
                        {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? "kid" : "kids"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="sr-only">Scholars generations</span>
                      <select
                        value={bundleCreditGens}
                        onChange={(e) =>
                          setScholarsGens(
                            Math.max(
                              scholarsCreditPricing.generations.step,
                              clampGenerations(Number(e.target.value)),
                            ),
                          )
                        }
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-semibold tabular-nums text-[#2a1e12] outline-none focus:border-neutral-400"
                      >
                        {Array.from({ length: 12 }, (_, i) => (i + 1) * 5).map(
                          (n) => (
                            <option key={n} value={n}>
                              {n} generations
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <label>
                      <span className="sr-only">Scholars tutor minutes</span>
                      <select
                        value={bundleCreditMins}
                        onChange={(e) =>
                          setScholarsMins(
                            Math.max(
                              scholarsCreditPricing.tutorMinutes.step,
                              clampTutorMinutes(Number(e.target.value)),
                            ),
                          )
                        }
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-semibold tabular-nums text-[#2a1e12] outline-none focus:border-neutral-400"
                      >
                        {Array.from({ length: 6 }, (_, i) => (i + 1) * 30).map(
                          (n) => (
                            <option key={n} value={n}>
                              {n} min
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {renderFeatures()}

          {!isBundle && individualPlan && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              All Access includes every app — often the better deal for families using more than one.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={
              loading ||
              (isViewingCurrentPlan && currentChildSelectionComplete) ||
              Boolean(pendingChange)
            }
            className={`flex w-full items-center justify-center rounded-2xl bg-[#0071e3] px-6 text-base font-semibold text-white shadow-lg transition hover:bg-[#0077ed] disabled:opacity-60 ${
              isBundle ? "mt-3 py-3" : "mt-6 py-4"
            }`}
          >
            {loading ? "Redirecting…" : ctaLabel}
          </button>
          <p className={`${isBundle ? "mt-1.5" : "mt-3"} text-center text-xs text-[#8a735a]`}>
            Secure checkout · Cancel anytime
          </p>
          </>
          )}
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
                selectedChildIds.length !== requiredActiveChildCount
              }
              className="flex-1 rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Saving…"
                : requiredActiveChildCount < (currentEntitlement.child_limit ?? requiredActiveChildCount)
                  ? "Schedule downgrade"
                  : "Confirm change"}
            </button>
          </div>
        </div>
      </div>
    )}
    {showAllAccessSwitch && (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="switch-all-access-title"
      >
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 text-neutral-900 shadow-2xl sm:p-8">
          <h2 id="switch-all-access-title" className="text-xl font-semibold">
            Switch everything to All Access
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Your website subscriptions will be consolidated into one All Access
            plan. Stripe will prorate the switch so you are not left paying for
            duplicate website plans.
          </p>
          <div className="mt-5 space-y-2">
            {stripePlansToConsolidate.map((entitlement) => (
              <div
                key={entitlement.id}
                className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm"
              >
                <span className="font-medium capitalize">
                  {entitlement.app_key.replaceAll("_", " ")}
                </span>
                <span className="text-emerald-700">Consolidated automatically</span>
              </div>
            ))}
            {applePlansToCancelManually.map((entitlement) => (
              <div
                key={entitlement.id}
                className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950"
              >
                <p className="font-medium capitalize">
                  {entitlement.app_key.replaceAll("_", " ")} through Apple
                </p>
                <p className="mt-1 text-xs">
                  Apple does not allow websites to cancel App Store subscriptions.
                  Cancel this separately in App Store subscriptions to avoid renewal.
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-neutral-500">
            All Access will cover {count} {count === 1 ? "child" : "children"} on
            Earnly and unlock every included app immediately.
          </p>
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setShowAllAccessSwitch(false)}
              disabled={loading}
              className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 font-medium"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={confirmAllAccessSwitch}
              disabled={loading}
              className="flex-1 rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Switching…" : "Confirm switch"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
