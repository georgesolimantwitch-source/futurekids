import type { AppKey } from "./product-catalog";

export type ProviderName = "apple" | "stripe";
export type EntitlementStatus =
  | "active"
  | "trialing"
  | "grace_period"
  | "past_due"
  | "canceled"
  | "expired"
  | "revoked"
  | "incomplete";

export interface VerifiedSubscription {
  userId: string;
  appKey: AppKey;
  planKey: string;
  provider: ProviderName;
  providerCustomerId: string | null;
  providerSubscriptionId: string;
  providerProductId: string | null;
  providerPriceId: string | null;
  status: EntitlementStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  quantity: number;
  tierKey: string;
  entitlementRank: number;
  childLimit: number | null;
  limits: Record<string, number | boolean | string>;
  features: Record<string, boolean>;
  currentTransactionId: string | null;
  environment: string | null;
  autoRenewStatus: boolean | null;
}

export function statusFromStripe(
  status: string,
  currentPeriodEnd: string | null,
): EntitlementStatus {
  if (currentPeriodEnd && Date.parse(currentPeriodEnd) <= Date.now()) return "expired";
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due") return "grace_period";
  if (status === "canceled") return "canceled";
  if (status === "unpaid" || status === "paused") return "expired";
  return "incomplete";
}

export function statusFromAppleTransaction(input: {
  expiresDate?: number;
  revocationDate?: number;
  isUpgraded?: boolean;
  notificationStatus?: number;
}): EntitlementStatus {
  if (input.revocationDate || input.isUpgraded) return "revoked";
  if (input.notificationStatus === 4) return "grace_period";
  if (input.notificationStatus === 3) return "past_due";
  if (input.notificationStatus === 5) return "revoked";
  if (input.notificationStatus === 2) return "expired";
  if (!input.expiresDate || input.expiresDate <= Date.now()) return "expired";
  return "active";
}
