import type { Metadata } from "next";
import { HubScreen } from "./HubScreen";

export const metadata: Metadata = {
  title: "Earnly Hub",
  robots: { index: false, follow: false },
};

export default function EarnlyHubPage() {
  return <HubScreen />;
}
