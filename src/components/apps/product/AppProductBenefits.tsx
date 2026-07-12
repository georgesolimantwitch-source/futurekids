import { type AppConfig } from "@/config/brand";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface AppProductBenefitsProps {
  app: AppConfig;
}

export function AppProductBenefits({ app }: AppProductBenefitsProps) {
  const isParentFocused =
    app.audience.toLowerCase().includes("parent") ||
    app.audience.toLowerCase().includes("kid");

  return (
    <section id="benefits" className="scroll-mt-32 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Benefits"
            title={
              isParentFocused
                ? "Built for families. Loved by everyone."
                : "Why users choose " + app.name + "."
            }
            description={
              isParentFocused
                ? "Designed to give parents confidence and kids the freedom to grow."
                : `See why ${app.audience.toLowerCase()} rely on ${app.name} every day.`
            }
            className="mb-16"
          />
        </AnimateOnScroll>

        <div className="grid gap-8 sm:grid-cols-2">
          {app.benefits.map((benefit, index) => (
            <AnimateOnScroll key={benefit.title} delay={index * 80}>
              <article className="flex gap-5 rounded-2xl border border-neutral-100 p-8 transition-shadow duration-300 hover:shadow-md">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: app.accentColorLight }}
                >
                  <svg
                    className="h-6 w-6"
                    style={{ color: app.accentColor }}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                    {benefit.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {benefit.description}
                  </p>
                </div>
              </article>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
