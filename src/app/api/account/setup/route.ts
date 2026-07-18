import { NextResponse } from "next/server";
import {
  ensureEcosystemAccountForUser,
  getAuthenticatedUser,
} from "@/lib/auth/account";
import { createClient } from "@/lib/supabase/server";
import { metadataForAccountType } from "@/lib/auth/signup";
import type { AccountType } from "@/lib/auth/types";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please sign in again to finish setting up your account.",
      },
      { status: 401 },
    );
  }

  let body: { accountType?: AccountType } = {};
  try {
    body = (await request.json()) as { accountType?: AccountType };
  } catch {
    // no body is fine
  }

  if (body.accountType === "parent" || body.accountType === "individual") {
    const supabase = await createClient();
    await supabase.auth.updateUser({
      data: metadataForAccountType(body.accountType),
    });
  }

  const refreshedUser = (await getAuthenticatedUser()) ?? user;
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

  // Earnly/TinyPal require profiles.account_setup_complete = true.
  // ensureEcosystemAccountForUser marks it; re-check so clients never get ok:true with an incomplete profile.
  const supabase = await createClient();
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
}
