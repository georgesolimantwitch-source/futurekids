"use client";

import { useState } from "react";
import type { BillingPeriod } from "@/config/pricing";
import { EcosystemAllAccessHero } from "./EcosystemAllAccessHero";
import { IndividualAppsSection } from "./PricingPlansSection";
import { EcosystemPlanBuilder } from "./EcosystemPlanBuilder";
import { ExistingSubscriberSection } from "./ExistingSubscriberSection";
import { PricingComparison } from "./PricingComparison";
import { PricingFAQ } from "./PricingFAQ";
import { PricingCTA } from "./PricingCTA";
import type { PlanManagementContext } from "@/lib/subscriptions/plan-management";

export function PricingPageContent({
  planContext,
  initialSelectedPlan,
}: {
  planContext: PlanManagementContext;
  initialSelectedPlan?: string;
}) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  return (
    <>
      <EcosystemAllAccessHero
        planContext={planContext}
        initialSelectedPlan={initialSelectedPlan}
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
