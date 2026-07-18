import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccountType, EcosystemAccount } from "@/lib/auth/types";
import type { User } from "@supabase/supabase-js";
import { SETUP_PENDING_MESSAGE } from "@/lib/auth/account-view";

function accountNeedsSetup(account: EcosystemAccount | null): boolean {
  return !account?.profile;
}

function accountTypeFromUser(user: User): AccountType {
  const meta = user.user_metadata ?? {};
  const value = meta.account_type ?? meta.ecosystem_role;
  return value === "individual" ? "individual" : "parent";
}

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

export async function getEcosystemAccount(): Promise<EcosystemAccount | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_ecosystem_account");

  if (error || !data) return null;
  return data as EcosystemAccount;
}

async function provisionViaAdmin(user: User) {
  const admin = createAdminClient();
  const fullName = displayNameFromUser(user);
  const accountType = accountTypeFromUser(user);

  const { error } = await admin.rpc("provision_ecosystem_account", {
    p_user_id: user.id,
    p_email: user.email ?? "",
    p_full_name: fullName,
    p_avatar_url: avatarFromUser(user),
    p_role: accountType,
    p_family_name: fullName ? `${fullName}'s Family` : "My Family",
  });

  if (error) throw new Error(error.message);
}

async function provisionViaAuthenticatedRpc() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ensure_my_ecosystem_account");

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No account returned");

  return data as EcosystemAccount;
}

async function markAccountSetupComplete(userId: string) {
  const supabase = await createClient();

  // Preferred path: SECURITY DEFINER RPC (also updates ensure_my_ecosystem_account).
  const { error: rpcError } = await supabase.rpc("complete_my_account_setup");
  if (!rpcError) return;

  // Fallback when RPC is not deployed yet: authenticated update own row (RLS).
  await supabase
    .from("profiles")
    .update({ account_setup_complete: true })
    .eq("id", userId);
}

async function provisionViaFamilyEnsure(user: User) {
  const supabase = await createClient();
  const fullName = displayNameFromUser(user);
  const accountType = accountTypeFromUser(user);

  if (accountType === "parent") {
    await supabase.rpc("ensure_ecosystem_family_for_parent", {
      p_family_name: fullName ? `${fullName}'s Family` : "My Family",
    });
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? "unknown@users.local",
    full_name: fullName,
    avatar_url: avatarFromUser(user),
    account_type: accountType,
    account_setup_complete: true,
  });
}

export async function ensureEcosystemAccountForUser(user: User): Promise<EcosystemAccount | null> {
  try {
    const account = await provisionViaAuthenticatedRpc();
    // ensure_my_ecosystem_account sets the flag; keep an explicit mark for older RPC versions.
    await markAccountSetupComplete(user.id);
    return (await getEcosystemAccount()) ?? account;
  } catch {
    // continue to fallbacks
  }

  try {
    await provisionViaAdmin(user);
    await markAccountSetupComplete(user.id);
    return await getEcosystemAccount();
  } catch {
    // service role may be unavailable in production
  }

  try {
    await provisionViaFamilyEnsure(user);
    await markAccountSetupComplete(user.id);
    return await getEcosystemAccount();
  } catch {
    return null;
  }
}

export async function getOrRepairEcosystemAccount(): Promise<{
  account: EcosystemAccount | null;
  user: User | null;
  repaired: boolean;
  error: string | null;
}> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { account: null, user: null, repaired: false, error: "Authentication required" };
  }

  let account = await getEcosystemAccount();
  if (!accountNeedsSetup(account)) {
    return { account, user, repaired: false, error: null };
  }

  account = await ensureEcosystemAccountForUser(user);

  if (!accountNeedsSetup(account)) {
    return { account, user, repaired: true, error: null };
  }

  return {
    account,
    user,
    repaired: false,
    error: SETUP_PENDING_MESSAGE,
  };
}

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export { SETUP_PENDING_MESSAGE };
