import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brand, getAppBySlug, isAppListed, listedApps } from "@/config/brand";
import { getSiteApp } from "@/config/site";
import { AppPage } from "@/components/marketing/AppPage";

interface AppPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return listedApps.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({
  params,
}: AppPageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = getAppBySlug(slug);
  if (!app || !isAppListed(app)) return { title: "App Not Found" };

  const title = `${app.name} — ${app.positioning}`;
  const url = `${brand.siteUrl}${app.learnMorePath}`;

  return {
    title: app.name,
    description: app.description,
    openGraph: {
      title,
      description: app.description,
      url,
      siteName: brand.companyName,
      type: "website",
      images: [{ url: app.screenshotPath, alt: `${app.name} screenshot` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: app.description,
      images: [app.screenshotPath],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function AppRoute({ params }: AppPageProps) {
  const { slug } = await params;
  const app = getAppBySlug(slug);
  const siteApp = getSiteApp(slug);

  if (!app || !isAppListed(app) || !siteApp) {
    notFound();
  }

  return <AppPage app={siteApp} />;
}
