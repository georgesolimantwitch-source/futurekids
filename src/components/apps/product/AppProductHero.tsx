import Image from "next/image";
import { type AppConfig } from "@/config/brand";
import { AppPlayStoreAction, AppPrimaryAction } from "@/components/apps/AppCard";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import {
  AppScreenshotImage,
  getScreenshotContainerClass,
} from "@/components/ui/AppScreenshotImage";

interface AppProductHeroProps {
  app: AppConfig;
}

export function AppProductHero({ app }: AppProductHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse at 70% 20%, ${app.accentColorLight} 0%, transparent 60%)`,
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <AnimateOnScroll>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
                style={{ backgroundColor: app.accentColorLight }}
              >
                <Image
                  src={app.iconPath}
                  alt={`${app.name} icon`}
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
              </div>
              {app.availability === "waitlist" && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: app.accentColorLight,
                    color: app.accentColor,
                  }}
                >
                  Coming Soon
                </span>
              )}
            </div>

            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-neutral-900 sm:mt-6 sm:text-5xl lg:text-6xl">
              {app.name}
            </h1>
            <p
              className="mt-3 text-lg font-medium sm:mt-4 sm:text-2xl"
              style={{ color: app.accentColor }}
            >
              {app.positioning}
            </p>
            <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
              {app.description}
            </p>
            <p className="mt-3 text-sm font-medium text-neutral-500">
              For {app.audience}
            </p>

            {app.supportedSports && (
              <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
                {app.supportedSports.map((sport) => (
                  <span
                    key={sport}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: app.accentColorLight,
                      color: app.accentColor,
                    }}
                  >
                    {sport}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
              <AppPrimaryAction
                app={app}
                size="lg"
                showStoreIcon={app.availability === "live"}
                className="w-full sm:w-auto"
              />
              <AppPlayStoreAction app={app} size="lg" className="w-full sm:w-auto" />
              <a
                href="#features"
                className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-8 py-4 text-base font-medium text-neutral-900 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 sm:w-auto"
              >
                See Features
              </a>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={150}>
            <div
              className={`flex items-center justify-center rounded-3xl p-5 sm:p-10 ${getScreenshotContainerClass(app.screenshotDevice ?? "phone")}`}
              style={{ backgroundColor: app.accentColorLight }}
            >
              <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 transition-transform duration-500 hover:scale-[1.02]">
                <AppScreenshotImage
                  app={app}
                  src={app.screenshotPath}
                  alt={`${app.name} app screenshot`}
                  priority
                />
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
