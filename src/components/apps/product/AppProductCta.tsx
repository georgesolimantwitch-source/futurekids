import { type AppConfig } from "@/config/brand";
import { AppPrimaryAction } from "@/components/apps/AppCard";
import { Button } from "@/components/ui/Button";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface AppProductCtaProps {
  app: AppConfig;
}

export function AppProductCta({ app }: AppProductCtaProps) {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimateOnScroll>
          <div
            className="rounded-3xl px-8 py-16 text-center sm:px-16 sm:py-20"
            style={{ backgroundColor: app.accentColor }}
          >
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {app.availability === "waitlist"
                ? `Be the first to try ${app.name}.`
                : `Ready to get started with ${app.name}?`}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              {app.availability === "waitlist"
                ? "Join the waitlist and we'll notify you when TinyPal launches in your area."
                : app.positioning}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <AppPrimaryAction
                app={app}
                size="lg"
                inverted
                showStoreIcon={app.availability === "live"}
              />
              <Button
                href="/#apps"
                variant="secondary"
                size="lg"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                Explore All Apps
              </Button>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
