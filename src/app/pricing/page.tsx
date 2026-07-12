import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { pricingPageMeta } from "@/config/pricing";
import { PricingPageContent } from "@/components/pricing/PricingPageContent";

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

export default function PricingPage() {
  return <PricingPageContent />;
}
