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

export function PricingPageContent() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  return (
    <>
      <EcosystemAllAccessHero />
      <IndividualAppsSection
        billingPeriod={billingPeriod}
        onBillingChange={setBillingPeriod}
      />
      <EcosystemPlanBuilder billingPeriod={billingPeriod} />
      <ExistingSubscriberSection />
      <PricingComparison />
      <PricingFAQ />
      <PricingCTA />
    </>
  );
}
