import type { AppSlug } from "./brand";
import {
  clampEarnlyChildCount,
  type EarnlyBillingPeriod,
} from "./earnly-pricing";
import { clampBallrChildCount } from "./ballr-pricing";
import {
  clampScholarsChildCount,
  type ScholarsTierId,
} from "./scholars-pricing";
import { clampTinyPalChildCount } from "./tinypal-pricing";
import { normalizeBundleSeats } from "./ecosystem-bundle";

export function earnlyPlanKey(
  childCount: number,
  period: EarnlyBillingPeriod,
): string {
  return `earnly_kids${clampEarnlyChildCount(childCount)}_${period}`;
}

export function tinypalPlanKey(
  childCount: number,
  period: EarnlyBillingPeriod,
): string {
  return `tinypal_kids${clampTinyPalChildCount(childCount)}_${period}`;
}

export function ballrPlanKey(
  childCount: number,
  period: EarnlyBillingPeriod,
): string {
  const count = clampBallrChildCount(childCount);
  if (count === 1) return `ballr_${period}`;
  return `ballr_kids${count}_${period}`;
}

export function scholarsFullPlanKey(
  childCount: number,
  period: EarnlyBillingPeriod,
): string {
  const count = clampScholarsChildCount(childCount);
  if (count === 1) return `scholars_all_access_${period}`;
  return `scholars_all_access_kids${count}_${period}`;
}

export function allAccessPlanKey(
  earnlyChildCount: number,
  period: EarnlyBillingPeriod,
  tinypalChildCount = 1,
  scholarsChildCount = 1,
  ballrChildCount = 1,
): string {
  const seats = normalizeBundleSeats({
    earnly: earnlyChildCount,
    tinypal: tinypalChildCount,
    scholars: scholarsChildCount,
    ballr: ballrChildCount,
  });
  if (seats.scholars === 1 && seats.ballr === 1 && seats.tinypal === 1) {
    return `futurekids_all_access_kids${seats.earnly}_${period}`;
  }
  if (seats.scholars === 1 && seats.ballr === 1) {
    return `futurekids_all_access_earnly${seats.earnly}_tinypal${seats.tinypal}_${period}`;
  }
  return `futurekids_all_access_e${seats.earnly}_s${seats.scholars}_b${seats.ballr}_t${seats.tinypal}_${period}`;
}

export function individualAppPlanKey(
  app: AppSlug,
  period: EarnlyBillingPeriod,
  scholarsTier: ScholarsTierId = "full",
  childCount = 1,
): string {
  if (app === "earnly") return earnlyPlanKey(childCount, period);
  if (app === "ballr") return ballrPlanKey(childCount, period);
  if (app === "tinypal") return tinypalPlanKey(childCount, period);
  if (app === "fresher") return `fresher_${period}`;

  if (scholarsTier === "full") {
    return scholarsFullPlanKey(childCount, period);
  }
  const tier = scholarsTier === "study_guide" ? "study_guide" : scholarsTier;
  return `scholars_${tier}_${period}`;
}
