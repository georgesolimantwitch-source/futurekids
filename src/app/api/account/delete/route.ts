import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js";

export const runtime = "nodejs";

async function resolveUser(request: Request): Promise<User | null> {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? null;
  if (!bearer) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const client = createSupabaseClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.getUser(bearer);
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Permanently deletes the authenticated Genlyn parent account.
 * Used by native apps (Freshys, etc.) for App Store account-deletion compliance.
 */
export async function POST(request: Request) {
  try {
    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const admin = createAdminClient();
    const userId = user.id;

    // Best-effort cleanup of ecosystem rows before deleting the auth user.
    try {
      await admin.from("profiles").delete().eq("id", userId);
    } catch {
      // ignore
    }
    try {
      await admin.from("family_members").delete().eq("user_id", userId);
    } catch {
      // ignore
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return NextResponse.json(
        { ok: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, success: true, userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Account deletion failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
