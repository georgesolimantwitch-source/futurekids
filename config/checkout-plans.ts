import type { AppSlug } from "./brand";
import {
  clampEarnlyChildCount,
  type EarnlyBillingPeriod,
} from "./earnly-pricing";
import type { ScholarsTierId } from "./scholars-pricing";

export function earnlyPlanKey(
  childCount: number,
  period: EarnlyBillingPeriod,
): string {
  return `earnly_kids${clampEarnlyChildCount(childCount)}_${period}`;
}

export function allAccessPlanKey(
  childCount: number,
  period: EarnlyBillingPeriod,
): string {
  return `futurekids_all_access_kids${childCount}_${period}`;
}

export function individualAppPlanKey(
  app: AppSlug,
  period: EarnlyBillingPeriod,
  scholarsTier: ScholarsTierId = "full",
  childCount = 1,
): string {
  if (app === "earnly") return earnlyPlanKey(childCount, period);
  if (app === "ballr") return `ballr_${period}`;
  if (app === "tinypal") return `tinypal_${period}`;

  const tier =
    scholarsTier === "study_guide" ? "study_guide" : scholarsTier;
  return `scholars_${tier === "full" ? "all_access" : tier}_${period}`;
}

