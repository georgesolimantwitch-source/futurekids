"use client";

import Image from "next/image";
import { familyChallenges } from "@/config/about";
import { StoryReveal } from "./StoryReveal";

export function ChallengeCardsSection() {
  return (
    <section className="relative overflow-hidden bg-[#f7f7f5] py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,white,transparent_42%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StoryReveal variant="fade-up">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            {familyChallenges.eyebrow}
          </p>
          <h2 className="mx-auto mt-4 max-w-4xl text-center text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            {familyChallenges.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-neutral-600 sm:text-lg">
            {familyChallenges.subtext}
          </p>
        </StoryReveal>

        <div className="mt-14 space-y-6 sm:mt-20 sm:space-y-8">
          {familyChallenges.cards.map((card, i) => (
            <StoryReveal
              key={card.id}
              variant={i % 2 === 0 ? "slide-left" : "slide-right"}
              delay={i * 100}
            >
              <article
                className="group relative grid overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(15,23,42,0.12)] lg:grid-cols-[1.12fr_0.88fr]"
                style={{
                  boxShadow: `0 24px 70px -24px ${card.accent}44`,
                }}
              >
                <div className={`relative min-h-64 overflow-hidden sm:min-h-80 lg:min-h-[420px] ${i % 2 ? "lg:order-2" : ""}`}>
                  <Image
                    src={card.illustration}
                    alt={card.illustrationAlt}
                    fill
                    sizes="(min-width: 1024px) 56vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
                  <span
                    className="absolute bottom-4 left-4 rounded-full border border-white/50 bg-white/90 px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-md sm:bottom-6 sm:left-6"
                    style={{ color: card.accent }}
                  >
                    {card.app}
                  </span>
                </div>

                <div className={`relative flex flex-col justify-center p-6 sm:p-10 lg:p-12 ${i % 2 ? "lg:order-1" : ""}`}>
                  <div
                    className="absolute right-0 top-0 h-36 w-36 -translate-y-1/3 translate-x-1/3 rounded-full opacity-20 blur-3xl"
                    style={{ backgroundColor: card.accent }}
                    aria-hidden
                  />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    How it helps your family
                  </p>
                  <h3
                    className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
                    style={{ color: card.accent }}
                  >
                    {card.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-neutral-600">
                    {card.description}
                  </p>

                  <div className="mt-7 grid gap-3">
                    <BenefitRow
                      label="For parents"
                      value={card.parentBenefit}
                      color={card.accent}
                      background={card.accentLight}
                    />
                    <BenefitRow
                      label="For kids"
                      value={card.childBenefit}
                      color={card.accent}
                      background={card.accentLight}
                    />
                  </div>
                </div>
              </article>
            </StoryReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitRow({
  label,
  value,
  color,
  background,
}: {
  label: string;
  value: string;
  color: string;
  background: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ backgroundColor: background }}
    >
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: color }}
        aria-hidden
      >
        ✓
      </span>
      <p className="min-w-0 text-sm text-neutral-700">
        <span className="font-semibold text-neutral-900">{label}:</span> {value}
      </p>
    </div>
  );
}
