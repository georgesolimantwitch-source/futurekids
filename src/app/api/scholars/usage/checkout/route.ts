import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestOrigin } from "@/lib/auth/redirect";
import {
  clampGenerations,
  clampTutorMinutes,
  scholarsCombinedLookupKey,
  type ScholarsCreditPeriod,
} from "@/config/scholars-credits";
import {
  ensureStripeCustomerId,
  getStripe,
} from "@/lib/subscriptions/stripe";

export const runtime = "nodejs";

function checkoutOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      throw new Error("NEXT_PUBLIC_SITE_URL is invalid");
    }
  }
  return getRequestOrigin(request);
}

function parsePeriod(value: unknown): ScholarsCreditPeriod | null {
  if (value === "refill" || value === "monthly" || value === "yearly") return value;
  // Legacy alias
  if (value === "once") return "refill";
  return null;
}

async function priceIdForLookupKey(lookupKey: string): Promise<string | null> {
  const stripe = getStripe();
  const listed = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  return listed.data[0]?.id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    let body: {
      generations?: unknown;
      tutor_minutes?: unknown;
      period?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const period = parsePeriod(body.period);
    if (!period) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    const generations = clampGenerations(Number(body.generations ?? 0));
    const tutorMinutes = clampTutorMinutes(Number(body.tutor_minutes ?? 0));
    if (generations === 0 && tutorMinutes === 0) {
      return NextResponse.json(
        { error: "Choose generations and/or tutor minutes" },
        { status: 400 },
      );
    }

    const lookupKey = scholarsCombinedLookupKey(
      generations,
      tutorMinutes,
      period,
    );
    const priceId = await priceIdForLookupKey(lookupKey);
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe price missing for ${lookupKey}. Run create-scholars-credit-prices.`,
        },
        { status: 500 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const admin = createAdminClient();
    const stripe = getStripe();
    const customerId = await ensureStripeCustomerId({
      stripe,
      userId: user.id,
      existingCustomerId: profile?.stripe_customer_id,
      email: user.email ?? profile?.email,
      name:
        profile?.full_name ??
        (user.user_metadata?.full_name as string | undefined) ??
        null,
      persist: async (nextCustomerId) => {
        const { error } = await admin.rpc("set_profile_stripe_customer_id", {
          p_user_id: user.id,
          p_stripe_customer_id: nextCustomerId,
        });
        if (error) throw new Error("Could not link billing profile");
      },
    });

    const origin = checkoutOrigin(request);
    // Credits are held on the parent account until assigned to a child in Manage kids.
    const metadata: Record<string, string> = {
      future_kids_user_id: user.id,
      child_user_id: user.id,
      parent_user_id: user.id,
      credit_held_by: "parent",
      app_key: "scholars",
      credit_checkout: "true",
      credit_period: period,
      grant_generations: String(generations),
      grant_tutor_minutes: String(tutorMinutes),
      credit_lookup_key: lookupKey,
    };

    const session = await stripe.checkout.sessions.create({
      mode: period === "refill" ? "payment" : "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?checkout=success&app=scholars&credits=1`,
      cancel_url: `${origin}/pricing?checkout=canceled&app=scholars`,
      metadata,
      ...(period === "refill"
        ? { payment_intent_data: { metadata } }
        : { subscription_data: { metadata } }),
    });

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[scholars/usage/checkout]", error);
    const message =
      error instanceof Error ? error.message : "Could not start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
