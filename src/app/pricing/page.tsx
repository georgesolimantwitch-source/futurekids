import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { pricingPageMeta } from "@/config/pricing";
import { PricingPageContent } from "@/components/pricing/PricingPageContent";
import { createClient } from "@/lib/supabase/server";
import {
  EMPTY_PLAN_MANAGEMENT_CONTEXT,
  type PlanManagementContext,
} from "@/lib/subscriptions/plan-management";

export const metadata: Metadata = {
  title: pricingPageMeta.title,
  description: pricingPageMeta.description,
  openGraph: {
    title: `${pricingPageMeta.title} | ${brand.companyName}`,
    description: pricingPageMeta.description,
    url: `${brand.siteUrl}/pricing`,
    siteName: brand.companyName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${pricingPageMeta.title} | ${brand.companyName}`,
    description: pricingPageMeta.description,
  },
  alternates: {
    canonical: `${brand.siteUrl}/pricing`,
  },
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const requestedApp = (await searchParams).app;
  const initialSelectedPlan = [
    "all-access",
    "earnly",
    "scholars",
    "ballr",
    "fresher",
  ].includes(requestedApp ?? "")
    ? requestedApp
    : "all-access";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let planContext = EMPTY_PLAN_MANAGEMENT_CONTEXT;
  if (user) {
    const { data, error } = await supabase.rpc("get_plan_management_context");
    if (!error && data) {
      planContext = data as PlanManagementContext;
    }
  }

  return (
    <PricingPageContent
      planContext={planContext}
      initialSelectedPlan={initialSelectedPlan}
    />
  );
}
