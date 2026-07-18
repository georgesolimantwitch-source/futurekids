"use client";

import { missionSection } from "@/config/about";
import { StoryReveal } from "./StoryReveal";

export function MissionSection() {
  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <StoryReveal variant="fade-up">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
              {missionSection.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
              {missionSection.headline}
            </h2>
          </StoryReveal>

          <div className="mt-8 space-y-5 text-left sm:mt-10">
            {missionSection.paragraphs.map((paragraph, i) => (
              <StoryReveal key={paragraph} variant="fade-up" delay={i * 100}>
                <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
                  {paragraph}
                </p>
              </StoryReveal>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {missionSection.commitments.map((item, i) => (
            <StoryReveal key={item.title} variant="scale" delay={i * 80}>
              <article className="rounded-3xl border border-neutral-100 bg-[#fafafa] p-6 sm:p-8">
                <h3 className="text-xl font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
                  {item.description}
                </p>
              </article>
            </StoryReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
