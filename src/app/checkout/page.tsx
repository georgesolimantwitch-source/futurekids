import type { Metadata } from "next";
import { Suspense } from "react";
import { SubscriptionCheckout } from "@/components/checkout/SubscriptionCheckout";

export const metadata: Metadata = {
  title: "Checkout — Genlyn",
  description: "Complete your Genlyn subscription with secure on-site checkout.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <SubscriptionCheckout />
    </Suspense>
  );
}
