import type { Metadata } from "next";
import { HubCheckoutForm } from "@/components/hub/HubCheckoutForm";
import { getHubSize, type HubSizeId } from "@/config/hub";

export const metadata: Metadata = {
  title: "Checkout — Genlyn Hub",
  description: "Buy a Genlyn Hub with secure checkout and US shipping.",
};

export default async function GenlynHubCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ size?: string }>;
}) {
  const params = await searchParams;
  const size = (getHubSize(params.size)?.id ?? "15.6") as HubSizeId;
  return <HubCheckoutForm initialSize={size} />;
}
