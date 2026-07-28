import { NextRequest, NextResponse } from "next/server";
import { clampEarnlyChildCount } from "@/config/earnly-pricing";
import {
  clampAllAccessScholarsChildCount,
  clampScholarsChildCount,
} from "@/config/scholars-pricing";
import {
  clampGenerations,
  clampTutorMinutes,
  scholarsCombinedLookupKey,
} from "@/config/scholars-credits";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestOrigin } from "@/lib/auth/redirect";
import {
  assertStripePriceMatchesCatalog,
  ensureStripeCustomerId,
  getServerCheckoutPlan,
  getStripe,
} from "@/lib/subscriptions/stripe";
import { requiredFamilyChildCount } from "@/lib/subscriptions/plan-management";

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

function parseScholarsTier(
  value: unknown,
): "full" | "tutor" | "study_guide" | null {
  if (value === "full" || value === "tutor" || value === "study_guide") {
    return value;
  }
  return null;
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
      planKey?: unknown;
      childCount?: unknown;
      scholarsTier?: unknown;
      scholarsChildCount?: unknown;
      tinypalChildCount?: unknown;
      ballrChildCount?: unknown;
      scholarsGenerations?: unknown;
      scholarsTutorMinutes?: unknown;
      scholarsCreditChildId?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { planKey, childCount, scholarsTier: scholarsTierRaw } = body;
    const scholarsTier = parseScholarsTier(scholarsTierRaw);

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
        Number(requestedChildren) !==
          clampEarnlyChildCount(Number(requestedChildren))
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

    const requestedScholarsChildren =
      body.scholarsChildCount !== undefined
        ? Number(body.scholarsChildCount)
        : Number(plan.limits?.scholarsChildLimit) || 1;
    const effectiveScholarsChildCount =
      plan.appKey === "futurekids_all_access"
        ? clampAllAccessScholarsChildCount(
            Number.isFinite(requestedScholarsChildren)
              ? requestedScholarsChildren
              : 1,
          )
        : clampScholarsChildCount(
            Number.isFinite(requestedScholarsChildren)
              ? requestedScholarsChildren
              : 1,
          );

    // All Access: Scholars AI credits — one combined package per Scholars seat.
    const creditGens = clampGenerations(Number(body.scholarsGenerations ?? 0));
    const creditMins = clampTutorMinutes(Number(body.scholarsTutorMinutes ?? 0));

    let scholarsCreditAddon: {
      priceId: string;
      lookupKey: string;
      generations: number;
      tutorMinutes: number;
      seatCount: number;
    } | null = null;

    if (
      plan.appKey === "futurekids_all_access" &&
      (creditGens > 0 || creditMins > 0)
    ) {
      const creditPeriod = plan.interval === "year" ? "yearly" : "monthly";
      const lookupKey = scholarsCombinedLookupKey(
        creditGens,
        creditMins,
        creditPeriod,
      );
      const listed = await stripe.prices.list({
        lookup_keys: [lookupKey],
        active: true,
        limit: 1,
      });
      const creditPriceId = listed.data[0]?.id;
      if (!creditPriceId) {
        return NextResponse.json(
          {
            error: `Scholars credit price missing for ${lookupKey}. Run create-scholars-credit-prices.`,
          },
          { status: 500 },
        );
      }
      scholarsCreditAddon = {
        priceId: creditPriceId,
        lookupKey,
        generations: creditGens,
        tutorMinutes: creditMins,
        seatCount: effectiveScholarsChildCount,
      };
    }

    // Legacy Tutor/Study Guide seat add-ons (kept for old clients)
    const scholarsAddonSeats =
      plan.appKey === "futurekids_all_access" &&
      !scholarsCreditAddon &&
      scholarsTier &&
      scholarsTier !== "full" &&
      effectiveScholarsChildCount > 1
        ? effectiveScholarsChildCount - 1
        : 0;

    let scholarsAddon:
      | { planKey: string; priceId: string; quantity: number }
      | null = null;
    if (scholarsAddonSeats > 0 && scholarsTier) {
      const addonPlanKey =
        scholarsTier === "study_guide"
          ? plan.interval === "year"
            ? "scholars_study_guide_yearly"
            : "scholars_study_guide_monthly"
          : plan.interval === "year"
            ? "scholars_tutor_yearly"
            : "scholars_tutor_monthly";
      const addon = getServerCheckoutPlan(addonPlanKey);
      if (!addon?.priceId) {
        return NextResponse.json(
          { error: "Scholars add-on price is not configured" },
          { status: 500 },
        );
      }
      await assertStripePriceMatchesCatalog(stripe, addon.plan, addon.priceId);
      scholarsAddon = {
        planKey: addon.plan.planKey,
        priceId: addon.priceId,
        quantity: scholarsAddonSeats,
      };
    }

    if (
      ["earnly", "futurekids_all_access"].includes(plan.appKey) &&
      plan.childLimit !== null
    ) {
      const { data: family } = await supabase
        .from("families")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();
      if (family) {
        const [memberResult, accessResult] = await Promise.all([
          supabase
            .from("family_members")
            .select("user_id")
            .eq("family_id", family.id)
            .eq("role", "child"),
          supabase
            .from("family_child_app_access")
            .select("child_id, status")
            .eq("family_id", family.id)
            .eq("app_key", "earnly"),
        ]);
        const memberIds = new Set(
          (memberResult.data ?? []).map((member) => member.user_id),
        );
        // Ignore orphaned access rows for children no longer in the family.
        const accessRows = (accessResult.data ?? []).filter((access) =>
          memberIds.has(access.child_id),
        );
        const activeChildren = requiredFamilyChildCount(
          accessRows.map((access) => access.status),
          memberIds.size,
        );
        if (effectiveChildCount < activeChildren) {
          return NextResponse.json(
            {
              error: `Your family has ${activeChildren} active ${
                activeChildren === 1 ? "child" : "children"
              }. Choose a plan covering all of them or schedule a child-limit change first.`,
              code: "FAMILY_CHILD_LIMIT_REQUIRED",
              minimumChildCount: activeChildren,
            },
            { status: 409 },
          );
        }
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const admin = createAdminClient();
    let customerId: string;
    try {
      customerId = await ensureStripeCustomerId({
        stripe,
        userId: user.id,
        existingCustomerId: profile?.stripe_customer_id,
        email: user.email ?? profile?.email,
        name:
          profile?.full_name ??
          (user.user_metadata?.full_name as string | undefined) ??
          null,
        persist: async (nextCustomerId) => {
          const { error: customerLinkError } = await admin.rpc(
            "set_profile_stripe_customer_id",
            {
              p_user_id: user.id,
              p_stripe_customer_id: nextCustomerId,
            },
          );
          if (customerLinkError) {
            console.error("[checkout] failed to persist Stripe customer", {
              userId: user.id,
              code: customerLinkError.code,
            });
            throw new Error("Could not link billing profile");
          }
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Could not link billing profile"
      ) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      throw error;
    }

    const sharedMetadata: Record<string, string> = {
      future_kids_user_id: user.id,
      app_key: plan.appKey,
      plan_key: plan.planKey,
      entitlement: plan.appKey,
      child_count: String(effectiveChildCount),
      tinypal_child_count: String(
        Number(plan.limits?.tinypalChildLimit) ||
          (plan.appKey === "tinypal" ? effectiveChildCount : 1),
      ),
      scholars_child_count: String(
        plan.appKey === "futurekids_all_access"
          ? effectiveScholarsChildCount
          : Number(plan.limits?.scholarsChildLimit) ||
              (plan.appKey === "scholars" ? effectiveChildCount : 1),
      ),
      ...(scholarsTier ? { scholars_tier: scholarsTier } : {}),
      ...(scholarsAddon
        ? {
            scholars_addon_plan_key: scholarsAddon.planKey,
            scholars_addon_quantity: String(scholarsAddon.quantity),
          }
        : {}),
      ...(scholarsCreditAddon
        ? {
            credit_checkout: "true",
            credit_period: plan.interval === "year" ? "yearly" : "monthly",
            credit_held_by: "parent",
            child_user_id: user.id,
            parent_user_id: user.id,
            grant_generations: String(
              scholarsCreditAddon.generations * scholarsCreditAddon.seatCount,
            ),
            grant_tutor_minutes: String(
              scholarsCreditAddon.tutorMinutes * scholarsCreditAddon.seatCount,
            ),
            credit_lookup_key: scholarsCreditAddon.lookupKey,
            credit_seat_count: String(scholarsCreditAddon.seatCount),
            scholars_child_count: String(scholarsCreditAddon.seatCount),
          }
        : {}),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: lineItemQuantity,
        },
        ...(scholarsAddon
          ? [
              {
                price: scholarsAddon.priceId,
                quantity: scholarsAddon.quantity,
              },
            ]
          : []),
        ...(scholarsCreditAddon
          ? [
              {
                price: scholarsCreditAddon.priceId,
                quantity: scholarsCreditAddon.seatCount,
              },
            ]
          : []),
      ],
      success_url: `${origin}/account?checkout=success&app=${plan.appKey}`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      metadata: sharedMetadata,
      subscription_data: {
        metadata: sharedMetadata,
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
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
