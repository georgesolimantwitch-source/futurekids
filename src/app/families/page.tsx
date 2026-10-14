import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { FamiliesPage } from "@/components/marketing/FamiliesPage";

const description =
  "One Genlyn account for the whole household. Add each child, choose their apps, and help them build real-life skills.";

export const metadata: Metadata = {
  title: "For Families",
  description,
  openGraph: {
    title: `For Families | ${brand.companyName}`,
    description,
    url: `${brand.siteUrl}/families`,
    siteName: brand.companyName,
    type: "website",
  },
  alternates: { canonical: `${brand.siteUrl}/families` },
};

export default function Page() {
  return <FamiliesPage />;
}
