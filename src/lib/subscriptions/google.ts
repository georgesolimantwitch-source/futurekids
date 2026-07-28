import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import {
  statusFromGoogleSubscriptionState,
  type VerifiedSubscription,
} from "./catalog";
import {
  findPlanByGoogleProductAndBasePlan,
  getProductPlanByCatalogId,
  type AppKey,
} from "./product-catalog";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function expectedPackageName(appKey: AppKey = "earnly"): string {
  if (appKey === "earnly") {
    return (
      process.env.GOOGLE_PLAY_PACKAGE_NAME_EARNLY?.trim() || "com.earnly.family"
    );
  }
  if (appKey === "fresher") {
    return (
      process.env.GOOGLE_PLAY_PACKAGE_NAME_FRESHER?.trim() || "com.fresher.app"
    );
  }
  throw new Error(`Google Play package is not configured for ${appKey}`);
}

function androidPublisher() {
  const email = required("GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL");
  const key = required("GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY").replace(
    /\\n/g,
    "\n",
  );
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  return google.androidpublisher({ version: "v3", auth });
}

export interface GoogleRtdnPayload {
  version?: string;
  packageName?: string;
  eventTimeMillis?: string;
  subscriptionNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    subscriptionId?: string;
  };
  oneTimeProductNotification?: Record<string, unknown>;
  voidedPurchaseNotification?: Record<string, unknown>;
  testNotification?: Record<string, unknown>;
}

export function decodeGoogleRtdn(encodedData: string): GoogleRtdnPayload {
  const json = Buffer.from(encodedData, "base64").toString("utf8");
  return JSON.parse(json) as GoogleRtdnPayload;
}

/**
 * Validates the OIDC bearer token that Google Pub/Sub attaches to push deliveries.
 * Audience must equal the full HTTPS push endpoint URL configured in Pub/Sub.
 */
export async function verifyGooglePubSubBearer(request: Request): Promise<void> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new Error("Missing Google Pub/Sub bearer token");
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) throw new Error("Missing Google Pub/Sub bearer token");

  const audience = required("GOOGLE_PUBSUB_PUSH_AUDIENCE");
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience,
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw new Error("Google Pub/Sub token email is not verified");
  }
  const expectedEmail = process.env.GOOGLE_PUBSUB_SERVICE_ACCOUNT_EMAIL?.trim();
  if (expectedEmail && payload.email !== expectedEmail) {
    throw new Error("Google Pub/Sub token service account mismatch");
  }
}

export async function verifyGooglePurchase(input: {
  packageName: string;
  productId: string;
  purchaseToken: string;
  userId: string;
  basePlanId?: string | null;
  appKey?: AppKey;
}): Promise<{
  subscription: VerifiedSubscription;
  latestOrderId: string | null;
  acknowledgementState: string | null;
  subscriptionState: string | null;
}> {
  const appKey = input.appKey ?? "earnly";
  const expectedPackage = expectedPackageName(appKey);
  if (input.packageName !== expectedPackage) {
    throw new Error("Google Play package name does not match this app");
  }
  if (!input.purchaseToken.trim()) {
    throw new Error("purchaseToken is required");
  }

  const publisher = androidPublisher();
  const { data } = await publisher.purchases.subscriptionsv2.get({
    packageName: input.packageName,
    token: input.purchaseToken,
  });

  const lineItem =
    data.lineItems?.find((item) => item.productId === input.productId) ??
    data.lineItems?.[0];
  if (!lineItem?.productId) {
    throw new Error("Google purchase has no subscription line item");
  }

  const basePlanId =
    lineItem.offerDetails?.basePlanId?.trim() ||
    input.basePlanId?.trim() ||
    null;

  if (
    input.basePlanId &&
    input.basePlanId.trim() &&
    basePlanId &&
    input.basePlanId.trim() !== basePlanId
  ) {
    throw new Error("Selected base plan does not match the Google purchase");
  }

  const plan =
    (basePlanId
      ? findPlanByGoogleProductAndBasePlan(lineItem.productId, basePlanId)
      : null) ?? getProductPlanByCatalogId(lineItem.productId);

  if (
    !plan ||
    (plan.appKey !== appKey && plan.appKey !== "futurekids_all_access")
  ) {
    throw new Error("Google product/base plan is not mapped to this app");
  }

  if (
    !basePlanId &&
    (lineItem.productId === "earnly.premium.monthly" ||
      lineItem.productId === "earnly.premium.yearly")
  ) {
    throw new Error("Google purchase is missing basePlanId");
  }

  const storedBasePlanId =
    basePlanId ?? plan.googleBasePlanId ?? plan.legacyCatalogId;

  if (data.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
    await publisher.purchases.subscriptions.acknowledge({
      packageName: input.packageName,
      subscriptionId: lineItem.productId,
      token: input.purchaseToken,
    });
  }

  const expiryTime = lineItem.expiryTime ?? null;
  const startTime = data.startTime ?? null;
  const autoRenewing =
    lineItem.autoRenewingPlan?.autoRenewEnabled ??
    data.canceledStateContext == null;

  return {
    subscription: {
      userId: input.userId,
      appKey: plan.appKey,
      planKey: plan.planKey,
      provider: "google",
      providerCustomerId: null,
      providerSubscriptionId: input.purchaseToken,
      providerProductId: lineItem.productId,
      providerPriceId: storedBasePlanId,
      status: statusFromGoogleSubscriptionState(
        data.subscriptionState,
        expiryTime,
      ),
      currentPeriodStart: startTime ? new Date(startTime).toISOString() : null,
      currentPeriodEnd: expiryTime ? new Date(expiryTime).toISOString() : null,
      cancelAtPeriodEnd:
        data.subscriptionState === "SUBSCRIPTION_STATE_CANCELED" ||
        autoRenewing === false,
      quantity: 1,
      tierKey: plan.tierKey,
      entitlementRank: plan.entitlementRank,
      childLimit: plan.childLimit,
      limits: plan.limits,
      features: plan.features,
      currentTransactionId: data.latestOrderId ?? null,
      environment: data.testPurchase ? "Sandbox" : "Production",
      autoRenewStatus: autoRenewing ?? null,
    },
    latestOrderId: data.latestOrderId ?? null,
    acknowledgementState: data.acknowledgementState ?? null,
    subscriptionState: data.subscriptionState ?? null,
  };
}
