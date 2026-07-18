import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  clampEarnlyChildCount,
  earnlyLivePricing,
} from "@/config/earnly-pricing";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

function getStripe(): Stripe {
  if (!stripeSecret) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(stripeSecret);
}

import { getRequestOrigin } from "@/lib/auth/redirect";

function resolvePlanType(app: string | undefined): string {
  if (app === "ecosystem") return "bundle";
  if (app === "earnly") return "per_child";
  if (app === "scholars") return "tier";
  return "flat";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required", code: "AUTH_REQUIRED" }, { status: 401 });
    }

    const body = (await request.json()) as {
      priceId?: string;
      quantity?: number;
      app?: string;
      childCount?: number;
    };

    const { priceId, quantity = 1, app, childCount } = body;

    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    const stripe = getStripe();
    const origin = getRequestOrigin(request);
    const planType = resolvePlanType(app);

    let lineItemQuantity = quantity;

    if (app === "earnly" || app === "ecosystem") {
      lineItemQuantity = clampEarnlyChildCount(childCount ?? quantity);
      if (lineItemQuantity < earnlyLivePricing.minChildren) {
        return NextResponse.json({ error: "Invalid child count" }, { status: 400 });
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email ?? undefined,
        name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined),
        metadata: {
          future_kids_user_id: user.id,
        },
      });
      customerId = customer.id;

      try {
        const admin = createAdminClient();
        await admin.rpc("set_profile_stripe_customer_id", {
          p_user_id: user.id,
          p_stripe_customer_id: customerId,
        });
      } catch {
        // Profile column may not exist until migration runs — checkout still proceeds.
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: lineItemQuantity,
        },
      ],
      success_url: `${origin}/account?checkout=success&app=${app ?? "earnly"}`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      metadata: {
        future_kids_user_id: user.id,
        app_id: app ?? "unknown",
        price_id: priceId,
        plan_type: planType,
        child_count: String(lineItemQuantity),
      },
      subscription_data: {
        metadata: {
          future_kids_user_id: user.id,
          app_id: app ?? "unknown",
          price_id: priceId,
          plan_type: planType,
          child_count: String(lineItemQuantity),
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
