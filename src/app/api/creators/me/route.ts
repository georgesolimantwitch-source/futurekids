import { NextRequest, NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/auth/redirect";
import {
  ensureCreatorForUser,
  getCreatorByUserId,
  listCreatorCommissions,
  listCreatorReferrals,
  startConnectOnboarding,
  syncConnectAccountStatus,
} from "@/lib/creators/store";
import { createClient } from "@/lib/supabase/server";
import { normalizeCreatorCode, isValidCreatorCodeFormat } from "@/config/creators";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  let creator = await getCreatorByUserId(user.id);
  if (!creator) {
    return NextResponse.json({ creator: null });
  }
  if (creator.stripe_connect_account_id) {
    creator = await syncConnectAccountStatus(creator);
  }

  const [referrals, commissions] = await Promise.all([
    listCreatorReferrals(creator.id),
    listCreatorCommissions(creator.id),
  ]);

  return NextResponse.json({ creator, referrals, commissions });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  let body: { action?: string; code?: string; displayName?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const action = body.action ?? "join";

  if (action === "join") {
    const creator = await ensureCreatorForUser({
      userId: user.id,
      email: user.email,
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
    });

    if (typeof body.code === "string" && body.code.trim()) {
      const code = normalizeCreatorCode(body.code);
      if (!isValidCreatorCodeFormat(code)) {
        return NextResponse.json(
          { error: "Code must be 4–6 letters or numbers" },
          { status: 400 },
        );
      }
      const admin = createAdminClient();
      const { data: clash } = await admin
        .from("genlyn_creators")
        .select("id")
        .eq("code", code)
        .neq("id", creator.id)
        .maybeSingle();
      if (clash) {
        return NextResponse.json(
          { error: "That code is already taken" },
          { status: 409 },
        );
      }
      await admin
        .from("genlyn_creators")
        .update({
          code,
          display_name:
            typeof body.displayName === "string" && body.displayName.trim()
              ? body.displayName.trim()
              : creator.display_name,
        })
        .eq("id", creator.id);
    }

    const refreshed = (await getCreatorByUserId(user.id)) ?? creator;
    const origin = getRequestOrigin(request);
    const { url } = await startConnectOnboarding({
      creator: refreshed,
      email: user.email,
      returnOrigin: origin,
    });

    return NextResponse.json({ creator: refreshed, onboardingUrl: url });
  }

  if (action === "connect") {
    const creator = await getCreatorByUserId(user.id);
    if (!creator) {
      return NextResponse.json({ error: "Join the creator program first" }, { status: 400 });
    }
    const origin = getRequestOrigin(request);
    const { url, creator: next } = await startConnectOnboarding({
      creator,
      email: user.email,
      returnOrigin: origin,
    });
    return NextResponse.json({ creator: next, onboardingUrl: url });
  }

  if (action === "sync") {
    let creator = await getCreatorByUserId(user.id);
    if (!creator) {
      return NextResponse.json({ error: "Not a creator" }, { status: 404 });
    }
    creator = await syncConnectAccountStatus(creator);
    return NextResponse.json({ creator });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
