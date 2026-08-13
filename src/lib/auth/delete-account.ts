import type { User } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { listKidsForParent, removeKidForParent } from "@/lib/kids/portal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isMissingStripeCustomerError } from "@/lib/subscriptions/stripe";

export function userHasPasswordAuth(user: User): boolean {
  const identities = user.identities ?? [];
  if (identities.some((identity) => identity.provider === "email")) {
    return true;
  }
  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes("email");
}

export async function verifyAccountPassword(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { ok: false, error: "Auth is not configured." };
  }

  const client = createSupabaseClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { ok: false, error: "Incorrect password. Please try again." };
  }

  return { ok: true };
}

async function cancelStripeSubscriptionsForCustomer(
  stripeCustomerId: string | null | undefined,
): Promise<void> {
  if (!stripeCustomerId) return;
  if (!process.env.STRIPE_SECRET_KEY) return;

  try {
    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 100,
    });

    await Promise.all(
      subscriptions.data.map(async (subscription) => {
        if (subscription.status === "canceled") return;
        try {
          await stripe.subscriptions.cancel(subscription.id);
        } catch {
          // Best-effort — account deletion should continue.
        }
      }),
    );
  } catch (error) {
    if (!isMissingStripeCustomerError(error)) {
      // Ignore Stripe outages during account wipe; auth/user rows still delete.
    }
  }
}

/**
 * Permanently deletes a parent/individual Genlyn account and related family data.
 */
export async function deleteEcosystemAccount(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, stripe_customer_id, account_type")
    .eq("id", userId)
    .maybeSingle();

  await cancelStripeSubscriptionsForCustomer(
    (profile?.stripe_customer_id as string | null | undefined) ?? null,
  );

  // Remove child accounts first (separate auth users).
  try {
    const kids = await listKidsForParent(userId);
    for (const kid of kids) {
      try {
        await removeKidForParent({ parentId: userId, childId: kid.id });
      } catch {
        // Continue deleting remaining kids / parent.
      }
    }
  } catch {
    // Parent may have no family yet.
  }

  const { data: ownedFamilies } = await admin
    .from("families")
    .select("id")
    .eq("owner_id", userId);

  const familyIds = (ownedFamilies ?? []).map((row) => row.id as string);

  if (familyIds.length > 0) {
    await admin.from("family_members").delete().in("family_id", familyIds);
    await admin.from("families").delete().in("id", familyIds);
  }

  await admin.from("family_members").delete().eq("user_id", userId);

  // Clear remaining profile-linked rows that can block auth deletion.
  const { data: entitlements } = await admin
    .from("user_entitlements")
    .select("id")
    .eq("user_id", userId);
  const entitlementIds = (entitlements ?? []).map((row) => row.id as string);
  if (entitlementIds.length > 0) {
    await admin
      .from("user_entitlement_children")
      .delete()
      .in("entitlement_id", entitlementIds);
  }

  await Promise.allSettled([
    admin.from("user_entitlements").delete().eq("user_id", userId),
    admin.from("app_access").delete().eq("user_id", userId),
    admin.from("provider_subscriptions").delete().eq("user_id", userId),
    admin.from("profiles").delete().eq("id", userId),
  ]);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(error.message || "Could not delete this account.");
  }
}
