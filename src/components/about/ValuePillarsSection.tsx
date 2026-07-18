"use client";

import Image from "next/image";
import { valuePillars } from "@/config/about";
import { StoryReveal } from "./StoryReveal";

export function ValuePillarsSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#fafafa] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StoryReveal variant="fade-up">
          <h2 className="text-center text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            {valuePillars.headline}
          </h2>
          {valuePillars.subtext && (
            <p className="mx-auto mt-4 max-w-2xl text-center text-base text-neutral-600 sm:text-lg">
              {valuePillars.subtext}
            </p>
          )}
        </StoryReveal>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {valuePillars.pillars.map((pillar, i) => (
            <StoryReveal key={pillar.label} variant="scale" delay={i * 80}>
              <article className="group relative overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl">
                <div
                  className="absolute inset-x-0 top-0 h-1 transition-all duration-500 group-hover:h-2"
                  style={{ backgroundColor: pillar.accent }}
                />
                <div className="relative h-40 overflow-hidden sm:h-48">
                  <Image
                    src={pillar.illustration}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-30"
                    style={{ backgroundColor: pillar.accent }}
                  />
                </div>
                <p className="py-4 text-center text-lg font-semibold text-neutral-900 sm:text-xl">
                  {pillar.label}
                </p>
                {"description" in pillar && pillar.description && (
                  <p className="px-4 pb-6 text-center text-sm leading-relaxed text-neutral-600">
                    {pillar.description}
                  </p>
                )}
              </article>
            </StoryReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
