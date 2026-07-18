export type EcosystemAppId = "earnly" | "scholars" | "ballr" | "tinypal";

export type AccountType = "parent" | "individual";

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
  tinypal_parent_profile_exists?: boolean;
}
