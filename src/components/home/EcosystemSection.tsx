import Link from "next/link";
import { ecosystemPillars, getAppBySlug } from "@/config/brand";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function EcosystemSection() {
  return (
    <section id="ecosystem" className="scroll-mt-24 bg-[#fefbf6] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Ecosystem"
          title="Built for every side of childhood."
          description="Money, education, sports, and communication — covered by four focused apps."
          className="mb-10 sm:mb-14"
        />

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {ecosystemPillars.map((pillar) => {
            const app = getAppBySlug(pillar.appSlug);
            return (
              <article
                key={pillar.title}
                className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-8"
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-lg sm:mb-5 sm:h-12 sm:w-12 sm:text-xl"
                  style={{ backgroundColor: app?.accentColorLight ?? "#f5f5f5" }}
                >
                  <span aria-hidden="true">{pillar.icon}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">{pillar.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-neutral-600">
                  {pillar.description}
                </p>
                {app && (
                  <Link
                    href={app.learnMorePath}
                    className="text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ color: app.accentColor }}
                  >
                    {app.name} →
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
