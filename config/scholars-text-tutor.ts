/**
 * Unlimited text tutor — matches App Store products:
 * com.scholarsnotes.tutor.text.monthly / .yearly
 */

export type ScholarsTextTutorPeriod = "monthly" | "yearly";

export const scholarsTextTutorPricing = {
  monthly: 14.99,
  /** Matches App Store / StoreKit `com.scholarsnotes.tutor.text.yearly`. */
  yearly: 99.99,
} as const;

export function scholarsTextTutorPlanKey(
  period: ScholarsTextTutorPeriod,
): string {
  return `scholars_text_tutor_${period}`;
}

export function scholarsTextTutorLookupKey(
  period: ScholarsTextTutorPeriod,
): string {
  return `com.scholarsnotes.tutor.text.${period}`;
}

export function scholarsTextTutorPrice(period: ScholarsTextTutorPeriod): number {
  return scholarsTextTutorPricing[period];
}

export function scholarsTextTutorPriceLine(
  period: ScholarsTextTutorPeriod,
): string {
  const amount = scholarsTextTutorPrice(period);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
  return period === "monthly" ? `${formatted}/mo` : `${formatted}/yr`;
}

export function isScholarsTextTutorPlanKey(planKey: string): boolean {
  return (
    planKey === "scholars_text_tutor_monthly" ||
    planKey === "scholars_text_tutor_yearly"
  );
}
