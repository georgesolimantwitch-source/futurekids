import { NextResponse } from "next/server";
import {
  appleTransactionToSubscription,
  verifyAppleTransaction,
} from "@/lib/subscriptions/apple";
import { requireBearerUser, SubscriptionAuthError } from "@/lib/subscriptions/auth";
import { applyVerifiedSubscriptionEvent } from "@/lib/subscriptions/store";
import { isAppKey, type AppKey } from "@/lib/subscriptions/product-catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { user } = await requireBearerUser(request);
    const body = (await request.json()) as {
      appKey?: unknown;
      signedTransaction?: unknown;
    };
    if (
      typeof body.appKey !== "string" ||
      !isAppKey(body.appKey) ||
      body.appKey === "futurekids_all_access" ||
      typeof body.signedTransaction !== "string"
    ) {
      return NextResponse.json(
        { error: "Valid appKey and signedTransaction are required" },
        { status: 400 },
      );
    }

    const appKey = body.appKey as AppKey;
    const transaction = await verifyAppleTransaction(
      appKey,
      body.signedTransaction,
    );
    if (!transaction.transactionId) throw new Error("Apple transaction ID is missing");
    const subscription = appleTransactionToSubscription(
      transaction,
      user.id,
      appKey,
    );

    const application = await applyVerifiedSubscriptionEvent(
      {
        eventId: transaction.transactionId,
        eventType: "client_verification",
        occurredAt: transaction.signedDate
          ? new Date(transaction.signedDate).toISOString()
          : undefined,
      },
      subscription,
    );

    return NextResponse.json({
      access: {
        hasAccess: ["active", "trialing", "grace_period"].includes(
          subscription.status,
        ),
        appKey: subscription.appKey,
        planKey: subscription.planKey,
        tierKey: subscription.tierKey,
        features: subscription.features,
        limits: subscription.limits,
        childLimit: subscription.childLimit,
        provider: subscription.provider,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        manageWith: "app_store",
      },
      outcome: application.outcome,
    });
  } catch (error) {
    const authError = error instanceof SubscriptionAuthError ? error : null;
    return NextResponse.json(
      { error: authError?.message ?? "Apple purchase verification failed" },
      { status: authError?.status ?? 400 },
    );
  }
}
