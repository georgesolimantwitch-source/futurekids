import { type SavingsTierConfig } from "@/config/pricing";

interface SavingsTierCardProps {
  tier: SavingsTierConfig;
  highlighted?: boolean;
}

export function SavingsTierCard({ tier, highlighted = false }: SavingsTierCardProps) {
  return (
    <article
      className={`rounded-2xl border p-6 transition-all duration-300 sm:p-8 ${
        highlighted
          ? "border-neutral-900 bg-neutral-900 text-white shadow-lg"
          : "border-neutral-100 bg-white shadow-sm hover:shadow-md"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-widest ${
          highlighted ? "text-neutral-400" : "text-neutral-500"
        }`}
      >
        {tier.discountLabel}
      </p>
      <h3 className="mt-2 text-xl font-semibold sm:text-2xl">{tier.title}</h3>
      <p className={`mt-2 text-sm ${highlighted ? "text-neutral-300" : "text-neutral-600"}`}>
        {tier.subtitle}
      </p>
      <ul className="mt-6 space-y-3">
        {tier.benefits.map((benefit) => (
          <li
            key={benefit}
            className={`flex items-start gap-2 text-sm ${
              highlighted ? "text-neutral-200" : "text-neutral-700"
            }`}
          >
            <svg
              className={`mt-0.5 h-4 w-4 shrink-0 ${highlighted ? "text-white" : "text-neutral-900"}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {benefit}
          </li>
        ))}
      </ul>
    </article>
  );
}
