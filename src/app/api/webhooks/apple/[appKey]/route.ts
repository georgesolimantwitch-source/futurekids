import { NextResponse } from "next/server";
import {
  appleTransactionToSubscription,
  verifyAppleNotification,
  verifyAppleRenewalInfo,
  verifyAppleTransaction,
} from "@/lib/subscriptions/apple";
import {
  applyVerifiedSubscriptionEvent,
  findSubscriptionOwner,
  getVerifiedSubscriptionSnapshot,
} from "@/lib/subscriptions/store";
import { isAppKey, type AppKey } from "@/lib/subscriptions/product-catalog";
import { statusFromAppleTransaction } from "@/lib/subscriptions/catalog";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ appKey: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { appKey: rawAppKey } = await context.params;
  if (!isAppKey(rawAppKey) || rawAppKey === "futurekids_all_access") {
    return NextResponse.json({ error: "Unknown app key" }, { status: 404 });
  }
  const appKey = rawAppKey as AppKey;

  let eventId: string | undefined;
  try {
    const body: unknown = await request.json();
    const signedPayload =
      body && typeof body === "object" && "signedPayload" in body
        ? (body as { signedPayload?: unknown }).signedPayload
        : undefined;
    if (typeof signedPayload !== "string" || !signedPayload) {
      return NextResponse.json({ error: "signedPayload is required" }, { status: 400 });
    }

    const notification = await verifyAppleNotification(appKey, signedPayload);
    eventId = notification.notificationUUID;
    if (!eventId) throw new Error("Apple notification has no notificationUUID");

    const signedTransaction = notification.data?.signedTransactionInfo;
    const signedRenewalInfo = notification.data?.signedRenewalInfo;
    const transaction = signedTransaction
      ? await verifyAppleTransaction(appKey, signedTransaction)
      : undefined;
    const renewalInfo = signedRenewalInfo
      ? await verifyAppleRenewalInfo(appKey, signedRenewalInfo)
      : undefined;
    const providerSubscriptionId =
      transaction?.originalTransactionId ?? renewalInfo?.originalTransactionId;
    const tokenOwner = transaction?.appAccountToken;
    const existingOwner = providerSubscriptionId
      ? await findSubscriptionOwner("apple", providerSubscriptionId)
      : null;

    if (
      tokenOwner &&
      existingOwner &&
      tokenOwner.toLowerCase() !== existingOwner.toLowerCase()
    ) {
      throw new Error("Apple notification user binding conflicts with the ledger");
    }

    const userId = tokenOwner ?? existingOwner ?? undefined;
    if (transaction && userId) {
      const entitlement = appleTransactionToSubscription(
        transaction,
        userId,
        appKey,
        typeof notification.data?.status === "number"
          ? notification.data.status
          : undefined,
        renewalInfo?.autoRenewStatus == null
          ? undefined
          : renewalInfo.autoRenewStatus === 1,
      );
      await applyVerifiedSubscriptionEvent(
        {
          eventId,
          eventType: notification.notificationType?.toString() ?? "unknown",
          eventSubtype: notification.subtype?.toString() ?? null,
          occurredAt: notification.signedDate
            ? new Date(notification.signedDate).toISOString()
            : null,
        },
        entitlement,
      );
    } else if (providerSubscriptionId && userId) {
      const snapshot = await getVerifiedSubscriptionSnapshot(
        "apple",
        providerSubscriptionId,
      );
      if (snapshot) {
        const notificationStatus =
          typeof notification.data?.status === "number"
            ? notification.data.status
            : undefined;
        await applyVerifiedSubscriptionEvent(
          {
            eventId,
            eventType: notification.notificationType?.toString() ?? "unknown",
            eventSubtype: notification.subtype?.toString() ?? null,
            occurredAt: notification.signedDate
              ? new Date(notification.signedDate).toISOString()
              : null,
          },
          {
            ...snapshot,
            status:
              notificationStatus == null
                ? snapshot.status
                : statusFromAppleTransaction({
                    expiresDate: snapshot.currentPeriodEnd
                      ? Date.parse(snapshot.currentPeriodEnd)
                      : undefined,
                    notificationStatus,
                  }),
            cancelAtPeriodEnd:
              renewalInfo?.autoRenewStatus == null
                ? snapshot.cancelAtPeriodEnd
                : renewalInfo.autoRenewStatus !== 1,
            autoRenewStatus:
              renewalInfo?.autoRenewStatus == null
                ? snapshot.autoRenewStatus
                : renewalInfo.autoRenewStatus === 1,
          },
        );
      }
    } else if (!transaction) {
      console.info("[apple-webhook] verified notification has no transaction", {
        eventId,
        appKey,
        type: notification.notificationType?.toString() ?? "unknown",
      });
    }

    console.info("[apple-webhook] notification processed", {
      eventId,
      appKey,
      type: notification.notificationType?.toString() ?? "unknown",
      userLinked: Boolean(userId),
    });
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[apple-webhook] notification failed", {
      eventId,
      appKey,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Apple notification verification failed" },
      { status: 400 },
    );
  }
}

