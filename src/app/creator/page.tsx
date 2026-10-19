import type { Metadata } from "next";
import { Suspense } from "react";
import { CreatorDashboard } from "@/components/creators/CreatorDashboard";

export const metadata: Metadata = {
  title: "Creator program — Genlyn",
  description:
    "Join the Genlyn Creator Program. Share your code and earn 20% of Hub and subscription sales.",
};

export default function CreatorPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <CreatorDashboard />
    </Suspense>
  );
}
