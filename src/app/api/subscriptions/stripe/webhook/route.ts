/**
 * Legacy path — Stripe webhooks are handled at `/api/webhooks/stripe`.
 * Keep this route as an alias so older endpoint configs still work.
 */
export const runtime = "nodejs";

export { POST } from "@/app/api/webhooks/stripe/route";
