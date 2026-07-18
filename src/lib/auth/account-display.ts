import type { EcosystemAccount, EcosystemAppId, EcosystemSubscription } from "@/lib/auth/types";

export function formatAccountDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function subscriptionForApp(account: EcosystemAccount, appId: EcosystemAppId) {
  return account.subscriptions.find((s) => s.app_name === appId);
}

export function accessForApp(account: EcosystemAccount, appId: EcosystemAppId) {
  return account.app_access.find((a) => a.app_name === appId);
}

export function appAccessStatus(
  subscription: EcosystemSubscription | undefined,
  hasAccess: boolean,
): "active" | "inactive" | "coming_soon" {
  if (subscription?.subscription_status === "active" || subscription?.subscription_status === "trialing") {
    return "active";
  }
  if (hasAccess) return "active";
  return "inactive";
}

export function statusLabel(status: EcosystemSubscription["subscription_status"] | undefined) {
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past due";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    default:
      return "Not subscribed";
  }
}

export function statusTone(
  status: EcosystemSubscription["subscription_status"] | undefined,
  hasAccess: boolean,
): "success" | "warning" | "neutral" {
  if (status === "active" || status === "trialing" || hasAccess) return "success";
  if (status === "past_due") return "warning";
  return "neutral";
}

export function billingLabel(subscription: EcosystemSubscription | undefined) {
  if (!subscription) return "No plan";
  if (subscription.billing_interval) {
    return subscription.billing_interval === "year" ? "Yearly" : "Monthly";
  }
  return subscription.provider ?? "Stripe";
}

export function initialsFromName(name: string | null | undefined, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.charAt(0).toUpperCase();
}
