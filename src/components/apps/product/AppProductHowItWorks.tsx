import { type AppConfig } from "@/config/brand";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface AppProductHowItWorksProps {
  app: AppConfig;
}

export function AppProductHowItWorks({ app }: AppProductHowItWorksProps) {
  return (
    <section id="how-it-works" className="scroll-mt-32 bg-[#fafafa] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="How It Works"
            title="Simple to start. Easy to love."
            description={`Getting started with ${app.name} takes just a few minutes.`}
            className="mb-16"
          />
        </AnimateOnScroll>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {app.howItWorks.map((step, index) => (
            <AnimateOnScroll key={step.step} delay={index * 80}>
              <article className="relative">
                {index < app.howItWorks.length - 1 && (
                  <div
                    className="absolute left-1/2 top-8 hidden h-px w-full lg:block"
                    style={{ backgroundColor: `${app.accentColor}30` }}
                    aria-hidden="true"
                  />
                )}
                <div className="text-center lg:text-left">
                  <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-sm lg:mx-0"
                    style={{ backgroundColor: app.accentColor }}
                  >
                    {step.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {step.description}
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
