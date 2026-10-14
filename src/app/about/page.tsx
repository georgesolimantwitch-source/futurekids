import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { aboutPageMeta } from "@/config/about";
import { AboutPage as AboutContent } from "@/components/marketing/AboutPage";

export const metadata: Metadata = {
  title: aboutPageMeta.title,
  description: aboutPageMeta.description,
  openGraph: {
    title: `${aboutPageMeta.title} | ${brand.companyName}`,
    description: aboutPageMeta.description,
    url: `${brand.siteUrl}/about`,
    siteName: brand.companyName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${aboutPageMeta.title} | ${brand.companyName}`,
    description: aboutPageMeta.description,
  },
  alternates: {
    canonical: `${brand.siteUrl}/about`,
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
