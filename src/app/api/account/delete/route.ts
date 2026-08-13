import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/auth/account";
import {
  deleteEcosystemAccount,
  userHasPasswordAuth,
  verifyAccountPassword,
} from "@/lib/auth/delete-account";

export const runtime = "nodejs";

async function resolveUser(request: Request): Promise<{
  user: User;
  viaBearer: boolean;
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
    return { user: data.user, viaBearer: true };
  }

  const user = await getAuthenticatedUser();
  return user ? { user, viaBearer: false } : null;
}

/**
 * Permanently deletes the authenticated Genlyn parent account.
 * - Web (cookie session): requires password confirmation.
 * - Native apps (Bearer token): session token is sufficient (App Store compliance).
 */
export async function POST(request: Request) {
  try {
    const auth = await resolveUser(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { user, viaBearer } = auth;
    let body: { password?: string; confirm?: string } = {};
    try {
      body = (await request.json()) as { password?: string; confirm?: string };
    } catch {
      // Native clients may omit a body.
    }

    // Cookie-session (website) always requires re-auth.
    if (!viaBearer) {
      const password = typeof body.password === "string" ? body.password : "";
      const email = user.email?.trim() ?? "";

      if (!email) {
        return NextResponse.json(
          { ok: false, error: "Your account email is missing. Contact support to delete." },
          { status: 400 },
        );
      }

      if (userHasPasswordAuth(user)) {
        if (!password) {
          return NextResponse.json(
            { ok: false, error: "Enter your password to delete your account." },
            { status: 400 },
          );
        }
        const verified = await verifyAccountPassword(email, password);
        if (!verified.ok) {
          return NextResponse.json({ ok: false, error: verified.error }, { status: 403 });
        }
      } else {
        // OAuth-only accounts have no password — require typed confirmation.
        const confirm = typeof body.confirm === "string" ? body.confirm.trim() : "";
        if (confirm.toLowerCase() !== "delete" && confirm !== email) {
          return NextResponse.json(
            {
              ok: false,
              error: 'Type DELETE or your email to confirm account deletion.',
            },
            { status: 400 },
          );
        }
      }
    }

    await deleteEcosystemAccount(user.id);

    return NextResponse.json({ ok: true, success: true, userId: user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Account deletion failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
