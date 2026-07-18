import {
  Environment,
  SignedDataVerifier,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";
import { statusFromAppleTransaction, type VerifiedSubscription } from "./catalog";
import { findPlanByAppleProductId, type AppKey } from "./product-catalog";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function hostPrefix(appKey: AppKey): string {
  if (appKey === "futurekids_all_access") throw new Error("A host app is required");
  return appKey.toUpperCase();
}

function appConfig(appKey: AppKey) {
  const prefix = hostPrefix(appKey);
  const appAppleId = Number(required(`APPLE_${prefix}_APP_ID`));
  if (!Number.isSafeInteger(appAppleId)) throw new Error("Apple app ID must be numeric");
  return {
    bundleId: required(`APPLE_${prefix}_BUNDLE_ID`),
    appAppleId,
  };
}

function roots(): Buffer[] {
  return required("APPLE_ROOT_CA_BASE64")
    .split(",")
    .map((value) => Buffer.from(value.trim(), "base64"));
}

function verifiers(appKey: AppKey): SignedDataVerifier[] {
  const { bundleId, appAppleId } = appConfig(appKey);
  const mode = (process.env.APPLE_ENVIRONMENT ?? "Production").toLowerCase();
  const onlineChecks = process.env.APPLE_ENABLE_ONLINE_CHECKS !== "false";
  const result: SignedDataVerifier[] = [];
  if (mode === "production" || mode === "both") {
    result.push(
      new SignedDataVerifier(
        roots(),
        onlineChecks,
        Environment.PRODUCTION,
        bundleId,
        appAppleId,
      ),
    );
  }
  if (mode === "sandbox" || mode === "both") {
    result.push(
      new SignedDataVerifier(roots(), onlineChecks, Environment.SANDBOX, bundleId),
    );
  }
  return result;
}

async function verify<T>(
  appKey: AppKey,
  operation: (verifier: SignedDataVerifier) => Promise<T>,
): Promise<T> {
  let cause: unknown;
  for (const verifier of verifiers(appKey)) {
    try {
      return await operation(verifier);
    } catch (error) {
      cause = error;
    }
  }
  throw new Error("Apple signed-data verification failed", { cause });
}

export function verifyAppleTransaction(appKey: AppKey, signedTransaction: string) {
  return verify(appKey, (verifier) =>
    verifier.verifyAndDecodeTransaction(signedTransaction),
  );
}

export function verifyAppleNotification(
  appKey: AppKey,
  signedPayload: string,
): Promise<ResponseBodyV2DecodedPayload> {
  return verify(appKey, (verifier) =>
    verifier.verifyAndDecodeNotification(signedPayload),
  );
}

export function verifyAppleRenewalInfo(appKey: AppKey, signedRenewalInfo: string) {
  return verify(appKey, (verifier) =>
    verifier.verifyAndDecodeRenewalInfo(signedRenewalInfo),
  );
}

export function appleTransactionToSubscription(
  transaction: JWSTransactionDecodedPayload,
  userId: string,
  hostAppKey: AppKey,
  notificationStatus?: number,
  autoRenewStatus?: boolean,
): VerifiedSubscription {
  if (transaction.bundleId !== appConfig(hostAppKey).bundleId) {
    throw new Error("Apple bundle does not match the host app");
  }
  const plan = transaction.productId
    ? findPlanByAppleProductId(transaction.productId)
    : null;
  if (
    !plan ||
    (plan.appKey !== hostAppKey && plan.appKey !== "futurekids_all_access")
  ) {
    throw new Error("Apple product is not mapped to this app");
  }
  if (
    !transaction.originalTransactionId ||
    !transaction.appAccountToken ||
    transaction.appAccountToken.toLowerCase() !== userId.toLowerCase()
  ) {
    throw new Error("Apple purchase is not linked to this Future Kids account");
  }

  return {
    userId,
    appKey: plan.appKey,
    planKey: plan.planKey,
    provider: "apple",
    providerCustomerId: null,
    providerSubscriptionId: transaction.originalTransactionId,
    providerProductId: transaction.productId ?? null,
    providerPriceId: transaction.productId ?? null,
    status: statusFromAppleTransaction({
      expiresDate: transaction.expiresDate,
      revocationDate: transaction.revocationDate,
      isUpgraded: transaction.isUpgraded,
      notificationStatus,
    }),
    currentPeriodStart: transaction.purchaseDate
      ? new Date(transaction.purchaseDate).toISOString()
      : null,
    currentPeriodEnd: transaction.expiresDate
      ? new Date(transaction.expiresDate).toISOString()
      : null,
    cancelAtPeriodEnd: autoRenewStatus === false,
    quantity: Math.max(1, transaction.quantity ?? 1),
    tierKey: plan.tierKey,
    entitlementRank: plan.entitlementRank,
    childLimit: plan.childLimit,
    limits: plan.limits,
    features: plan.features,
    currentTransactionId: transaction.transactionId ?? null,
    environment: transaction.environment?.toString() ?? null,
    autoRenewStatus: autoRenewStatus ?? null,
  };
}
