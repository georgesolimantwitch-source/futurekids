import { NextResponse } from "next/server";
import { requireBearerUser, SubscriptionAuthError } from "@/lib/subscriptions/auth";
import { syncScholarsWallet } from "@/lib/scholars/wallet-sync";

export const runtime = "nodejs";

/**
 * Scholars app → Genlyn: report App Store transactions and pick up the account's
 * single credit wallet (shared with Stripe purchases on genlyn.app / scholarsnote.com).
 */
export async function POST(request: Request) {
  try {
    const { user } = await requireBearerUser(request);
    const body = (await request.json().catch(() => ({}))) as {
      signed_transactions?: unknown;
      creator_code?: unknown;
      legacy_wallet?: unknown;
    };

    const signedTransactions = Array.isArray(body.signed_transactions)
      ? body.signed_transactions.filter((value): value is string => typeof value === "string")
      : [];
    const creatorCode =
      typeof body.creator_code === "string" && body.creator_code.trim()
        ? body.creator_code.trim().toUpperCase()
        : null;
    const result = await syncScholarsWallet({
      userId: user.id,
      email: user.email ?? null,
      signedTransactions,
      creatorCode,
    });

    return NextResponse.json({
      generations: result.balance.generations,
      tutor_minutes: result.balance.tutor_minutes,
      transactions: result.transactions,
    });
  } catch (error) {
    if (error instanceof SubscriptionAuthError) {
      return NextResponse.json({ error: error.message, code: "AUTH_REQUIRED" }, { status: error.status });
    }
    console.error("[scholars/usage/sync]", error);
    return NextResponse.json({ error: "Could not sync credits" }, { status: 500 });
  }
}
