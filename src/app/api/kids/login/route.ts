import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  evaluateChildAppAccess,
  isKidAppKey,
  type KidAppKey,
} from "@/lib/kids/portal";

/**
 * Child username/password login for Genlyn apps.
 * Returns a Supabase session when credentials are valid and (if app_key is set)
 * the parent has an active entitlement and the kid is enabled for that app.
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "Server misconfigured.", code: "server_configuration" }, { status: 500 });
  }

  let username = "";
  let password = "";
  let appKey: KidAppKey | null = null;
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      app_key?: string;
    };
    username = (body.username ?? "").trim().toLowerCase();
    password = body.password ?? "";
    const rawApp = (body.app_key ?? "").trim().toLowerCase();
    if (rawApp && isKidAppKey(rawApp)) appKey = rawApp;
  } catch {
    return NextResponse.json(
      { error: "Enter your username and password.", code: "invalid_request" },
      { status: 400 },
    );
  }

  if (!username || !password) {
    return NextResponse.json(
      { error: "Incorrect username or password.", code: "invalid_credentials" },
      { status: 401 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server misconfigured.", code: "server_configuration" }, { status: 500 });
  }

  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: recentFails } = await admin
    .from("earnly_child_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("username_normalized", username)
    .eq("success", false)
    .gte("attempted_at", windowStart);

  if ((recentFails ?? 0) >= 8) {
    return NextResponse.json(
      {
        error: "Too many attempts. Wait a few minutes, or ask your parent for help.",
        code: "rate_limited",
      },
      { status: 429 },
    );
  }

  const { data: child, error: childErr } = await admin
    .from("child_profiles")
    .select("id, username, account_status, is_active, locked_until, display_name")
    .eq("username", username)
    .maybeSingle();

  if (childErr || !child?.id) {
    await admin.from("earnly_child_login_attempts").insert({
      username_normalized: username,
      success: false,
    });
    return NextResponse.json(
      {
        error: "We couldn't find that account. Ask your parent for help.",
        code: "account_not_found",
      },
      { status: 401 },
    );
  }

  if (child.locked_until && new Date(child.locked_until) > new Date()) {
    return NextResponse.json(
      {
        error: "Too many attempts. Wait a bit and try again, or ask your parent for help.",
        code: "account_locked",
      },
      { status: 429 },
    );
  }

  if (child.account_status === "revoked" || child.is_active === false) {
    return NextResponse.json(
      {
        error: "This login is turned off. Ask your parent for help.",
        code: "account_disabled",
      },
      { status: 403 },
    );
  }
  if (["paused", "suspended"].includes(String(child.account_status))) {
    return NextResponse.json(
      {
        error: "Your account is paused. Ask your parent for help.",
        code: "account_paused",
      },
      { status: 403 },
    );
  }

  const { data: authUser, error: authUserErr } = await admin.auth.admin.getUserById(child.id);
  if (authUserErr || !authUser?.user?.email) {
    await admin.from("earnly_child_login_attempts").insert({
      username_normalized: username,
      success: false,
    });
    return NextResponse.json(
      {
        error: "Ask your parent for help signing in.",
        code: "account_not_found",
      },
      { status: 404 },
    );
  }

  const anonClient = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: sessionData, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: authUser.user.email,
    password,
  });

  if (signInErr || !sessionData.session) {
    await admin.from("earnly_child_login_attempts").insert({
      username_normalized: username,
      success: false,
      child_id: child.id,
    });
    return NextResponse.json(
      { error: "Incorrect username or password.", code: "invalid_credentials" },
      { status: 401 },
    );
  }

  await admin.from("earnly_child_login_attempts").insert({
    username_normalized: username,
    success: true,
    child_id: child.id,
  });
  await admin
    .from("child_profiles")
    .update({ failed_login_attempts: 0, locked_until: null })
    .eq("id", child.id);

  let access = {
    allowed: true,
    code: "ok",
    message: "ok",
    parentId: null as string | null,
  };

  if (appKey) {
    access = await evaluateChildAppAccess(child.id, appKey);
    if (!access.allowed) {
      // Still return session so apps can show a locked state, but flag denial.
      return NextResponse.json(
        {
          ok: false,
          code: access.code,
          error: access.message,
          access_denied: true,
          app_key: appKey,
          child: {
            id: child.id,
            username: child.username,
            display_name: child.display_name,
          },
          session: {
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token,
            expires_in: sessionData.session.expires_in,
            expires_at: sessionData.session.expires_at,
            token_type: sessionData.session.token_type,
            user: {
              id: sessionData.session.user.id,
              email: null,
              user_metadata: {
                account_type: "child",
                username: child.username,
                full_name: child.display_name,
              },
            },
          },
        },
        { status: 403 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    code: "ok",
    app_key: appKey,
    child: {
      id: child.id,
      username: child.username,
      display_name: child.display_name,
    },
    session: {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_in: sessionData.session.expires_in,
      expires_at: sessionData.session.expires_at,
      token_type: sessionData.session.token_type,
      user: {
        id: sessionData.session.user.id,
        email: null,
        user_metadata: {
          account_type: "child",
          username: child.username,
          full_name: child.display_name,
        },
      },
    },
  });
}
