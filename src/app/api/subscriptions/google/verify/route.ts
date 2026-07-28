import { NextResponse } from "next/server";
import { requireBearerUser, SubscriptionAuthError } from "@/lib/subscriptions/auth";
import { syncEarnlyChildAccess } from "@/lib/subscriptions/earnly-sync";
import { verifyGooglePurchase } from "@/lib/subscriptions/google";
import { applyVerifiedSubscriptionEvent } from "@/lib/subscriptions/store";
import { isAppKey, type AppKey } from "@/lib/subscriptions/product-catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { user } = await requireBearerUser(request);
    const body = (await request.json()) as {
      packageName?: unknown;
      productId?: unknown;
      purchaseToken?: unknown;
      basePlanId?: unknown;
      appKey?: unknown;
    };

    if (
      typeof body.packageName !== "string" ||
      typeof body.productId !== "string" ||
      typeof body.purchaseToken !== "string" ||
      !body.purchaseToken.trim()
    ) {
      return NextResponse.json(
        { error: "packageName, productId, and purchaseToken are required" },
        { status: 400 },
      );
    }

    const appKey: AppKey =
      typeof body.appKey === "string" && isAppKey(body.appKey)
        ? body.appKey
        : "earnly";
    if (appKey === "futurekids_all_access") {
      return NextResponse.json(
        { error: "A host app key is required for Google verification" },
        { status: 400 },
      );
    }

    const verified = await verifyGooglePurchase({
      packageName: body.packageName,
      productId: body.productId,
      purchaseToken: body.purchaseToken,
      basePlanId:
        typeof body.basePlanId === "string" ? body.basePlanId : null,
      userId: user.id,
      appKey,
    });

    const eventId =
      verified.latestOrderId ??
      `google-verify:${body.purchaseToken.slice(0, 48)}`;

    const application = await applyVerifiedSubscriptionEvent(
      {
        eventId,
        eventType: "client_verification",
        occurredAt: new Date().toISOString(),
      },
      verified.subscription,
    );

    if (verified.subscription.appKey === "earnly") {
      await syncEarnlyChildAccess(user.id);
    }

    return NextResponse.json({
      access: {
        hasAccess: ["active", "trialing", "grace_period"].includes(
          verified.subscription.status,
        ),
        appKey: verified.subscription.appKey,
        planKey: verified.subscription.planKey,
        tierKey: verified.subscription.tierKey,
        features: verified.subscription.features,
        limits: verified.subscription.limits,
        childLimit: verified.subscription.childLimit,
        provider: verified.subscription.provider,
        status: verified.subscription.status,
        currentPeriodEnd: verified.subscription.currentPeriodEnd,
        productId: verified.subscription.providerProductId,
        basePlanId: verified.subscription.providerPriceId,
        manageWith: "google_play",
      },
      outcome: application.outcome,
    });
  } catch (error) {
    const authError = error instanceof SubscriptionAuthError ? error : null;
    const message =
      authError?.message ??
      (error instanceof Error ? error.message : "Google purchase verification failed");
    console.error("[google/verify]", message, error);
    return NextResponse.json(
      { error: message },
      { status: authError?.status ?? 400 },
    );
  }
}
