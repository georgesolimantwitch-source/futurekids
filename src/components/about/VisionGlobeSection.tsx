"use client";

import { visionSection } from "@/config/about";
import { StoryReveal } from "./StoryReveal";

export function VisionGlobeSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 py-24">
      <div className="absolute inset-0 flex items-center justify-center">
        <GlobeVisual />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
        <StoryReveal variant="fade-in">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
            {visionSection.eyebrow}
          </p>
        </StoryReveal>
        <StoryReveal variant="fade-up" delay={300}>
          <h2 className="mt-8 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
            {visionSection.headline}
          </h2>
        </StoryReveal>
      </div>
    </section>
  );
}

function GlobeVisual() {
  const dots = Array.from({ length: 80 }, (_, i) => {
    const angle = (i / 80) * Math.PI * 2;
    const radius = 120 + (i % 5) * 15;
    return {
      x: 200 + Math.cos(angle) * radius,
      y: 200 + Math.sin(angle) * radius * 0.6,
      delay: i * 0.05,
    };
  });

  return (
    <svg
      className="h-[min(80vw,600px)] w-[min(80vw,600px)] opacity-40"
      viewBox="0 0 400 400"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="160" fill="url(#globeGlow)" />
      <ellipse cx="200" cy="200" rx="150" ry="90" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.2" />
      <ellipse cx="200" cy="200" rx="90" ry="150" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.15" />
      {dots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r="2"
          fill="#fff"
          opacity="0.6"
          className="animate-pulse"
          style={{ animationDelay: `${dot.delay}s`, animationDuration: "3s" }}
        />
      ))}
      {/* Connection lines between nearby dots */}
      <path
        d="M200 200 Q280 160 320 200 T200 280 Q120 240 80 200 T200 120"
        fill="none"
        stroke="#6366f1"
        strokeWidth="1"
        opacity="0.3"
        strokeDasharray="4 4"
        className="animate-spin"
        style={{ animationDuration: "60s", transformOrigin: "200px 200px" }}
      />
    </svg>
  );
}
