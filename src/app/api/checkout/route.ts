import { NextRequest, NextResponse } from "next/server";
import { clampEarnlyChildCount } from "@/config/earnly-pricing";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestOrigin } from "@/lib/auth/redirect";
import {
  assertStripePriceMatchesCatalog,
  getServerCheckoutPlan,
  getStripe,
} from "@/lib/subscriptions/stripe";

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

export async function POST(request: NextRequest) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
    const requestHostname = (
      request.headers.get("x-forwarded-host") ?? request.nextUrl.hostname
    )
      .split(":")[0]
      .toLowerCase();
    if (
      stripeSecret?.startsWith("sk_test_") &&
      !["localhost", "127.0.0.1"].includes(requestHostname)
    ) {
      return NextResponse.json(
        { error: "Stripe sandbox checkout is local-only" },
        { status: 403 },
      );
    }
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required", code: "AUTH_REQUIRED" }, { status: 401 });
    }

    let body: { planKey?: unknown; childCount?: unknown };
    try {
      body = (await request.json()) as {
        planKey?: unknown;
        childCount?: unknown;
      };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { planKey, childCount } = body;

    if (typeof planKey !== "string" || !planKey) {
      return NextResponse.json({ error: "Missing planKey" }, { status: 400 });
    }

    const mapped = getServerCheckoutPlan(planKey);
    if (!mapped) {
      return NextResponse.json({ error: "Unknown planKey" }, { status: 400 });
    }
    const { plan, priceId } = mapped;
    const { data: existingEntitlements } = await supabase
      .from("user_entitlements")
      .select("id, status, current_period_end")
      .eq("provider", "stripe")
      .eq("app_key", plan.appKey)
      .in("status", ["active", "trialing", "grace_period", "canceled"]);
    if (
      existingEntitlements?.some(
        (entitlement) =>
          !entitlement.current_period_end ||
          Date.parse(entitlement.current_period_end) > Date.now(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A website subscription for this app is already attached to your account. Manage that plan instead.",
        },
        { status: 409 },
      );
    }
    const stripe = getStripe();
    await assertStripePriceMatchesCatalog(stripe, plan, priceId);
    const origin = checkoutOrigin(request);
    let lineItemQuantity = 1;
    let effectiveChildCount = plan.fixedChildCount ?? 1;

    if (plan.perChildQuantity) {
      const requestedChildren = childCount ?? 1;
      if (
        !Number.isInteger(requestedChildren) ||
        Number(requestedChildren) !== clampEarnlyChildCount(Number(requestedChildren))
      ) {
        return NextResponse.json({ error: "Invalid child count" }, { status: 400 });
      }
      effectiveChildCount = clampEarnlyChildCount(Number(requestedChildren));
      lineItemQuantity = effectiveChildCount;
    } else if (plan.fixedChildCount !== null) {
      if (
        childCount !== undefined &&
        Number(childCount) !== plan.fixedChildCount
      ) {
        return NextResponse.json(
          { error: "planKey does not match child count" },
          { status: 400 },
        );
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id ?? undefined;

    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        customerId = undefined;
      } else {
        const linkedUserId = customer.metadata.future_kids_user_id;
        if (linkedUserId && linkedUserId !== user.id) {
          throw new Error("Stripe customer belongs to a different user");
        }
        if (!linkedUserId) {
          await stripe.customers.update(customer.id, {
            metadata: { future_kids_user_id: user.id },
          });
        }
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email ?? undefined,
        name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined),
        metadata: {
          future_kids_user_id: user.id,
        },
      });
      customerId = customer.id;

      const admin = createAdminClient();
      const { error: customerLinkError } = await admin.rpc("set_profile_stripe_customer_id", {
        p_user_id: user.id,
        p_stripe_customer_id: customerId,
      });
      if (customerLinkError) {
        console.error("[checkout] failed to persist Stripe customer", {
          userId: user.id,
          code: customerLinkError.code,
        });
        return NextResponse.json({ error: "Could not link billing profile" }, { status: 500 });
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
      success_url: `${origin}/account?checkout=success&app=${plan.appKey}`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      metadata: {
        future_kids_user_id: user.id,
        app_key: plan.appKey,
        plan_key: plan.planKey,
        child_count: String(effectiveChildCount),
      },
      subscription_data: {
        metadata: {
          future_kids_user_id: user.id,
          app_key: plan.appKey,
          plan_key: plan.planKey,
          child_count: String(effectiveChildCount),
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
