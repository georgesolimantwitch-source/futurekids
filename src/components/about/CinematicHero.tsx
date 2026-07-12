"use client";

import Image from "next/image";
import { cinematicHero } from "@/config/about";
import { ScrollIndicator, StoryReveal } from "./StoryReveal";

export function CinematicHero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white">
      <div className="absolute inset-0 bg-gradient-to-b from-[#fafafa] via-white to-[#f0f9ff]/40" />
      <div className="absolute inset-0 opacity-30">
        <Image
          src={cinematicHero.illustration}
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
        <StoryReveal variant="fade-up" duration={1200}>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl xl:text-8xl">
            {cinematicHero.headline}
          </h1>
        </StoryReveal>
        <StoryReveal variant="fade-in" delay={400}>
          <p className="mx-auto mt-6 max-w-md text-base text-neutral-500 sm:mt-8 sm:text-lg">
            {cinematicHero.subtext}
          </p>
        </StoryReveal>
      </div>

      <ScrollIndicator />
    </section>
  );
}
