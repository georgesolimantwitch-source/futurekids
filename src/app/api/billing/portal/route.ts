import { NextRequest, NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/auth/redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ensureStripeCustomerId,
  getStripe,
  isMissingStripeCustomerError,
} from "@/lib/subscriptions/stripe";

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "No Stripe billing account is connected" },
        { status: 404 },
      );
    }

    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const origin = configuredOrigin
      ? new URL(configuredOrigin).origin
      : getRequestOrigin(request);

    const stripe = getStripe();
    const admin = createAdminClient();
    const customerId = await ensureStripeCustomerId({
      stripe,
      userId: user.id,
      existingCustomerId: profile.stripe_customer_id,
      email: user.email ?? profile.email,
      name: profile.full_name,
      persist: async (nextCustomerId) => {
        const { error } = await admin.rpc("set_profile_stripe_customer_id", {
          p_user_id: user.id,
          p_stripe_customer_id: nextCustomerId,
        });
        if (error) throw new Error("Could not link billing profile");
      },
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/account#plans`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[billing-portal] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    const status = isMissingStripeCustomerError(error) ? 404 : 500;
    return NextResponse.json(
      { error: "Could not open billing management" },
      { status },
    );
  }
}

