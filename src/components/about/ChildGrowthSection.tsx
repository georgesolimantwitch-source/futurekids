"use client";

import { useEffect, useRef, useState } from "react";
import { childGrowth } from "@/config/about";
import { StoryReveal } from "./StoryReveal";

export function ChildGrowthSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = stageRefs.current.map((el, index) => {
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIndex(index);
        },
        { threshold: 0.6, rootMargin: "-20% 0px -20% 0px" },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  const active = childGrowth.stages[activeIndex];

  return (
    <section className="relative min-h-screen bg-neutral-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StoryReveal variant="fade-up">
          <h2 className="text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {childGrowth.headline}
          </h2>
        </StoryReveal>

        {/* Sticky visual */}
        <div className="mt-12 lg:grid lg:grid-cols-2 lg:gap-16">
          <div className="sticky top-24 hidden h-80 items-center justify-center lg:flex">
            <div className="relative">
              <div
                className="flex h-48 w-48 items-center justify-center rounded-full border border-white/20 bg-white/5 text-6xl font-semibold text-white backdrop-blur-xl transition-all duration-700"
                key={active.age}
              >
                {active.age}
              </div>
              <p className="mt-6 text-center text-lg text-neutral-400">{active.note}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {active.apps.map((app) => (
                  <span
                    key={app}
                    className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll stages */}
          <div className="space-y-[60vh] py-12 lg:py-24">
            {childGrowth.stages.map((stage, i) => (
              <div
                key={stage.age}
                ref={(el) => {
                  stageRefs.current[i] = el;
                }}
                className={`flex min-h-[40vh] items-center transition-opacity duration-500 ${
                  activeIndex === i ? "opacity-100" : "opacity-30"
                }`}
              >
                <article className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm lg:hidden">
                  <p className="text-5xl font-semibold text-white">Age {stage.age}</p>
                  <p className="mt-2 text-neutral-400">{stage.note}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stage.apps.map((app) => (
                      <span key={app} className="rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                        {app}
                      </span>
                    ))}
                  </div>
                </article>
                <article className="hidden lg:block">
                  <p className="text-sm uppercase tracking-widest text-neutral-500">
                    Age {stage.age}
                  </p>
                  <div className="mt-4 h-1 w-24 rounded-full bg-white/30" />
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
