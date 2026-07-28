import type { AppKey } from "./product-catalog";

export type ProviderName = "apple" | "google" | "stripe";
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

export function statusFromGoogleSubscriptionState(
  subscriptionState: string | null | undefined,
  expiryTime: string | null | undefined,
): EntitlementStatus {
  const expired =
    !!expiryTime && Number.isFinite(Date.parse(expiryTime))
      ? Date.parse(expiryTime) <= Date.now()
      : false;

  switch (subscriptionState) {
    case "SUBSCRIPTION_STATE_ACTIVE":
    case "SUBSCRIPTION_STATE_PENDING":
      return expired ? "expired" : "active";
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      return "grace_period";
    case "SUBSCRIPTION_STATE_ON_HOLD":
      return "past_due";
    case "SUBSCRIPTION_STATE_CANCELED":
      return expired ? "expired" : "canceled";
    case "SUBSCRIPTION_STATE_EXPIRED":
      return "expired";
    case "SUBSCRIPTION_STATE_PAUSED":
      return "canceled";
    default:
      return expired ? "expired" : "incomplete";
  }
}
