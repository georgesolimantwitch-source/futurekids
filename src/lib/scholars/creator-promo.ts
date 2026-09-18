import type Stripe from "stripe";
import { getStripe } from "@/lib/subscriptions/stripe";

const COUPON_META_KEY = "scholars_creator_web_discount";
const COUPON_NAME = "Scholars creator code — 10% off";
const PERCENT_OFF = 10;

/**
 * Shared 10% once coupon for Scholars web checkout via creator vanity codes.
 * Idempotent: reuses an existing active coupon tagged with our metadata.
 */
export async function ensureScholarsCreatorCoupon(
  stripe: Stripe = getStripe(),
): Promise<Stripe.Coupon> {
  const listed = await stripe.coupons.list({ limit: 100 });
  const existing = listed.data.find(
    (c) =>
      c.valid &&
      c.percent_off === PERCENT_OFF &&
      c.duration === "once" &&
      c.metadata?.[COUPON_META_KEY] === "true",
  );
  if (existing) return existing;

  return stripe.coupons.create({
    percent_off: PERCENT_OFF,
    duration: "once",
    name: COUPON_NAME,
    metadata: {
      [COUPON_META_KEY]: "true",
      app_key: "scholars",
    },
  });
}

/**
 * Ensure a Stripe Promotion Code whose code equals the creator vanity code.
 * Returns the promotion_code id to auto-apply on Checkout.
 */
export async function ensureCreatorPromotionCode(
  vanityCode: string,
  stripe: Stripe = getStripe(),
): Promise<string> {
  const code = vanityCode.trim().toUpperCase().replace(/\s+/g, "");
  if (code.length < 2) {
    throw new Error("Invalid creator code");
  }

  const existing = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
  });
  if (existing.data[0]?.id) return existing.data[0].id;

  const coupon = await ensureScholarsCreatorCoupon(stripe);

  try {
    const created = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      active: true,
      metadata: {
        app_key: "scholars",
        creator_code: code,
        scholars_creator_web_discount: "true",
      },
    });
    return created.id;
  } catch (error) {
    // Race: another request created it; re-list.
    const again = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
    });
    if (again.data[0]?.id) return again.data[0].id;
    throw error;
  }
}
