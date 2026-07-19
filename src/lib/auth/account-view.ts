import type {
  AccountType,
  EcosystemAccount,
  EcosystemAppId,
  UserEntitlement,
} from "@/lib/auth/types";
import type { User } from "@supabase/supabase-js";

export const REQUIRED_APP_IDS: EcosystemAppId[] = ["earnly", "scholars", "ballr", "tinypal"];

export const SETUP_PENDING_MESSAGE =
  "Your account was created, but setup needs one more moment. Please try again.";

function displayNameFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const name =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    [meta.first_name, meta.last_name].filter(Boolean).join(" ");
  return name?.trim() || user.email?.split("@")[0] || null;
}

function avatarFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  return (
    (meta.avatar_url as string | undefined) ??
    (meta.picture as string | undefined) ??
    null
  );
}

function accountTypeFromUser(user: User): AccountType {
  const meta = user.user_metadata ?? {};
  const value = meta.account_type ?? meta.ecosystem_role;
  return value === "individual" ? "individual" : "parent";
}

export function buildAccountViewModel(
  account: EcosystemAccount | null,
  user: User,
): EcosystemAccount {
  if (account?.profile) {
    return {
      ...account,
      entitlements: account.entitlements ?? [],
      effective_access: account.effective_access ?? [],
    };
  }

  const fullName = displayNameFromUser(user);
  const now = new Date().toISOString();

  return {
    user_id: user.id,
    profile: {
      id: user.id,
      email: user.email ?? "",
      full_name: fullName,
      avatar_url: avatarFromUser(user),
      account_type: accountTypeFromUser(user),
      stripe_customer_id: null,
      created_at: user.created_at ?? now,
      updated_at: now,
    },
    families: account?.families ?? [],
    family_members: account?.family_members ?? [],
    subscriptions: account?.subscriptions ?? [],
    app_access: account?.app_access ?? [],
    entitlements: account?.entitlements ?? [],
    effective_access: account?.effective_access ?? [],
  };
}

export function entitlementIsActive(entitlement: UserEntitlement): boolean {
  if (
    !["active", "trialing", "grace_period", "canceled"].includes(
      entitlement.status,
    )
  ) {
    return false;
  }
  return (
    entitlement.current_period_end === null ||
    Date.parse(entitlement.current_period_end) > Date.now()
  );
}

export function entitlementForApp(
  account: EcosystemAccount,
  appId: EcosystemAppId,
): UserEntitlement | undefined {
  return account.entitlements
    .filter(
      (entitlement) =>
        entitlementIsActive(entitlement) &&
        (entitlement.app_key === appId ||
          entitlement.app_key === "futurekids_all_access"),
    )
    .sort(
      (a, b) =>
        b.entitlement_rank - a.entitlement_rank ||
        (b.child_limit ?? 0) - (a.child_limit ?? 0),
    )[0];
}

export function countActivePlans(account: EcosystemAccount): number {
  return account.entitlements.filter(entitlementIsActive).length;
}

export function countActiveApps(account: EcosystemAccount): number {
  return REQUIRED_APP_IDS.filter((appId) => entitlementForApp(account, appId)).length;
}
