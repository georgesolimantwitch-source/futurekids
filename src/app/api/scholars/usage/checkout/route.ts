import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestOrigin } from "@/lib/auth/redirect";
import { requireBearerUser } from "@/lib/subscriptions/auth";
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
import { ensureCreatorPromotionCode } from "@/lib/scholars/creator-promo";

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
  if (value === "once") return "refill";
  return null;
}

function safeReturnOrigin(raw: unknown, fallback: string): string {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.toLowerCase();
    const allowed =
      host === "scholarsnote.com" ||
      host === "www.scholarsnote.com" ||
      host === "genlyn.app" ||
      host === "www.genlyn.app" ||
      host.endsWith(".vercel.app") ||
      host === "localhost";
    if (!allowed) return fallback;
    return u.origin;
  } catch {
    return fallback;
  }
}

async function resolveUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    try {
      const { user } = await requireBearerUser(request);
      return user.id;
    } catch {
      return null;
    }
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
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
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    let body: {
      generations?: unknown;
      tutor_minutes?: unknown;
      period?: unknown;
      success_url?: unknown;
      cancel_url?: unknown;
      creator_code?: unknown;
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
    const tutorMinutes = clampTutorMinutes(
      Number(body.tutor_minutes ?? 0),
      generations,
    );
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

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", userId)
      .maybeSingle();

    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email ?? profile?.email ?? undefined;

    const stripe = getStripe();
    const customerId = await ensureStripeCustomerId({
      stripe,
      userId,
      existingCustomerId: profile?.stripe_customer_id,
      email,
      name:
        profile?.full_name ??
        (authUser?.user?.user_metadata?.full_name as string | undefined) ??
        null,
      persist: async (nextCustomerId) => {
        const { error } = await admin.rpc("set_profile_stripe_customer_id", {
          p_user_id: userId,
          p_stripe_customer_id: nextCustomerId,
        });
        if (error) throw new Error("Could not link billing profile");
      },
    });

    const origin = checkoutOrigin(request);
    const successOrigin = safeReturnOrigin(body.success_url, origin);
    const cancelOrigin = safeReturnOrigin(body.cancel_url, origin);
    const creatorCode =
      typeof body.creator_code === "string"
        ? body.creator_code.trim().toUpperCase().slice(0, 32)
        : "";

    const metadata: Record<string, string> = {
      future_kids_user_id: userId,
      child_user_id: userId,
      parent_user_id: userId,
      credit_held_by: "parent",
      app_key: "scholars",
      credit_checkout: "true",
      credit_period: period,
      grant_generations: String(generations),
      grant_tutor_minutes: String(tutorMinutes),
      credit_lookup_key: lookupKey,
      ...(creatorCode ? { creator_code: creatorCode } : {}),
    };

    let promotionCodeId: string | null = null;
    if (creatorCode) {
      try {
        promotionCodeId = await ensureCreatorPromotionCode(creatorCode, stripe);
      } catch (promoErr) {
        console.error("[scholars/usage/checkout] creator promo", promoErr);
        return NextResponse.json(
          { error: "Could not apply creator discount. Try again.", code: "CREATOR_PROMO_FAILED" },
          { status: 500 },
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: period === "refill" ? "payment" : "subscription",
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      // Stripe forbids combining discounts[] with allow_promotion_codes.
      ...(promotionCodeId
        ? { discounts: [{ promotion_code: promotionCodeId }] }
        : { allow_promotion_codes: true }),
      success_url: `${successOrigin}/account?checkout=success&app=scholars&credits=1`,
      cancel_url: `${cancelOrigin}/pricing?checkout=canceled`,
      metadata,
      ...(period === "refill"
        ? { payment_intent_data: { metadata } }
        : { subscription_data: { metadata } }),
    });

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
    }

    return NextResponse.json({
      url: session.url,
      lookup_key: lookupKey,
      generations,
      tutor_minutes: tutorMinutes,
      period,
    });
  } catch (error) {
    console.error("[scholars/usage/checkout]", error);
    const message =
      error instanceof Error ? error.message : "Could not start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
