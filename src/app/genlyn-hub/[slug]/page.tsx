import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHubSizeBySlug, hubSizes } from "@/config/hub";
import { HubProductDetailPage } from "@/components/marketing/HubProductDetailPage";

export function generateStaticParams() {
  return hubSizes.map((size) => ({ slug: size.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const size = getHubSizeBySlug(slug);
  if (!size) return { title: "Genlyn Hub" };
  return {
    title: `${size.label} — Genlyn Hub`,
    description: `${size.blurb} ${size.priceDisplay} one-time. See photos, specs, and buy online.`,
  };
}

export default async function GenlynHubSizePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const size = getHubSizeBySlug(slug);
  if (!size) notFound();
  return <HubProductDetailPage size={size} />;
}
