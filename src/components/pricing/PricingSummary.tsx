import {
  ecosystemBuilderCopy,
  type BillingPeriod,
  type PricingPlanConfig,
  type SavingsTierConfig,
} from "@/config/pricing";

interface PricingSummaryProps {
  selectedCount: number;
  selectedPlans: PricingPlanConfig[];
  totals: {
    originalTotal: string;
    savings: string;
    estimatedTotal: string;
    allAccessPrice: string | null;
    tier: SavingsTierConfig;
  };
  statusMessage: string;
  billingPeriod: BillingPeriod;
}

export function PricingSummary({
  selectedCount,
  selectedPlans,
  totals,
  statusMessage,
  billingPeriod,
}: PricingSummaryProps) {
  const { labels } = ecosystemBuilderCopy;

  return (
    <div className="rounded-2xl border border-neutral-100 bg-[#fefbf6] p-6 sm:p-8">
      <p
        className={`rounded-xl px-4 py-3 text-sm font-medium ${
          selectedCount >= 2
            ? "bg-emerald-50 text-emerald-800"
            : selectedCount === 1
              ? "bg-amber-50 text-amber-900"
              : "bg-neutral-100 text-neutral-700"
        }`}
      >
        {statusMessage}
      </p>

      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <dt className="text-sm text-neutral-600">{labels.selectedCount}</dt>
          <dd className="text-lg font-semibold text-neutral-900">{selectedCount}</dd>
        </div>

        <div>
          <dt className="text-sm text-neutral-600">{labels.includedApps}</dt>
          <dd className="mt-2 text-sm font-medium text-neutral-900">
            {selectedPlans.length > 0
              ? selectedPlans.map((p) => p.name).join(", ")
              : "—"}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm text-neutral-600">{labels.currentTier}</dt>
          <dd className="text-right text-sm font-semibold text-neutral-900">
            {totals.tier.title}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm text-neutral-600">{labels.originalTotal}</dt>
          <dd className="text-right text-sm font-medium text-neutral-900">
            {totals.originalTotal}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm text-neutral-600">{labels.ecosystemSavings}</dt>
          <dd className="text-right text-sm font-medium text-emerald-700">{totals.savings}</dd>
        </div>

        {totals.allAccessPrice && selectedCount >= 1 && (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-indigo-50 px-3 py-2">
            <dt className="text-sm font-medium text-indigo-900">{labels.allAccessPrice}</dt>
            <dd className="text-right text-sm font-semibold text-indigo-900">
              {totals.allAccessPrice}
            </dd>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-neutral-200 pt-4">
          <dt className="text-sm font-medium text-neutral-900">{labels.estimatedTotal}</dt>
          <dd className="text-right text-lg font-semibold text-neutral-900">
            {totals.estimatedTotal}
          </dd>
        </div>
      </dl>

      <p className="mt-6 text-xs leading-relaxed text-neutral-500">
        Billing: {billingPeriod}. Scholars uses All Access ($14.99/mo). Earnly priced per
        child. Compare with Genlyn All Access above.
      </p>
    </div>
  );
}
