import { comparisonColumns, comparisonRows } from "@/config/pricing";
import { SectionHeading } from "@/components/ui/SectionHeading";

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <svg
        className="mx-auto h-5 w-5 text-neutral-900"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        aria-label="Included"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (value === false) {
    return <span className="text-neutral-300" aria-label="Not included">—</span>;
  }
  return <span className="text-sm text-neutral-700">{value}</span>;
}

export function PricingComparison() {
  return (
    <section id="comparison" className="scroll-mt-24 bg-[#fefbf6] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Compare"
          title="Find the right plan level."
          description="See how individual and multi-app options compare."
          className="mb-10 sm:mb-14"
        />

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-6 py-4 text-sm font-semibold text-neutral-900">Feature</th>
                {comparisonColumns.map((col) => (
                  <th
                    key={col.id}
                    className="px-6 py-4 text-center text-sm font-semibold text-neutral-900"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, index) => (
                <tr
                  key={row.feature}
                  className={index % 2 === 0 ? "bg-white" : "bg-neutral-50/50"}
                >
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {row.feature}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CellValue value={row.oneApp} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CellValue value={row.twoApps} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CellValue value={row.threePlus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="space-y-4 md:hidden">
          {comparisonColumns.map((col) => {
            const key =
              col.id === "oneApp"
                ? "oneApp"
                : col.id === "twoApps"
                  ? "twoApps"
                  : "threePlus";
            return (
              <article
                key={col.id}
                className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-neutral-900">{col.label}</h3>
                <ul className="mt-4 space-y-3">
                  {comparisonRows.map((row) => (
                    <li
                      key={row.feature}
                      className="flex items-center justify-between gap-4 border-b border-neutral-50 pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-neutral-600">{row.feature}</span>
                      <CellValue value={row[key]} />
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
