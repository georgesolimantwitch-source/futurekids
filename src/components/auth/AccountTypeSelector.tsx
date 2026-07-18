import type { AccountType } from "@/lib/auth/types";

const OPTIONS = [
  {
    id: "parent" as const,
    title: "Family Account",
    subtitle: "Best for parents and families.",
    badge: "Recommended for Parents",
    description:
      "One account for your household. Manage your children, subscriptions, and every family app from one place.",
    bullets: [
      "Manage multiple children",
      "One subscription for the family",
      "Earnly",
      "TinyPal",
      "Family management",
      "More family apps coming soon",
    ],
  },
  {
    id: "individual" as const,
    title: "Personal Account",
    subtitle: "Best for students and individuals.",
    badge: "Recommended for Students",
    description:
      "Perfect for students, athletes, and individuals using Future Kids apps without managing children.",
    bullets: [
      "Scholars Notes",
      "Ballr",
      "Personal subscriptions",
      "One account for yourself",
      "Future apps included",
    ],
  },
] as const;

const COMPARISON_ROWS = [
  { feature: "Earnly", family: true, personal: false },
  { feature: "TinyPal", family: true, personal: false },
  { feature: "Scholars Notes", family: true, personal: true },
  { feature: "Ballr", family: true, personal: true },
  { feature: "Multiple users", family: true, personal: false },
  { feature: "Family management", family: true, personal: false },
] as const;

function Availability({ available }: { available: boolean }) {
  if (!available) {
    return (
      <span className="font-medium text-neutral-400" aria-label="No">
        —
      </span>
    );
  }

  return (
    <span className="font-semibold text-neutral-900" aria-label="Yes">
      Yes
    </span>
  );
}

export function AccountTypeSelector({
  value,
  onChange,
}: {
  value: AccountType;
  onChange: (value: AccountType) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-neutral-800">Choose your account type</legend>
      <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
        Pick the option that matches how you&apos;ll use Future Kids.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {OPTIONS.map((option) => {
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={`rounded-2xl border px-4 py-4 text-left transition sm:px-5 sm:py-5 ${
                selected
                  ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              }`}
            >
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                  selected
                    ? "bg-white/15 text-white"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {option.badge}
              </span>

              <span className="mt-3 block text-base font-semibold tracking-tight sm:text-lg">
                {option.title}
              </span>
              <span
                className={`mt-1 block text-sm leading-snug ${
                  selected ? "text-neutral-300" : "text-neutral-500"
                }`}
              >
                {option.subtitle}
              </span>

              <ul className="mt-4 space-y-2">
                {option.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm leading-snug">
                    <span
                      className={`mt-0.5 shrink-0 ${
                        selected ? "text-emerald-300" : "text-emerald-600"
                      }`}
                      aria-hidden
                    >
                      •
                    </span>
                    <span className={selected ? "text-neutral-100" : "text-neutral-700"}>
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>

              <span
                className={`mt-4 block border-t pt-3 text-xs leading-relaxed sm:text-sm ${
                  selected
                    ? "border-white/15 text-neutral-300"
                    : "border-neutral-100 text-neutral-500"
                }`}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200">
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Quick comparison
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-sm">
            <caption className="sr-only">
              Feature comparison between Family and Personal accounts
            </caption>
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-500">
                <th scope="col" className="px-4 py-3 font-medium">
                  Feature
                </th>
                <th scope="col" className="px-3 py-3 text-center font-medium">
                  Family
                </th>
                <th scope="col" className="px-3 py-3 text-center font-medium">
                  Personal
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, index) => {
                const isLast = index === COMPARISON_ROWS.length - 1;
                const familySelected = value === "parent";
                const personalSelected = value === "individual";

                return (
                  <tr
                    key={row.feature}
                    className={isLast ? undefined : "border-b border-neutral-100"}
                  >
                    <th
                      scope="row"
                      className="px-4 py-2.5 font-medium text-neutral-800"
                    >
                      {row.feature}
                    </th>
                    <td
                      className={`px-3 py-2.5 text-center ${
                        familySelected ? "bg-neutral-900/5" : ""
                      }`}
                    >
                      <Availability available={row.family} />
                    </td>
                    <td
                      className={`px-3 py-2.5 text-center ${
                        personalSelected ? "bg-neutral-900/5" : ""
                      }`}
                    >
                      <Availability available={row.personal} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </fieldset>
  );
}
