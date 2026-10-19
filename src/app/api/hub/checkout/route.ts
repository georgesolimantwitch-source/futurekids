import { NextRequest, NextResponse } from "next/server";
import { HUB_KIND, getHubSize, hubStripePriceId } from "@/config/hub";
import { normalizeCreatorCode } from "@/config/creators";
import { resolveCreatorForBuyer } from "@/lib/creators/store";
import { createPendingHubOrder, validateShipping } from "@/lib/hub/orders";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ensureStripeCustomerId,
  getStripe,
} from "@/lib/subscriptions/stripe";

export const runtime = "nodejs";

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

    let body: { size?: unknown; shipping?: unknown; creator_code?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const size = getHubSize(typeof body.size === "string" ? body.size : "");
    if (!size) {
      return NextResponse.json({ error: "Choose a Hub size" }, { status: 400 });
    }

    const shipping = validateShipping(body.shipping);
    if (!shipping) {
      return NextResponse.json(
        { error: "Enter a complete shipping address" },
        { status: 400 },
      );
    }

    const creatorCode =
      typeof body.creator_code === "string"
        ? normalizeCreatorCode(body.creator_code)
        : "";
    const creator = await resolveCreatorForBuyer({
      buyerUserId: user.id,
      creatorCode: creatorCode || null,
      source: "hub_checkout",
    });
    const appliedCode = creator?.code ?? (creatorCode || undefined);

    const stripe = getStripe();
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const admin = createAdminClient();
    const customerId = await ensureStripeCustomerId({
      stripe,
      userId: user.id,
      existingCustomerId: profile?.stripe_customer_id,
      email: profile?.email ?? user.email,
      name: profile?.full_name,
      persist: async (id) => {
        const { error: customerLinkError } = await admin.rpc(
          "set_profile_stripe_customer_id",
          {
            p_user_id: user.id,
            p_stripe_customer_id: id,
          },
        );
        if (customerLinkError) {
          throw new Error("Could not link billing profile");
        }
      },
    });

    const priceId = hubStripePriceId(size);
    const metadata: Record<string, string> = {
      kind: HUB_KIND,
      size: size.id,
      user_id: user.id,
      ...(priceId ? { stripe_price_id: priceId } : {}),
      ...(appliedCode ? { creator_code: appliedCode } : {}),
      ...(creator ? { creator_id: creator.id } : {}),
    };

    const paymentIntent = await stripe.paymentIntents.create({
      amount: size.priceCents,
      currency: "usd",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata,
      shipping: {
        name: shipping.name,
        phone: shipping.phone,
        address: {
          line1: shipping.line1,
          line2: shipping.line2,
          city: shipping.city,
          state: shipping.state,
          postal_code: shipping.postal_code,
          country: shipping.country ?? "US",
        },
      },
      description: `${size.label} — Genlyn Hub`,
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Could not start payment" },
        { status: 500 },
      );
    }

    const order = await createPendingHubOrder({
      userId: user.id,
      size: size.id,
      paymentIntentId: paymentIntent.id,
      customerId,
      shipping,
      creatorCode: appliedCode,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      orderNumber: order.order_number,
      amountCents: size.priceCents,
      size: size.id,
    });
  } catch (error) {
    console.error("[hub/checkout]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not start checkout",
      },
      { status: 500 },
    );
  }
}
