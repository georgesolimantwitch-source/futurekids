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

- `https://genlyn.app/api/webhooks/apple/earnly`
- `https://genlyn.app/api/webhooks/apple/scholars`
- `https://genlyn.app/api/webhooks/apple/ballr`
- `https://genlyn.app/api/webhooks/apple/tinypal`

The Stripe webhook URL is
`https://genlyn.app/api/webhooks/stripe`. Replace this origin in
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

## Family child-limit changes

Earnly and Future Kids All Access use fixed 1–6 child tiers. Existing Stripe
subscriptions are changed in place through
`POST /api/subscriptions/stripe/change-plan`; checkout is only for a new app
subscription.

- Same-interval child-count upgrades apply immediately with Stripe prorating.
- Child-count reductions and monthly/yearly changes use a Stripe Subscription
  Schedule at the current period end.
- A downgrade requires the parent to select exactly which children remain
  active. Unselected Earnly profiles, wallets, chores, savings, and history are
  retained and marked `paused_by_plan` only when the scheduled phase begins.
- `DELETE /api/subscriptions/stripe/change-plan` releases the schedule without
  canceling the underlying subscription.
- Schedule webhook events and ordinary subscription updates both reconcile the
  canonical entitlement ledger. Effective child access is the union of valid
  Earnly and All Access entitlements, so a weaker plan cannot pause access
  granted by a stronger plan.

For cross-project enforcement, configure `EARNLY_BRIDGE_URL` and the same
server-only `ENTITLEMENT_SYNC_SECRET` in the website and Earnly Edge Function.

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

## Google Play (Earnly Android)

Catalog (Play Console):

- Product `earnly.premium.monthly` with base plans `kids1`…`kids6`
- Product `earnly.premium.yearly` with base plans `kids1`…`kids6`

Server mapping: `{productId, basePlanId}` → `earnly_kids{N}_{monthly|yearly}` with
`provider=google`. `provider_product_id` stores the Play product ID;
`provider_price_id` stores the base plan ID; `provider_subscription_id` stores
the purchase token.

Client flow:

1. Query the two subscription product IDs.
2. Match `basePlanId` for the selected child count.
3. Launch billing with that offer’s `offerToken`.
4. On `PurchaseState.PURCHASED`, POST to
   `/api/subscriptions/google/verify` with bearer auth:
   `{ packageName, productId, purchaseToken, basePlanId, appKey: "earnly" }`.
5. After server success, acknowledge locally if still needed, then refresh
   `user_entitlements` (never trust client-only unlock).

RTDN endpoint: `POST /api/subscriptions/google/rtdn`

### Manual Google Cloud + Play Console setup

1. **Google Cloud project** linked to the Play Console developer account.
2. Enable **Google Play Android Developer API**.
3. Create a **service account**, download JSON, grant Play Console
   **Admin / Financial / View financial data / Manage orders** (or equivalent
   monetization permissions) under Users and permissions → Invite users →
   Service account.
4. Set server env vars (never in the Android app):
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY` (PEM with `\n` escapes)
   - `GOOGLE_PLAY_PACKAGE_NAME_EARNLY=com.earnly.family`
5. Create a **Pub/Sub topic** (e.g. `earnly-play-rtdn`).
6. Grant `google-play-developer-notifications@system.gserviceaccount.com`
   **Pub/Sub Publisher** on that topic.
7. Create a **push subscription** to
   `https://kidsfuture.vercel.app/api/subscriptions/google/rtdn`
   (or your production Genlyn origin) with **OIDC authentication** enabled.
   Audience must equal that full URL; set the same value as
   `GOOGLE_PUBSUB_PUSH_AUDIENCE`. Optionally set
   `GOOGLE_PUBSUB_SERVICE_ACCOUNT_EMAIL` to the push authenticator email.
8. In Play Console → Monetize → Monetization setup → **Real-time developer
   notifications**, select the topic and send a test notification.
9. License testers + internal testing track for purchase QA.
