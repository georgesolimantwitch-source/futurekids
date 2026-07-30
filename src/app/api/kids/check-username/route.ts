import { NextResponse } from "next/server";
import { requireParentFromRequest } from "@/lib/kids/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireParentFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error.message },
      { status: auth.error.status },
    );
  }

  let username = "";
  try {
    const body = (await request.json()) as { username?: string };
    username = (body.username ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!username) {
    return NextResponse.json({ available: false, valid: false });
  }

  const admin = createAdminClient();
  const [validRes, availableRes] = await Promise.all([
    admin.rpc("is_valid_child_username", { p_username: username }),
    admin.rpc("is_child_username_available", { p_username: username }),
  ]);

  return NextResponse.json({
    ok: true,
    valid: validRes.data === true,
    available: availableRes.data === true,
  });
}
