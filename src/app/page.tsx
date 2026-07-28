import type { Metadata } from "next";
import { StudyBoardHero } from "@/components/home/StudyBoardHero";
import { HomeTiles } from "@/components/home/HomeTiles";
import { ParentTrustSection } from "@/components/home/ParentTrustSection";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: {
    absolute: `${brand.productName} — ${brand.tagline}`,
  },
  description: brand.description,
  openGraph: {
    title: `${brand.productName} — ${brand.tagline}`,
    description: brand.description,
    url: brand.siteUrl,
    siteName: brand.productName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.productName} — ${brand.tagline}`,
    description: brand.description,
  },
  alternates: {
    canonical: brand.siteUrl,
  },
};

export default function HomePage() {
  return (
    <>
      <StudyBoardHero />
      <HomeTiles />
      <ParentTrustSection />
    </>
  );
}
