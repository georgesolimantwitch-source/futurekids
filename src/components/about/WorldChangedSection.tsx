"use client";

import Image from "next/image";
import { useRef } from "react";
import { worldChanged } from "@/config/about";
import { StoryReveal, useScrollProgress } from "./StoryReveal";

export function WorldChangedSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen bg-neutral-950 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StoryReveal variant="fade-up">
          <h2 className="text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {worldChanged.headline}
          </h2>
        </StoryReveal>

        {/* Horizontal timeline */}
        <div className="mt-16 overflow-x-auto pb-4 scrollbar-none">
          <div className="flex min-w-max gap-6 px-2 sm:gap-8 lg:min-w-0 lg:grid lg:grid-cols-4">
            {worldChanged.eras.map((era, i) => (
              <StoryReveal key={era.year} variant="scale" delay={i * 120} className="w-72 lg:w-auto">
                <article className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/10">
                  <p className="text-3xl font-semibold text-white">{era.year}</p>
                  <div className="mt-4 overflow-hidden rounded-2xl">
                    <Image
                      src={era.illustration}
                      alt=""
                      width={400}
                      height={300}
                      className="h-40 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-4 text-sm font-medium text-neutral-300">{era.shift}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {era.themes.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-neutral-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </article>
              </StoryReveal>
            ))}
          </div>
        </div>

        {/* Forces strip — animates with scroll progress */}
        <div
          className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4"
          style={{ opacity: 0.4 + progress * 0.6 }}
        >
          {worldChanged.forces.map((force, i) => (
            <StoryReveal key={force.label} variant="fade-up" delay={i * 80}>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center backdrop-blur-md">
                <p className="text-sm font-semibold text-white">{force.label}</p>
                <p className="mt-1 text-xs text-neutral-500">{force.note}</p>
              </div>
            </StoryReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
