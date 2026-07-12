import Image from "next/image";
import Link from "next/link";
import {
  getPriceForPeriod,
  type BillingPeriod,
  type PricingPlanConfig,
} from "@/config/pricing";
import { Button } from "@/components/ui/Button";

interface AppPricingCardProps {
  plan: PricingPlanConfig;
  billingPeriod: BillingPeriod;
}

export function AppPricingCard({ plan, billingPeriod }: AppPricingCardProps) {
  const price = getPriceForPeriod(plan, billingPeriod);
  const periodLabel = billingPeriod === "monthly" ? "month" : "year";

  return (
    <article
      className="flex h-full flex-col rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
      style={{ borderTopColor: plan.accentColor, borderTopWidth: 3 }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl"
          style={{ backgroundColor: plan.accentColorLight }}
        >
          <Image
            src={plan.iconPath}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 sm:h-7 sm:w-7"
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 sm:text-lg">{plan.name}</h3>
          {plan.availability === "waitlist" && (
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: plan.accentColor }}
            >
              Coming soon
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-neutral-600">{plan.description}</p>

      <div className="mt-4">
        <p className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          {price.display}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">per {periodLabel} · not finalized</p>
      </div>

      <ul className="mt-4 flex-1 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: plan.accentColor }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-600">
        {plan.memberSavingsMessage}
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <Button
          href={plan.cta.href}
          external={plan.cta.external}
          size="md"
          accentColor={plan.accentColor}
          className="w-full"
        >
          {plan.cta.label}
        </Button>
        <Link
          href={plan.learnMorePath}
          className="text-center text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70"
          style={{ color: plan.accentColor }}
        >
          Learn More
        </Link>
      </div>
    </article>
  );
}
