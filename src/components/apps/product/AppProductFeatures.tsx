import { accentForegroundColor, type AppConfig } from "@/config/brand";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface AppProductFeaturesProps {
  app: AppConfig;
}

export function AppProductFeatures({ app }: AppProductFeaturesProps) {
  const foreground = accentForegroundColor(app.accentColor);

  return (
    <section id="features" className="scroll-mt-32 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Features"
            title={`Everything you need in ${app.name}.`}
            description="Powerful tools designed to work together seamlessly."
            className="mb-16"
          />
        </AnimateOnScroll>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {app.productFeatures.map((feature, index) => (
            <AnimateOnScroll key={feature.title} delay={index * 60}>
              <article className="group h-full rounded-2xl border border-neutral-100 bg-[#fefbf6] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-200 hover:shadow-md">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: app.accentColor, color: foreground }}
                >
                  {index + 1}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600">
                  {feature.description}
                </p>
              </article>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
