import { NextRequest, NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/subscriptions/stripe";

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
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe billing account is connected" },
        { status: 404 },
      );
    }

    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const origin = configuredOrigin
      ? new URL(configuredOrigin).origin
      : getRequestOrigin(request);

    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/account#plans`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[billing-portal] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Could not open billing management" },
      { status: 500 },
    );
  }
}

