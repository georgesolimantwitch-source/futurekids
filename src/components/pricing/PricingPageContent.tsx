"use client";

import { useState } from "react";
import { getPricingPlan, type BillingPeriod } from "@/config/pricing";
import { EcosystemAllAccessHero } from "./EcosystemAllAccessHero";
import { IndividualAppsSection } from "./PricingPlansSection";
import { EcosystemPlanBuilder } from "./EcosystemPlanBuilder";
import { ExistingSubscriberSection } from "./ExistingSubscriberSection";
import { PricingComparison } from "./PricingComparison";
import { PricingFAQ } from "./PricingFAQ";
import { PricingCTA } from "./PricingCTA";
import type { PlanManagementContext } from "@/lib/subscriptions/plan-management";
import type { AppSlug } from "@/config/brand";

export function PricingPageContent({
  planContext,
  initialSelectedPlan,
}: {
  planContext: PlanManagementContext;
  initialSelectedPlan?: string;
}) {
  const recommended =
    initialSelectedPlan &&
    initialSelectedPlan !== "all-access" &&
    initialSelectedPlan !== "scholars"
      ? getPricingPlan(initialSelectedPlan as AppSlug)?.recommendedPeriod
      : undefined;
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(
    recommended ?? "monthly",
  );

  return (
    <>
      <EcosystemAllAccessHero
        planContext={planContext}
        initialSelectedPlan={initialSelectedPlan ?? "scholars"}
      />

      <IndividualAppsSection
        billingPeriod={billingPeriod}
        onBillingChange={setBillingPeriod}
        planContext={planContext}
      />
      <EcosystemPlanBuilder billingPeriod={billingPeriod} />
      <ExistingSubscriberSection />
      <PricingComparison />
      <PricingFAQ />
      <PricingCTA />
    </>
  );
}
