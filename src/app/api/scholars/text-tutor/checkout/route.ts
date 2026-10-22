import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestOrigin } from "@/lib/auth/redirect";
import { requireBearerUser } from "@/lib/subscriptions/auth";
import {
  scholarsTextTutorLookupKey,
  scholarsTextTutorPlanKey,
  type ScholarsTextTutorPeriod,
} from "@/config/scholars-text-tutor";
import {
  ensureStripeCustomerId,
  getStripe,
} from "@/lib/subscriptions/stripe";
import { ensureScholarsTextTutorStripePrice } from "@/lib/scholars/ensure-text-tutor-price";
import { parentOwnsChild } from "@/lib/kids/portal";

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

function parsePeriod(value: unknown): ScholarsTextTutorPeriod | null {
  if (value === "monthly" || value === "yearly") return value;
  return null;
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
      period?: unknown;
      child_user_ids?: unknown;
      child_user_id?: unknown;
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

    const requestedChildIds = Array.from(
      new Set(
        [
          ...(Array.isArray(body.child_user_ids)
            ? body.child_user_ids
            : typeof body.child_user_ids === "string"
              ? body.child_user_ids.split(",")
              : []),
          ...(typeof body.child_user_id === "string" ? [body.child_user_id] : []),
        ]
          .map((id) => String(id).trim().toLowerCase())
          .filter(Boolean),
      ),
    ).filter((id) => id !== userId.toLowerCase());

    for (const childId of requestedChildIds) {
      if (!(await parentOwnsChild(userId, childId))) {
        return NextResponse.json(
          { error: "You can only assign this plan to kids in your family." },
          { status: 403 },
        );
      }
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
    const priceId = await ensureScholarsTextTutorStripePrice({ stripe, period });
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

    const planKey = scholarsTextTutorPlanKey(period);
    const lookupKey = scholarsTextTutorLookupKey(period);
    const assignToChildren = requestedChildIds.length > 0;
    const origin = checkoutOrigin(request);

    const metadata: Record<string, string> = {
      future_kids_user_id: userId,
      parent_user_id: userId,
      app_key: "scholars",
      plan_key: planKey,
      entitlement: "scholars",
      text_tutor_checkout: "true",
      unlimited_text_tutor: "true",
      credit_lookup_key: lookupKey,
      scholars_child_count: "1",
      child_count: "1",
      ...(assignToChildren
        ? {
            child_user_ids: requestedChildIds.join(","),
            child_user_id: requestedChildIds[0],
            credit_held_by: "children",
          }
        : {
            child_user_id: userId,
            credit_held_by: "parent",
          }),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/account?checkout=success&app=scholars&text_tutor=1`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      metadata,
      subscription_data: { metadata },
    });

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
    }

    return NextResponse.json({
      url: session.url,
      plan_key: planKey,
      period,
    });
  } catch (error) {
    console.error("[scholars/text-tutor/checkout]", error);
    const message =
      error instanceof Error ? error.message : "Could not start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
