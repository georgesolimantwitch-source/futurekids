import { type AppConfig } from "@/config/brand";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface AppProductSafetyProps {
  app: AppConfig;
}

export function AppProductSafety({ app }: AppProductSafetyProps) {
  if (!app.safety) return null;

  return (
    <section id="safety" className="scroll-mt-32 bg-[#fefbf6] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Safety & Privacy"
            title={app.safety.title}
            description={app.safety.description}
            className="mb-16"
          />
        </AnimateOnScroll>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {app.safety.items.map((item, index) => (
            <AnimateOnScroll key={item} delay={index * 60}>
              <div className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0"
                  style={{ color: app.accentColor }}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
                <p className="text-sm leading-relaxed text-neutral-700">{item}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
