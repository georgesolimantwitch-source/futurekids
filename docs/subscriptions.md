# Future Kids subscription contract

Stripe website purchases and verified Apple purchases write to
`public.user_entitlements`. Clients never grant access locally.

## Mobile access check

After authenticating with the shared Future Kids Supabase project, each app calls:

```swift
supabase.rpc("has_app_access", params: ["p_app_key": "tinypal"])
```

Use exactly one of `earnly`, `scholars`, `ballr`, or `tinypal`. The RPC returns:

```json
{
  "hasAccess": true,
  "appKey": "tinypal",
  "planKey": "tinypal_monthly",
  "tierKey": "family",
  "features": { "premium": true },
  "limits": {},
  "childLimit": null,
  "provider": "stripe",
  "status": "active",
  "currentPeriodEnd": "2026-08-18T20:00:00+00:00",
  "manageWith": "stripe"
}
```

Show the paywall unless `hasAccess` is exactly `true`. The RPC automatically
honors a valid `futurekids_all_access` entitlement.

## Apple purchases

Use the authenticated Supabase user UUID as StoreKit's `appAccountToken`.
The UUID contains no email or other personal data and is validated against the
authenticated bearer session on every verification request. A purchase must not
start without both a Future Kids session and a UUID account token.
Submit the signed transaction JWS and the host app key to
`POST /api/subscriptions/apple/verify` with the Supabase access token:

```json
{
  "appKey": "tinypal",
  "signedTransaction": "<StoreKit JWS>"
}
```

App Store Server Notification V2 URLs are:

- `https://kidsfuture.vercel.app/api/webhooks/apple/earnly`
- `https://kidsfuture.vercel.app/api/webhooks/apple/scholars`
- `https://kidsfuture.vercel.app/api/webhooks/apple/ballr`
- `https://kidsfuture.vercel.app/api/webhooks/apple/tinypal`

The Stripe webhook URL is
`https://kidsfuture.vercel.app/api/webhooks/stripe`. Replace this origin in
App Store Connect only after a custom production domain is live and verified.

For Restore Purchases, require authentication, run `AppStore.sync()`, iterate
verified `Transaction.currentEntitlements`, submit each relevant transaction JWS
to the verification endpoint, then refresh `has_app_access`. Do not finish a
transaction or unlock permanent access until the backend confirms it.

## Trusted Apple product mapping

Configure these server-only variables with the matching App Store Connect
product IDs. The backend derives every app, plan, tier, child limit, and feature
set from this catalog; client-provided access fields are ignored.

- Earnly: `APPLE_EARNLY_KIDS{1...6}_{MONTHLY|YEARLY}_PRODUCT_ID` maps to
  `earnly_kids{1...6}_{monthly|yearly}` and `app_key=earnly`.
- Scholars full: `APPLE_SCHOLARS_ALL_ACCESS_{MONTHLY|YEARLY}_PRODUCT_ID` maps to
  `scholars_all_access_{monthly|yearly}` and `app_key=scholars`.
- Scholars tutor: `APPLE_SCHOLARS_TUTOR_{MONTHLY|YEARLY}_PRODUCT_ID` maps to
  `scholars_tutor_{monthly|yearly}` and `app_key=scholars`.
- Scholars study guide:
  `APPLE_SCHOLARS_STUDY_GUIDE_{MONTHLY|YEARLY}_PRODUCT_ID` maps to
  `scholars_study_guide_{monthly|yearly}` and `app_key=scholars`.
- Ballr: `APPLE_BALLR_{MONTHLY|YEARLY}_PRODUCT_ID` maps to
  `ballr_{monthly|yearly}` and `app_key=ballr`.
- TinyPal: `APPLE_TINYPAL_{MONTHLY|YEARLY}_PRODUCT_ID` maps to
  `tinypal_{monthly|yearly}` and `app_key=tinypal`.
- Future Kids All Access:
  `APPLE_FUTUREKIDS_ALL_ACCESS_KIDS{1...6}_{MONTHLY|YEARLY}_PRODUCT_ID` maps to
  `futurekids_all_access_kids{1...6}_{monthly|yearly}` and
  `app_key=futurekids_all_access`.

## Lifecycle and precedence

Stripe webhooks, authenticated Stripe reconciliation, Apple client
verifications, and App Store Server Notifications V2 all call the same atomic
event application function. Provider event IDs are idempotent, stale events
cannot overwrite newer state, and an original Apple transaction cannot move to
another Future Kids user. The effective-access RPC merges complementary feature
flags and selects the highest `entitlement_rank`; Future Kids All Access has the
highest rank without deleting individual provider subscriptions.

## Local Stripe sandbox

Put only `sk_test_...` and `pk_test_...` values in `.env.local`. The sandbox
catalog can be created or repaired idempotently with:

```bash
npx tsx scripts/setup-stripe-test-catalog.ts
```

Start an ngrok tunnel to port 3000, then run:

```bash
npx tsx scripts/start-stripe-sandbox.ts
```

The start script replaces its previous test webhook endpoint, registers the
current HTTPS tunnel, and starts Next.js with the returned signing secret.
Sandbox checkout is rejected on non-local hosts; only Stripe webhooks may use
the tunnel. Use Stripe test card `4242 4242 4242 4242`, any future expiration,
and any CVC. Test entitlements should use a dedicated Future Kids test account.
