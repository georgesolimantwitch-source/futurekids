import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calendarPeriodKey,
  grantScholarsCredits,
} from "@/lib/scholars/credits";

export const runtime = "nodejs";

/**
 * Monthly refill for active Scholars credit subscriptions (esp. yearly plans).
 * Secure with CRON_SECRET header. Schedule: 0 8 1 * * (or daily — idempotent by period_key).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const periodKey = calendarPeriodKey();
  const { data: plans, error } = await admin
    .from("scholars_credit_subscriptions")
    .select(
      "child_user_id, parent_user_id, kind, quantity, lookup_key, stripe_subscription_id, status",
    )
    .eq("status", "active");

  if (error) {
    console.error("[scholars refill]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let applied = 0;
  let duplicates = 0;
  for (const plan of plans ?? []) {
    try {
      const result = await grantScholarsCredits({
        childUserId: plan.child_user_id,
        parentUserId: plan.parent_user_id,
        kind: plan.kind,
        quantity: plan.quantity,
        periodKey,
        lookupKey: plan.lookup_key,
        stripeSubscriptionId: plan.stripe_subscription_id,
      });
      if (result.outcome === "applied") applied += 1;
      else duplicates += 1;
    } catch (e) {
      console.error("[scholars refill] grant failed", {
        childUserId: plan.child_user_id,
        message: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    periodKey,
    plans: plans?.length ?? 0,
    applied,
    duplicates,
  });
}
