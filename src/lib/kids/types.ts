export const KID_APPS = ["earnly", "scholars", "ballr", "tinypal"] as const;

export type KidAppKey = (typeof KID_APPS)[number];

export type KidAppAccessStatus =
  | "active"
  | "paused_by_plan"
  | "paused_by_parent"
  | "revoked"
  | "unavailable";

export interface KidAppAccess {
  app_key: KidAppKey;
  status: KidAppAccessStatus;
  parent_has_entitlement: boolean;
}

export interface KidSummary {
  id: string;
  username: string | null;
  display_name: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  account_status: string | null;
  is_active: boolean;
  apps: KidAppAccess[];
}

export function isKidAppKey(value: string): value is KidAppKey {
  return (KID_APPS as readonly string[]).includes(value);
}
