"use client";

import Image from "next/image";
import { futureEcosystem, getEcosystemCircleApps } from "@/config/about";
import { StoryReveal } from "./StoryReveal";

export function FutureEcosystemSection() {
  const apps = getEcosystemCircleApps();

  return (
    <section className="relative min-h-[80vh] bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StoryReveal variant="fade-up">
          <h2 className="text-center text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            {futureEcosystem.headline}
          </h2>
        </StoryReveal>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 lg:grid-cols-7">
          {apps.map((app, i) => (
            <StoryReveal key={app.slug} variant="scale" delay={i * 100}>
              <div className="flex flex-col items-center rounded-3xl border border-neutral-100 bg-[#fafafa] p-6 shadow-sm">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: app.accentColorLight }}
                >
                  <Image src={app.iconPath} alt="" width={32} height={32} className="h-8 w-8" />
                </div>
                <p className="mt-3 text-sm font-semibold text-neutral-900">{app.name}</p>
              </div>
            </StoryReveal>
          ))}

          {Array.from({ length: futureEcosystem.placeholderCount }).map((_, i) => (
            <StoryReveal key={`future-${i}`} variant="fade-in" delay={400 + i * 100}>
              <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/80 p-6 backdrop-blur-sm">
                <div className="h-16 w-16 rounded-2xl bg-neutral-200/60 blur-[2px]" />
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Future App
                </p>
              </div>
            </StoryReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
