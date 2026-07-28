import { NextResponse } from "next/server";
import {
  ensureEcosystemAccountForUser,
  getAuthenticatedUser,
} from "@/lib/auth/account";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  metadataForAccountType,
  resolveSetupAccountType,
} from "@/lib/auth/signup";
import type { AccountType, EcosystemAccount } from "@/lib/auth/types";
import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js";

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

async function resolveUser(request: Request): Promise<{
  user: User;
  bearer: string | null;
} | null> {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? null;

  if (bearer) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return null;
    const client = createSupabaseClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await client.auth.getUser(bearer);
    if (error || !data.user) return null;
    return { user: data.user, bearer };
  }

  const user = await getAuthenticatedUser();
  return user ? { user, bearer: null } : null;
}

async function provisionWithAdmin(user: User, accountType: AccountType) {
  const admin = createAdminClient();
  const fullName = displayNameFromUser(user);

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      ...metadataForAccountType(accountType),
      full_name: fullName ?? user.user_metadata?.full_name,
    },
  });

  const { error } = await admin.rpc("provision_ecosystem_account", {
    p_user_id: user.id,
    p_email: user.email ?? "",
    p_full_name: fullName,
    p_avatar_url: avatarFromUser(user),
    p_role: accountType,
    p_family_name: fullName ? `${fullName}'s Family` : "My Family",
  });

  if (error) throw new Error(error.message);

  await admin
    .from("profiles")
    .update({ account_setup_complete: true, account_type: accountType })
    .eq("id", user.id);

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, account_type, stripe_customer_id, created_at, updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    user_id: user.id,
    profile,
    families: [],
    family_members: [],
    family: null,
    members: [],
    subscriptions: [],
    app_access: [],
    entitlements: [],
    effective_access: [],
  } as unknown as EcosystemAccount;
}

export async function POST(request: Request) {
  const auth = await resolveUser(request);

  if (!auth) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please sign in again to finish setting up your account.",
      },
      { status: 401 },
    );
  }

  let body: { accountType?: AccountType; source?: string } = {};
  try {
    body = (await request.json()) as { accountType?: AccountType; source?: string };
  } catch {
    // no body is fine
  }

  const accountType = resolveSetupAccountType({
    accountType: body.accountType,
    source: body.source,
  });

  try {
    if (auth.bearer) {
      const account = await provisionWithAdmin(auth.user, accountType);
      if (!account?.profile) {
        return NextResponse.json(
          {
            ok: false,
            error: "Your profile is still being prepared. Please try again.",
          },
          { status: 202 },
        );
      }
      return NextResponse.json({ ok: true, account });
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.updateUser({
      data: metadataForAccountType(accountType),
    });

    const refreshedUser = (await getAuthenticatedUser()) ?? auth.user;
    const account = await ensureEcosystemAccountForUser(refreshedUser);

    if (!account?.profile) {
      return NextResponse.json(
        {
          ok: false,
          error: "Your profile is still being prepared. Please try again.",
        },
        { status: 202 },
      );
    }

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("account_setup_complete")
      .eq("id", refreshedUser.id)
      .maybeSingle();

    if (profileRow?.account_setup_complete !== true) {
      await supabase.rpc("complete_my_account_setup");
      await supabase
        .from("profiles")
        .update({ account_setup_complete: true })
        .eq("id", refreshedUser.id);
    }

    return NextResponse.json({ ok: true, account });
  } catch (error) {
    console.error("account setup failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Your account setup needs one more moment.",
      },
      { status: 500 },
    );
  }
}
