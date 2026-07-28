"use client";

import Image from "next/image";
import { cinematicHero, familyChallenges } from "@/config/about";
import { ScrollIndicator, StoryReveal } from "./StoryReveal";

export function CinematicHero() {
  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-[#f8f8f6] py-20 sm:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(36,192,252,0.12),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(0,156,252,0.12),transparent_30%),radial-gradient(circle_at_75%_85%,rgba(252,108,12,0.10),transparent_28%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-8">
        <div>
          <StoryReveal variant="fade-up" duration={1200}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              About Genlyn
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
              {cinematicHero.headline}
            </h1>
          </StoryReveal>
          <StoryReveal variant="fade-in" delay={300}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
              {cinematicHero.subtext}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {cinematicHero.outcomes.map((outcome) => (
                <span
                  key={outcome}
                  className="rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur"
                >
                  {outcome}
                </span>
              ))}
            </div>
          </StoryReveal>
        </div>

        <StoryReveal variant="scale" delay={200}>
          <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
            {familyChallenges.cards.map((card, index) => (
              <div
                key={card.id}
                className={`group relative overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-[0_20px_60px_rgba(15,23,42,0.14)] sm:rounded-[2rem] ${
                  index === 1 || index === 3 ? "translate-y-6" : ""
                }`}
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={card.illustration}
                    alt={card.illustrationAlt}
                    fill
                    priority={index < 2}
                    sizes="(min-width: 1024px) 28vw, 48vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 sm:text-xs">
                      {card.app}
                    </p>
                    <p className="mt-1 text-sm font-semibold sm:text-base">{card.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </StoryReveal>
      </div>

      <ScrollIndicator />
    </section>
  );
}
