import { createAdminClient } from "@/lib/supabase/admin";
import {
  KID_APPS,
  isKidAppKey,
  type KidAppAccess,
  type KidAppAccessStatus,
  type KidAppKey,
  type KidSummary,
} from "@/lib/kids/types";

export {
  KID_APPS,
  isKidAppKey,
  type KidAppAccess,
  type KidAppAccessStatus,
  type KidAppKey,
  type KidSummary,
};

const ACTIVE_ENTITLEMENT_STATUSES = new Set([
  "active",
  "trialing",
  "grace_period",
]);

export function isStrongChildPassword(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

export function syntheticChildEmail(userId: string): string {
  return `child.${userId.replace(/-/g, "")}@users.futurekids.internal`;
}

export async function parentHasAppEntitlement(
  parentId: string,
  appKey: KidAppKey,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_entitlements")
    .select("id, app_key, status")
    .eq("user_id", parentId)
    .in("app_key", [appKey, "futurekids_all_access"]);

  return (data ?? []).some(
    (row) =>
      ACTIVE_ENTITLEMENT_STATUSES.has(String(row.status)) &&
      (row.app_key === appKey || row.app_key === "futurekids_all_access"),
  );
}

export async function getScholarsSeatLimit(parentId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_entitlements")
    .select("app_key, status, current_period_end, child_limit, limits")
    .eq("user_id", parentId)
    .in("app_key", ["scholars", "futurekids_all_access"]);

  const now = Date.now();
  let limit = 0;
  for (const row of data ?? []) {
    if (!ACTIVE_ENTITLEMENT_STATUSES.has(String(row.status))) continue;
    if (
      row.current_period_end &&
      Date.parse(String(row.current_period_end)) <= now
    ) {
      continue;
    }
    const limits = (row.limits ?? {}) as Record<string, unknown>;
    const fromLimits = Number(limits.scholarsChildLimit);
    const fromChild = Number(row.child_limit);
    const seat =
      Number.isFinite(fromLimits) && fromLimits >= 1
        ? Math.trunc(fromLimits)
        : row.app_key === "scholars" && Number.isFinite(fromChild) && fromChild >= 1
          ? Math.trunc(fromChild)
          : row.app_key === "futurekids_all_access"
            ? 1
            : 0;
    limit = Math.max(limit, Math.min(5, seat));
  }
  return Math.max(1, limit || 1);
}

export async function getTinyPalSeatLimit(parentId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_entitlements")
    .select("app_key, status, current_period_end, child_limit, limits")
    .eq("user_id", parentId)
    .in("app_key", ["tinypal", "futurekids_all_access"]);

  const now = Date.now();
  let limit = 0;
  for (const row of data ?? []) {
    if (!ACTIVE_ENTITLEMENT_STATUSES.has(String(row.status))) continue;
    if (
      row.current_period_end &&
      Date.parse(String(row.current_period_end)) <= now
    ) {
      continue;
    }
    const limits = (row.limits ?? {}) as Record<string, unknown>;
    const fromLimits = Number(limits.tinypalChildLimit);
    const fromChild = Number(row.child_limit);
    const seat =
      Number.isFinite(fromLimits) && fromLimits >= 1
        ? Math.trunc(fromLimits)
        : row.app_key === "tinypal" && Number.isFinite(fromChild) && fromChild >= 1
          ? Math.trunc(fromChild)
          : row.app_key === "futurekids_all_access"
            ? 1
            : 0;
    limit = Math.max(limit, Math.min(6, seat));
  }
  return limit;
}

export async function listActiveTinyPalChildIds(
  parentId: string,
): Promise<string[]> {
  const admin = createAdminClient();
  const { data: families } = await admin
    .from("families")
    .select("id")
    .eq("owner_id", parentId)
    .limit(1);
  const familyId = families?.[0]?.id as string | undefined;
  if (!familyId) return [];
  const { data } = await admin
    .from("family_child_app_access")
    .select("child_id")
    .eq("family_id", familyId)
    .eq("app_key", "tinypal")
    .eq("status", "active");
  return (data ?? []).map((row) => String(row.child_id).toLowerCase());
}

export async function listActiveScholarsChildIds(
  parentId: string,
): Promise<string[]> {
  const admin = createAdminClient();
  const { data: families } = await admin
    .from("families")
    .select("id")
    .eq("owner_id", parentId)
    .limit(1);
  const familyId = families?.[0]?.id as string | undefined;
  if (!familyId) return [];
  const { data } = await admin
    .from("family_child_app_access")
    .select("child_id")
    .eq("family_id", familyId)
    .eq("app_key", "scholars")
    .eq("status", "active");
  return (data ?? []).map((row) => String(row.child_id).toLowerCase());
}

export async function parentOwnsChild(
  parentId: string,
  childId: string,
): Promise<boolean> {
  const admin = createAdminClient();

  const { data: parentMemberships } = await admin
    .from("family_members")
    .select("family_id")
    .eq("user_id", parentId)
    .eq("role", "parent");
  const familyIds = (parentMemberships ?? []).map((r) => r.family_id as string);
  if (familyIds.length > 0) {
    const { data: childInFamily } = await admin
      .from("family_members")
      .select("id")
      .eq("user_id", childId)
      .eq("role", "child")
      .in("family_id", familyIds)
      .limit(1);
    if (childInFamily && childInFamily.length > 0) return true;
  }

  const { data: child } = await admin
    .from("child_profiles")
    .select("id, created_by_parent_id")
    .eq("id", childId)
    .maybeSingle();
  if (child?.created_by_parent_id === parentId) return true;

  const { data: ownedFamilies } = await admin
    .from("families")
    .select("id")
    .eq("owner_id", parentId);
  const ownedIds = (ownedFamilies ?? []).map((f) => f.id as string);
  if (ownedIds.length > 0) {
    const { data: link } = await admin
      .from("family_members")
      .select("id")
      .eq("user_id", childId)
      .in("family_id", ownedIds)
      .limit(1);
    if (link && link.length > 0) return true;
  }
  return false;
}

function isSyntheticEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  const value = email.trim().toLowerCase();
  return (
    value.endsWith("@users.local") ||
    value.endsWith("@users.futurekids.internal") ||
    value === "unknown@users.local"
  );
}

export async function ensureParentFamily(parentId: string, email: string | null) {
  const admin = createAdminClient();

  const [{ data: existingProfile }, authUserResult] = await Promise.all([
    admin.from("profiles").select("email, account_type").eq("id", parentId).maybeSingle(),
    admin.auth.admin.getUserById(parentId),
  ]);

  const authEmail = authUserResult.data.user?.email?.trim() || null;
  const existingEmail = (existingProfile?.email as string | null)?.trim() || null;
  const resolvedEmail =
    (!isSyntheticEmail(email) ? email?.trim() : null) ||
    (!isSyntheticEmail(authEmail) ? authEmail : null) ||
    (!isSyntheticEmail(existingEmail) ? existingEmail : null) ||
    authEmail ||
    existingEmail ||
    `${parentId}@users.local`;

  // Never clobber a real profile email with a synthetic placeholder.
  if (!existingProfile) {
    await admin.from("profiles").insert({
      id: parentId,
      email: resolvedEmail,
      account_type: "parent",
    });
  } else {
    const patch: { account_type: string; email?: string } = {
      account_type: "parent",
    };
    if (isSyntheticEmail(existingEmail) && !isSyntheticEmail(resolvedEmail)) {
      patch.email = resolvedEmail;
    }
    await admin.from("profiles").update(patch).eq("id", parentId);
  }

  const { data: existingFamilies } = await admin
    .from("families")
    .select("id")
    .eq("owner_id", parentId)
    .order("created_at", { ascending: true })
    .limit(1);

  let familyId = existingFamilies?.[0]?.id as string | undefined;
  if (!familyId) {
    const { data: created, error } = await admin
      .from("families")
      .insert({ owner_id: parentId, family_name: "My Family" })
      .select("id")
      .single();
    if (error || !created?.id) {
      throw new Error("Could not set up your family. Please try again.");
    }
    familyId = created.id;
  }

  await admin.from("family_members").upsert(
    { family_id: familyId, user_id: parentId, role: "parent" },
    { onConflict: "family_id,user_id" },
  );

  return familyId;
}

async function listOwnedChildIds(parentId: string): Promise<string[]> {
  const admin = createAdminClient();
  const childIds = new Set<string>();

  const { data: parentMemberships } = await admin
    .from("family_members")
    .select("family_id")
    .eq("user_id", parentId)
    .eq("role", "parent");
  const familyIds = (parentMemberships ?? []).map((r) => r.family_id as string);
  if (familyIds.length > 0) {
    const { data: kids } = await admin
      .from("family_members")
      .select("user_id")
      .eq("role", "child")
      .in("family_id", familyIds);
    for (const row of kids ?? []) {
      const id = (row.user_id as string | undefined)?.trim().toLowerCase();
      if (id) childIds.add(id);
    }
  }

  const { data: ownedFamilies } = await admin
    .from("families")
    .select("id")
    .eq("owner_id", parentId);
  const ownedIds = (ownedFamilies ?? []).map((f) => f.id as string);
  if (ownedIds.length > 0) {
    const { data: kids } = await admin
      .from("family_members")
      .select("user_id")
      .eq("role", "child")
      .in("family_id", ownedIds);
    for (const row of kids ?? []) {
      const id = (row.user_id as string | undefined)?.trim().toLowerCase();
      if (id) childIds.add(id);
    }
  }

  const { data: created } = await admin
    .from("child_profiles")
    .select("id")
    .eq("created_by_parent_id", parentId);
  for (const row of created ?? []) {
    const id = (row.id as string | undefined)?.trim().toLowerCase();
    if (id) childIds.add(id);
  }

  return Array.from(childIds);
}

export async function listKidsForParent(parentId: string): Promise<KidSummary[]> {
  const admin = createAdminClient();
  const ids = await listOwnedChildIds(parentId);
  if (ids.length === 0) return [];

  const [{ data: profiles }, { data: fkProfiles }, { data: accessRows }, entitlementMap] =
    await Promise.all([
      admin
        .from("child_profiles")
        .select("id, username, display_name, date_of_birth, account_status, is_active")
        .in("id", ids),
      admin.from("profiles").select("id, full_name").in("id", ids),
      admin
        .from("family_child_app_access")
        .select("child_id, app_key, status")
        .in("child_id", ids),
      Promise.all(
        KID_APPS.map(async (app) => [app, await parentHasAppEntitlement(parentId, app)] as const),
      ),
    ]);

  const parentEntitlements = Object.fromEntries(entitlementMap) as Record<
    KidAppKey,
    boolean
  >;

  const fullNameById = new Map(
    (fkProfiles ?? []).map((p) => [
      (p.id as string).trim().toLowerCase(),
      ((p.full_name as string | null) ?? "").trim(),
    ]),
  );

  const accessByChild = new Map<string, Map<string, string>>();
  for (const row of accessRows ?? []) {
    const childId = String(row.child_id).toLowerCase();
    if (!accessByChild.has(childId)) accessByChild.set(childId, new Map());
    accessByChild.get(childId)!.set(String(row.app_key), String(row.status));
  }

  return (profiles ?? []).map((p) => {
    const id = String(p.id).toLowerCase();
    const display =
      ((p.display_name as string | null) ?? "").trim() || fullNameById.get(id) || null;
    const childAccess = accessByChild.get(id) ?? new Map();

    const apps: KidAppAccess[] = KID_APPS.map((app_key) => {
      const parent_has_entitlement = parentEntitlements[app_key];
      const raw = childAccess.get(app_key);
      const is_linked = Boolean(raw && raw !== "revoked");
      let status: KidAppAccessStatus = "unavailable";
      if (!parent_has_entitlement) {
        status = is_linked ? "paused_by_plan" : "unavailable";
      } else if (raw === "active") {
        status = "active";
      } else if (raw === "paused_by_parent") {
        status = "paused_by_parent";
      } else if (raw === "paused_by_plan") {
        status = "paused_by_plan";
      } else if (raw === "revoked") {
        status = "revoked";
      } else {
        status = "paused_by_parent";
      }
      return { app_key, status, parent_has_entitlement, is_linked };
    });

    return {
      id,
      username: ((p.username as string | null) ?? "").trim().toLowerCase() || null,
      display_name: display,
      full_name: fullNameById.get(id) || display,
      date_of_birth: (p.date_of_birth as string | null) ?? null,
      account_status: (p.account_status as string | null) ?? null,
      is_active: p.is_active !== false,
      apps,
    };
  });
}

export async function createKidForParent(input: {
  parentId: string;
  parentEmail: string | null;
  fullName: string;
  username: string;
  password: string;
  dateOfBirth: string;
  avatarColor?: string;
  enabledApps?: KidAppKey[];
}): Promise<KidSummary> {
  const admin = createAdminClient();
  const fullName = input.fullName.trim();
  const username = input.username.trim().toLowerCase();
  const password = input.password;
  const dob = input.dateOfBirth.trim();
  const avatarColor = (input.avatarColor ?? "blue").trim() || "blue";

  if (!fullName || fullName.length < 2) {
    throw new KidApiError(400, "Enter your child's full name.");
  }
  if (!username) throw new KidApiError(400, "Choose a username.");
  if (!isStrongChildPassword(password)) {
    throw new KidApiError(
      400,
      "Password must be at least 8 characters and include a letter and a number.",
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    throw new KidApiError(400, "Enter a valid date of birth.");
  }

  const [validRes, availableRes] = await Promise.all([
    admin.rpc("is_valid_child_username", { p_username: username }),
    admin.rpc("is_child_username_available", { p_username: username }),
  ]);
  if (validRes.data !== true) {
    throw new KidApiError(
      400,
      "Username must be 3–20 characters, start with a letter, and use only letters, numbers, or _.",
    );
  }
  if (availableRes.data !== true) {
    throw new KidApiError(409, "That username is already taken. Try another.");
  }

  const familyId = await ensureParentFamily(input.parentId, input.parentEmail);
  const childId = crypto.randomUUID();
  const email = syntheticChildEmail(childId);

  const { error: createUserErr } = await admin.auth.admin.createUser({
    id: childId,
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      account_type: "child",
      username,
      future_kids_child: true,
    },
    app_metadata: {
      provider: "future_kids_child",
      providers: ["future_kids_child"],
      account_type: "child",
    },
  });
  if (createUserErr) {
    throw new KidApiError(500, "Could not create the child account. Please try again.");
  }

  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: childId,
      email,
      full_name: fullName,
      account_type: "child",
      account_setup_complete: true,
    },
    { onConflict: "id" },
  );
  if (profileErr) {
    await admin.auth.admin.deleteUser(childId);
    throw new KidApiError(500, "Could not create the child profile. Please try again.");
  }

  const { data: credentialHash, error: hashErr } = await admin.rpc(
    "hash_child_credential_secure",
    { p_credential: password },
  );
  if (hashErr || !credentialHash) {
    await admin.auth.admin.deleteUser(childId);
    throw new KidApiError(500, "Could not secure the password. Please try again.");
  }

  const { data: parentProfile } = await admin
    .from("parent_profiles")
    .select("id")
    .eq("id", input.parentId)
    .maybeSingle();

  const { error: childProfileErr } = await admin.from("child_profiles").insert({
    id: childId,
    username,
    display_name: fullName,
    first_name: fullName.split(/\s+/)[0] ?? fullName,
    date_of_birth: dob,
    avatar_color: avatarColor,
    credential_hash: credentialHash,
    child_access_pin_hash: credentialHash,
    account_status: "active",
    is_active: true,
    is_self_signup: false,
    created_by_parent_id: parentProfile?.id ?? null,
    approved_by_parent_id: parentProfile?.id ?? null,
    approved_at: new Date().toISOString(),
  });
  if (childProfileErr) {
    await admin.auth.admin.deleteUser(childId);
    const msg = (childProfileErr.message ?? "").toLowerCase();
    if (msg.includes("username") || msg.includes("unique")) {
      throw new KidApiError(409, "That username is already taken. Try another.");
    }
    throw new KidApiError(500, "Could not finish creating the child account.");
  }

  await admin.from("family_members").upsert(
    { family_id: familyId, user_id: childId, role: "child" },
    { onConflict: "family_id,user_id" },
  );

  // Unlock only the apps the parent chose (or every subscribed app if omitted).
  // Parents manage per-app access from the Kids section on the account page.
  const appsToEnable = input.enabledApps ?? [...KID_APPS];

  for (const app of KID_APPS) {
    const selected = appsToEnable.includes(app);
    let allowed =
      selected && (await parentHasAppEntitlement(input.parentId, app));
    if (app === "tinypal" && allowed) {
      const [seatLimit, activeChildIds] = await Promise.all([
        getTinyPalSeatLimit(input.parentId),
        listActiveTinyPalChildIds(input.parentId),
      ]);
      allowed = activeChildIds.length < seatLimit;
    }
    await admin.from("app_access").upsert(
      {
        user_id: childId,
        app_name: app,
        has_access: allowed,
        access_source: "parent_created",
      },
      { onConflict: "user_id,app_name" },
    );

    if (selected) {
      await admin.from("family_child_app_access").upsert(
        {
          family_id: familyId,
          child_id: childId,
          app_key: app,
          status: allowed ? "active" : "paused_by_plan",
          status_reason: allowed ? "enabled_by_parent" : "subscription_required",
          activated_at: allowed ? new Date().toISOString() : null,
          paused_at: allowed ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "family_id,child_id,app_key" },
      );
    }
  }

  const kids = await listKidsForParent(input.parentId);
  const created = kids.find((k) => k.id === childId);
  if (!created) {
    throw new KidApiError(500, "Child was created but could not be loaded.");
  }
  return created;
}

export async function setKidAppEnabled(input: {
  parentId: string;
  childId: string;
  appKey: KidAppKey;
  enabled: boolean;
  /** When true, skip the active-subscription check (Stripe webhook seat grants). */
  bypassEntitlementCheck?: boolean;
  /** Link the child now as paused_by_plan when the parent is not subscribed. */
  allowPendingPlan?: boolean;
  /** When true, skip Scholars seat-capacity enforcement (Stripe webhook seat grants). */
  bypassSeatLimit?: boolean;
  /** When enabling Scholars at seat capacity, move seat + credits from this child. */
  transferFromChildId?: string;
  /** When locking Scholars, return AI credits to the parent pool (default true). */
  returnCreditsToPool?: boolean;
}): Promise<void> {
  const admin = createAdminClient();
  if (!(await parentOwnsChild(input.parentId, input.childId))) {
    throw new KidApiError(403, "You can only manage children in your family.");
  }

  const hasEntitlement =
    input.bypassEntitlementCheck ||
    (await parentHasAppEntitlement(input.parentId, input.appKey));
  if (input.enabled && !hasEntitlement && !input.allowPendingPlan) {
    throw new KidApiError(
      403,
      `An active ${input.appKey} subscription (or Genlyn All Access) is required to enable this app.`,
    );
  }

  let hasPlanCapacity = true;
  if (
    input.appKey === "tinypal" &&
    input.enabled &&
    hasEntitlement &&
    !input.bypassSeatLimit
  ) {
    const [seatLimit, activeIds] = await Promise.all([
      getTinyPalSeatLimit(input.parentId),
      listActiveTinyPalChildIds(input.parentId),
    ]);
    const alreadyActive = activeIds.includes(input.childId.toLowerCase());
    hasPlanCapacity = alreadyActive || activeIds.length < seatLimit;
    if (!hasPlanCapacity && !input.allowPendingPlan) {
      throw new KidApiError(
        409,
        `All ${seatLimit} TinyPal child seats are in use. Upgrade your plan to add another child.`,
        "TINYPAL_SEAT_FULL",
      );
    }
  }

  if (
    input.appKey === "scholars" &&
    input.enabled &&
    hasEntitlement &&
    !input.bypassSeatLimit
  ) {
    const seatLimit = await getScholarsSeatLimit(input.parentId);
    const activeIds = await listActiveScholarsChildIds(input.parentId);
    const alreadyActive = activeIds.includes(input.childId.toLowerCase());
    if (!alreadyActive && activeIds.length >= seatLimit) {
      const fromId = input.transferFromChildId?.trim().toLowerCase() ?? "";
      if (!fromId || !activeIds.includes(fromId) || fromId === input.childId.toLowerCase()) {
        throw new KidApiError(
          409,
          `All ${seatLimit} Scholars seats are in use. Disable another child (or choose who to transfer from) to free a seat. Credits move with the seat.`,
          "SCHOLARS_SEAT_FULL",
        );
      }
      const { transferScholarsCredits } = await import("@/lib/scholars/credits");
      await transferScholarsCredits({
        parentUserId: input.parentId,
        fromChildId: fromId,
        toChildId: input.childId,
      });
      await setKidAppEnabled({
        parentId: input.parentId,
        childId: fromId,
        appKey: "scholars",
        enabled: false,
        bypassEntitlementCheck: true,
        returnCreditsToPool: false,
      });
    } else if (!alreadyActive) {
      // Pull unassigned parent-pool credits onto this child when unlocking.
      const { transferScholarsCredits, getScholarsCreditBalanceForChild } =
        await import("@/lib/scholars/credits");
      const pool = await getScholarsCreditBalanceForChild(input.parentId);
      if (pool.generations > 0 || pool.tutor_minutes > 0) {
        await transferScholarsCredits({
          parentUserId: input.parentId,
          fromChildId: input.parentId,
          toChildId: input.childId,
        });
      }
    }
  }

  if (
    input.appKey === "scholars" &&
    !input.enabled &&
    !input.bypassSeatLimit &&
    input.returnCreditsToPool !== false
  ) {
    // Return this child's AI credits to the parent pool when locking.
    const { transferScholarsCredits, getScholarsCreditBalanceForChild } =
      await import("@/lib/scholars/credits");
    const bal = await getScholarsCreditBalanceForChild(input.childId);
    if (bal.generations > 0 || bal.tutor_minutes > 0) {
      await transferScholarsCredits({
        parentUserId: input.parentId,
        fromChildId: input.childId,
        toChildId: input.parentId,
      });
    }
  }

  const familyId = await ensureParentFamily(input.parentId, null);
  const isActive = input.enabled && hasEntitlement && hasPlanCapacity;

  await admin.from("app_access").upsert(
    {
      user_id: input.childId,
      app_name: input.appKey,
      has_access: isActive,
      access_source: "parent_portal",
    },
    { onConflict: "user_id,app_name" },
  );

  await admin.from("family_child_app_access").upsert(
    {
      family_id: familyId,
      child_id: input.childId,
      app_key: input.appKey,
      status: isActive
        ? "active"
        : input.enabled
          ? "paused_by_plan"
          : "paused_by_parent",
      status_reason: isActive
        ? "enabled_by_parent"
        : input.enabled
          ? "subscription_required"
          : "paused_by_parent",
      activated_at: isActive ? new Date().toISOString() : null,
      paused_at: isActive ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "family_id,child_id,app_key" },
  );
}

export async function manageKidAction(input: {
  parentId: string;
  childId: string;
  action: "reset_password" | "change_username" | "disable_login" | "enable_login";
  newPassword?: string;
  newUsername?: string;
}): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  if (!(await parentOwnsChild(input.parentId, input.childId))) {
    throw new KidApiError(403, "You can only manage children in your family.");
  }

  if (input.action === "reset_password") {
    const password = input.newPassword ?? "";
    if (!isStrongChildPassword(password)) {
      throw new KidApiError(
        400,
        "Password must be at least 8 characters and include a letter and a number.",
      );
    }
    const { error } = await admin.auth.admin.updateUserById(input.childId, { password });
    if (error) throw new KidApiError(500, "Could not update the password.");
    const { data: hash } = await admin.rpc("hash_child_credential_secure", {
      p_credential: password,
    });
    if (hash) {
      await admin
        .from("child_profiles")
        .update({
          credential_hash: hash,
          child_access_pin_hash: hash,
          failed_login_attempts: 0,
          locked_until: null,
        })
        .eq("id", input.childId);
    }
    return { ok: true };
  }

  if (input.action === "change_username") {
    const username = (input.newUsername ?? "").trim().toLowerCase();
    const { data: valid } = await admin.rpc("is_valid_child_username", {
      p_username: username,
    });
    if (valid !== true) throw new KidApiError(400, "That username is not valid.");
    const { data: available } = await admin.rpc("is_child_username_available", {
      p_username: username,
    });
    const { data: current } = await admin
      .from("child_profiles")
      .select("username")
      .eq("id", input.childId)
      .maybeSingle();
    if (current?.username !== username && available !== true) {
      throw new KidApiError(409, "That username is already taken.");
    }
    await admin.from("child_profiles").update({ username }).eq("id", input.childId);
    await admin.auth.admin.updateUserById(input.childId, {
      user_metadata: { username },
    });
    return { ok: true, username };
  }

  if (input.action === "disable_login") {
    await admin
      .from("child_profiles")
      .update({ is_active: false, account_status: "paused" })
      .eq("id", input.childId);
    await admin.auth.admin.updateUserById(input.childId, { ban_duration: "876000h" });
    return { ok: true };
  }

  if (input.action === "enable_login") {
    await admin
      .from("child_profiles")
      .update({
        is_active: true,
        account_status: "active",
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq("id", input.childId);
    await admin.auth.admin.updateUserById(input.childId, { ban_duration: "none" });
    return { ok: true };
  }

  throw new KidApiError(400, "Unknown action.");
}

export async function removeKidForParent(input: {
  parentId: string;
  childId: string;
}): Promise<void> {
  const admin = createAdminClient();
  if (!(await parentOwnsChild(input.parentId, input.childId))) {
    throw new KidApiError(403, "You can only manage children in your family.");
  }

  const [{ data: profile }, { data: childProfile }] = await Promise.all([
    admin.from("profiles").select("id, account_type").eq("id", input.childId).maybeSingle(),
    admin.from("child_profiles").select("id").eq("id", input.childId).maybeSingle(),
  ]);

  if (!childProfile && profile?.account_type !== "child") {
    throw new KidApiError(400, "That account is not a child profile.");
  }

  await Promise.all([
    admin.from("family_child_app_access").delete().eq("child_id", input.childId),
    admin.from("user_entitlement_children").delete().eq("child_id", input.childId),
    admin.from("app_access").delete().eq("user_id", input.childId),
    admin.from("family_members").delete().eq("user_id", input.childId).eq("role", "child"),
  ]);

  await admin.from("child_profiles").delete().eq("id", input.childId);
  await admin.from("profiles").delete().eq("id", input.childId);

  const { error } = await admin.auth.admin.deleteUser(input.childId);
  if (error) {
    throw new KidApiError(500, "Could not remove this child account.");
  }
}

export async function evaluateChildAppAccess(
  childId: string,
  appKey: KidAppKey,
): Promise<{
  allowed: boolean;
  code: string;
  message: string;
  parentId: string | null;
}> {
  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("family_members")
    .select("family_id")
    .eq("user_id", childId)
    .eq("role", "child")
    .limit(1)
    .maybeSingle();

  if (!membership?.family_id) {
    return {
      allowed: false,
      code: "no_family",
      message: "Ask your parent for help signing in.",
      parentId: null,
    };
  }

  const { data: family } = await admin
    .from("families")
    .select("id, owner_id")
    .eq("id", membership.family_id)
    .maybeSingle();

  const parentId = (family?.owner_id as string | undefined) ?? null;
  if (!parentId) {
    return {
      allowed: false,
      code: "no_parent",
      message: "Ask your parent for help signing in.",
      parentId: null,
    };
  }

  const { data: childProfile } = await admin
    .from("child_profiles")
    .select("is_active, account_status")
    .eq("id", childId)
    .maybeSingle();

  if (
    childProfile?.is_active === false ||
    ["paused", "suspended", "revoked"].includes(String(childProfile?.account_status ?? ""))
  ) {
    return {
      allowed: false,
      code: "account_paused",
      message: "Your login is paused. Ask your parent for help.",
      parentId,
    };
  }

  const hasEntitlement = await parentHasAppEntitlement(parentId, appKey);
  if (!hasEntitlement) {
    return {
      allowed: false,
      code: "parent_entitlement_required",
      message: "Your parent needs an active subscription for this app.",
      parentId,
    };
  }

  const { data: access } = await admin
    .from("family_child_app_access")
    .select("status")
    .eq("family_id", membership.family_id)
    .eq("child_id", childId)
    .eq("app_key", appKey)
    .maybeSingle();

  if (!access || access.status !== "active") {
    return {
      allowed: false,
      code: "app_disabled",
      message: "This app is turned off for your login. Ask your parent for help.",
      parentId,
    };
  }

  return {
    allowed: true,
    code: "ok",
    message: "ok",
    parentId,
  };
}

export class KidApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "KidApiError";
  }
}
