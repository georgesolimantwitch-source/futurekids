"use client";

import Image from "next/image";
import { useState } from "react";
import { apps, type AppConfig } from "@/config/brand";
import { AppPrimaryAction } from "@/components/apps/AppCard";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  AppScreenshotImage,
  getScreenshotContainerClass,
} from "@/components/ui/AppScreenshotImage";

export function AppShowcase() {
  const [activeSlug, setActiveSlug] = useState(apps[0].slug);
  const active = apps.find((app) => app.slug === activeSlug) ?? apps[0];

  return (
    <section id="apps" className="scroll-mt-24 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Apps"
          title="Four apps. One ecosystem."
          description="Select an app to see what it does — then download, join the waitlist, or learn more."
          className="mb-10 sm:mb-14"
        />

        <div
          className="mb-8 flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:mb-10 sm:flex-wrap sm:justify-center sm:overflow-visible"
          role="tablist"
          aria-label="Select an app"
        >
          {apps.map((app) => (
            <AppTab
              key={app.slug}
              app={app}
              selected={app.slug === active.slug}
              onSelect={() => setActiveSlug(app.slug)}
            />
          ))}
        </div>

        <div
          className="overflow-hidden rounded-3xl border border-neutral-100 bg-[#fefbf6] shadow-sm"
          style={{ borderColor: `${active.accentColor}22` }}
        >
          <div className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-12">
            <div className="min-w-0">
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14"
                  style={{ backgroundColor: active.accentColorLight }}
                >
                  <Image
                    src={active.iconPath}
                    alt=""
                    width={32}
                    height={32}
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                    {active.name}
                  </h3>
                  <p
                    className="text-sm font-medium sm:text-base"
                    style={{ color: active.accentColor }}
                  >
                    {active.tagline}
                  </p>
                </div>
              </div>

              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                {active.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {active.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full px-3 py-1 text-xs font-medium sm:text-sm"
                    style={{
                      backgroundColor: active.accentColorLight,
                      color: active.accentColor,
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <AppPrimaryAction
                  app={active}
                  size="md"
                  showStoreIcon={active.availability === "live"}
                  className="w-full sm:w-auto"
                />
                <Button
                  href={active.learnMorePath}
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </div>
            </div>

            <div
              className={`flex items-center justify-center rounded-2xl p-5 sm:p-8 ${getScreenshotContainerClass(active.screenshotDevice ?? "phone")}`}
              style={{ backgroundColor: active.accentColorLight }}
            >
              <div className="relative w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
                <AppScreenshotImage
                  app={active}
                  src={active.screenshotPath}
                  alt={`${active.name} screenshot`}
                  priority={active.slug === "earnly"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AppTab({
  app,
  selected,
  onSelect,
}: {
  app: AppConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
        selected
          ? "shadow-sm"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
      }`}
      style={
        selected
          ? { backgroundColor: app.accentColorLight, color: app.accentColor }
          : undefined
      }
    >
      <Image
        src={app.iconPath}
        alt=""
        width={18}
        height={18}
        className="h-[18px] w-[18px]"
        aria-hidden="true"
      />
      {app.name}
    </button>
  );
}
