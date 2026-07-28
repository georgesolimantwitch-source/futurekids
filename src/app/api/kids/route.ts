import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/account";
import {
  createKidForParent,
  getScholarsSeatLimit,
  isKidAppKey,
  KidApiError,
  listKidsForParent,
  type KidAppKey,
} from "@/lib/kids/portal";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireParent() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();

  const metaType = user.user_metadata?.account_type ?? user.user_metadata?.ecosystem_role;
  const accountType = profile?.account_type ?? metaType;
  if (accountType === "individual" || accountType === "child") {
    return {
      error: NextResponse.json(
        { error: "Kids are only available on family accounts." },
        { status: 403 },
      ),
    };
  }

  return { user };
}

export async function GET() {
  const auth = await requireParent();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const [children, scholarsSeatLimit] = await Promise.all([
      listKidsForParent(auth.user!.id),
      getScholarsSeatLimit(auth.user!.id),
    ]);
    return NextResponse.json({ ok: true, children, scholarsSeatLimit });
  } catch (error) {
    console.error("list kids", error);
    return NextResponse.json({ error: "Could not load kids." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireParent();
  if ("error" in auth && auth.error) return auth.error;

  let body: {
    full_name?: string;
    username?: string;
    password?: string;
    date_of_birth?: string;
    avatar_color?: string;
    enabled_apps?: string[];
    parent_manages_confirmed?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.parent_manages_confirmed) {
    return NextResponse.json(
      { error: "Confirm that you manage this child account." },
      { status: 400 },
    );
  }

  const enabledApps =
    Array.isArray(body.enabled_apps) && body.enabled_apps.length > 0
      ? (body.enabled_apps
          .map((a) => a.trim().toLowerCase())
          .filter(isKidAppKey) as KidAppKey[])
      : undefined;

  try {
    const child = await createKidForParent({
      parentId: auth.user!.id,
      parentEmail: auth.user!.email ?? null,
      fullName: body.full_name ?? "",
      username: body.username ?? "",
      password: body.password ?? "",
      dateOfBirth: body.date_of_birth ?? "",
      avatarColor: body.avatar_color,
      enabledApps,
    });
    return NextResponse.json({ ok: true, child });
  } catch (error) {
    if (error instanceof KidApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("create kid", error);
    return NextResponse.json(
      { error: "Could not create the child account." },
      { status: 500 },
    );
  }
}
