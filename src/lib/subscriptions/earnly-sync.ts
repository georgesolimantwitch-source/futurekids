import { createAdminClient } from "@/lib/supabase/admin";

export async function syncEarnlyChildAccess(userId: string): Promise<void> {
  const bridgeUrl = process.env.EARNLY_BRIDGE_URL;
  const syncSecret = process.env.ENTITLEMENT_SYNC_SECRET;
  if (!bridgeUrl || !syncSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Earnly entitlement sync is not configured");
    }
    return;
  }

  const admin = createAdminClient();
  const { data: family } = await admin
    .from("families")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  if (!family) return;

  const { data: access, error } = await admin
    .from("family_child_app_access")
    .select("child_id, status")
    .eq("family_id", family.id)
    .eq("app_key", "earnly");
  if (error) throw error;

  const activeChildIds = (access ?? [])
    .filter((child) => child.status === "active")
    .map((child) => String(child.child_id).toLowerCase());
  const response = await fetch(bridgeUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-entitlement-sync-secret": syncSecret,
    },
    body: JSON.stringify({
      action: "sync_family_child_access",
      parent_id: userId,
      selected_child_ids: activeChildIds,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Earnly entitlement sync returned ${response.status}`);
  }
}
