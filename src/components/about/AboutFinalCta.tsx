"use client";

import Image from "next/image";
import { aboutFinalCta } from "@/config/about";
import { Button } from "@/components/ui/Button";
import { StoryReveal } from "./StoryReveal";

export function AboutFinalCta() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={aboutFinalCta.illustration}
          alt=""
          fill
          className="object-cover object-bottom"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-white/70" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          {aboutFinalCta.headline.map((line, i) => (
            <StoryReveal key={line} variant="fade-up" delay={i * 200}>
              <p className="text-3xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                {line}
              </p>
            </StoryReveal>
          ))}

          <StoryReveal variant="scale" delay={600} className="mt-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-5">
              <Button href={aboutFinalCta.primary.href} size="lg" className="w-full sm:w-auto sm:px-10">
                {aboutFinalCta.primary.label}
              </Button>
              <Button
                href={aboutFinalCta.secondary.href}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto sm:px-10"
              >
                {aboutFinalCta.secondary.label}
              </Button>
            </div>
          </StoryReveal>
        </div>
      </div>
    </section>
  );
}
