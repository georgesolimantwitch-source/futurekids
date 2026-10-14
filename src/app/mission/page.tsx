import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { MissionPage } from "@/components/marketing/MissionPage";

const description =
  "Genlyn gives families practical tools for real-world growth — healthier habits, smarter learning, active lives, and money skills.";

export const metadata: Metadata = {
  title: "Our Mission",
  description,
  openGraph: {
    title: `Our Mission | ${brand.companyName}`,
    description,
    url: `${brand.siteUrl}/mission`,
    siteName: brand.companyName,
    type: "website",
  },
  alternates: { canonical: `${brand.siteUrl}/mission` },
};

export default function Page() {
  return <MissionPage />;
}
