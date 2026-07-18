"use client";

import Image from "next/image";
import { familyChallenges } from "@/config/about";
import { StoryReveal } from "./StoryReveal";

export function ChallengeCardsSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#fafafa] py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StoryReveal variant="fade-up">
          <h2 className="text-center text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            {familyChallenges.headline}
          </h2>
        </StoryReveal>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:mt-24 lg:gap-10">
          {familyChallenges.cards.map((card, i) => (
            <StoryReveal
              key={card.id}
              variant={i % 2 === 0 ? "slide-left" : "slide-right"}
              delay={i * 100}
            >
              <article
                className="group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 p-2 shadow-xl backdrop-blur-xl transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl"
                style={{
                  boxShadow: `0 25px 50px -12px ${card.accent}22`,
                }}
              >
                <div
                  className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
                  style={{ backgroundColor: card.accent }}
                />
                <div className="overflow-hidden rounded-[1.75rem]">
                  <Image
                    src={card.illustration}
                    alt=""
                    width={480}
                    height={360}
                    className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-64"
                  />
                </div>
                <div className="px-6 py-6 sm:px-8 sm:py-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {card.app}
                  </p>
                  <h3
                    className="mt-1 text-2xl font-semibold sm:text-3xl"
                    style={{ color: card.accent }}
                  >
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
                    {card.description}
                  </p>
                </div>
              </article>
            </StoryReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
