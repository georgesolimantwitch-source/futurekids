import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { AppShowcase } from "@/components/home/AppShowcase";
import { EcosystemSection } from "@/components/home/EcosystemSection";
import { ParentTrustSection } from "@/components/home/ParentTrustSection";
import { CtaSection } from "@/components/home/CtaSection";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: {
    absolute: `${brand.companyName} — One Ecosystem for Growing Up`,
  },
  description: brand.description,
  openGraph: {
    title: `${brand.companyName} — ${brand.tagline}`,
    description: brand.description,
    url: brand.siteUrl,
    siteName: brand.companyName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.companyName} — ${brand.tagline}`,
    description: brand.description,
  },
  alternates: {
    canonical: brand.siteUrl,
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <AppShowcase />
      <EcosystemSection />
      <ParentTrustSection />
      <CtaSection />
    </>
  );
}
