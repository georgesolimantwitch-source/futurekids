import type { Metadata } from "next";
import { HubPage } from "@/components/marketing/HubPage";

export const metadata: Metadata = {
  title: "Genlyn Hub — Family wall tablet",
  description:
    "Genlyn Hub puts your family calendar, chores, and meals on a beautiful 10.1″ or 15.6″ display. $149 or $199, one-time.",
};

export default function GenlynHubProductPage() {
  return <HubPage />;
}
