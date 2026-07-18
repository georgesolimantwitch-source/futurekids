export type EcosystemAppId = "earnly" | "scholars" | "ballr" | "tinypal";
export type SubscriptionAppId = EcosystemAppId | "futurekids_all_access";

export type AccountType = "parent" | "individual";

export type EntitlementStatus =
  | "active"
  | "trialing"
  | "grace_period"
  | "past_due"
  | "canceled"
  | "expired"
  | "revoked"
  | "incomplete";

export interface UserEntitlement {
  id: string;
  app_key: SubscriptionAppId;
  plan_key: string;
  provider: "stripe" | "apple" | "google";
  status: EntitlementStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  quantity: number;
  tier_key: string;
  entitlement_rank: number;
  child_limit: number | null;
  limits: Record<string, number | boolean | string>;
  features: Record<string, boolean>;
  provider_subscription_id: string;
  provider_product_id: string | null;
  provider_price_id: string | null;
  environment: string | null;
  auto_renew_status: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface EffectiveAppAccess {
  hasAccess: boolean;
  appKey: EcosystemAppId;
  planKey: string | null;
  tierKey: string;
  features: Record<string, boolean>;
  limits: Record<string, number | boolean | string>;
  childLimit: number | null;
  provider: "stripe" | "apple" | null;
  status: EntitlementStatus | null;
  currentPeriodEnd: string | null;
  manageWith: "stripe" | "app_store" | null;
}

export type EcosystemSubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export interface EcosystemProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  account_type: AccountType | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EcosystemFamily {
  id: string;
  family_name: string;
  owner_id: string;
  created_at: string;
}

export interface EcosystemFamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: "parent" | "child";
  joined_at: string;
}

export interface EcosystemSubscription {
  id: string;
  user_id: string;
  app_name: EcosystemAppId;
  subscription_status: EcosystemSubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  provider: string | null;
  billing_interval: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  updated_at: string | null;
}

export interface EcosystemAppAccess {
  id: string;
  user_id: string;
  app_name: EcosystemAppId;
  has_access: boolean;
  access_source: string | null;
  subscription_id: string | null;
  expires_at: string | null;
  last_login: string | null;
  updated_at: string | null;
}

export interface EcosystemAccount {
  user_id: string;
  profile: EcosystemProfile | null;
  families: EcosystemFamily[];
  family_members: EcosystemFamilyMember[];
  subscriptions: EcosystemSubscription[];
  app_access: EcosystemAppAccess[];
  entitlements: UserEntitlement[];
  effective_access?: EffectiveAppAccess[];
  tinypal_parent_profile_exists?: boolean;
}
