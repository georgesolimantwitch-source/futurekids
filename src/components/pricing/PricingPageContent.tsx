"use client";

import { useState } from "react";
import type { BillingPeriod } from "@/config/pricing";
import { PricingPlansSection } from "./PricingPlansSection";
import { MultiAppSavingsSection } from "./MultiAppSavingsSection";
import { EcosystemPlanBuilder } from "./EcosystemPlanBuilder";
import { ExistingSubscriberSection } from "./ExistingSubscriberSection";
import { PricingComparison } from "./PricingComparison";
import { PricingFAQ } from "./PricingFAQ";
import { PricingCTA } from "./PricingCTA";

export function PricingPageContent() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  return (
    <>
      <PricingPlansSection
        billingPeriod={billingPeriod}
        onBillingChange={setBillingPeriod}
      />
      <MultiAppSavingsSection />
      <EcosystemPlanBuilder billingPeriod={billingPeriod} />
      <ExistingSubscriberSection />
      <PricingComparison />
      <PricingFAQ />
      <PricingCTA />
    </>
  );
}
