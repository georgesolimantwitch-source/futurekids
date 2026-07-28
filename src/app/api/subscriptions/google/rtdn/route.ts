import { NextResponse } from "next/server";
import { syncEarnlyChildAccess } from "@/lib/subscriptions/earnly-sync";
import {
  decodeGoogleRtdn,
  verifyGooglePubSubBearer,
  verifyGooglePurchase,
} from "@/lib/subscriptions/google";
import {
  applyVerifiedSubscriptionEvent,
  findSubscriptionOwner,
} from "@/lib/subscriptions/store";

export const runtime = "nodejs";

interface PubSubPushBody {
  message?: {
    messageId?: string;
    data?: string;
    publishTime?: string;
  };
}

/**
 * Real-time Developer Notifications (RTDN) push endpoint.
 * Configure Google Cloud Pub/Sub → push to this URL with OIDC auth.
 */
export async function POST(request: Request) {
  let eventId: string | undefined;
  try {
    await verifyGooglePubSubBearer(request);
    const body = (await request.json()) as PubSubPushBody;
    eventId = body.message?.messageId;
    const encodedData = body.message?.data;
    if (!eventId || !encodedData) {
      throw new Error("Malformed Pub/Sub push");
    }

    const rtdn = decodeGoogleRtdn(encodedData);

    // Test messages from Play Console only need a 204.
    if (rtdn.testNotification) {
      return new NextResponse(null, { status: 204 });
    }

    const notice = rtdn.subscriptionNotification;
    const packageName = rtdn.packageName;
    const productId = notice?.subscriptionId;
    const purchaseToken = notice?.purchaseToken;
    if (!packageName || !productId || !purchaseToken) {
      // Non-subscription notices (OTP / voided) are acknowledged without entitlement writes.
      return new NextResponse(null, { status: 204 });
    }

    const userId = await findSubscriptionOwner("google", purchaseToken);
    if (!userId) {
      // Purchase not yet bound via client verify — ack so Pub/Sub does not retry forever.
      console.warn(
        "[google/rtdn] No Genlyn owner for purchase token; waiting for client verify",
        { productId, notificationType: notice.notificationType },
      );
      return new NextResponse(null, { status: 204 });
    }

    const verified = await verifyGooglePurchase({
      packageName,
      productId,
      purchaseToken,
      userId,
      appKey: "earnly",
    });

    await applyVerifiedSubscriptionEvent(
      {
        eventId,
        eventType: `rtdn:${notice.notificationType ?? "unknown"}`,
        occurredAt: rtdn.eventTimeMillis
          ? new Date(Number(rtdn.eventTimeMillis)).toISOString()
          : body.message?.publishTime,
      },
      verified.subscription,
    );

    if (verified.subscription.appKey === "earnly") {
      await syncEarnlyChildAccess(userId);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[google/rtdn]", error);
    return NextResponse.json(
      { error: "Google RTDN verification failed" },
      { status: 400 },
    );
  }
}
