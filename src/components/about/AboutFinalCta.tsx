"use client";

import Image from "next/image";
import { aboutFinalCta } from "@/config/about";
import { Button } from "@/components/ui/Button";
import { StoryReveal } from "./StoryReveal";

export function AboutFinalCta() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-0">
        <Image
          src={aboutFinalCta.illustration}
          alt=""
          fill
          className="object-cover object-[center_35%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/92 to-white/75" />
      </div>

      <div className="relative flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {aboutFinalCta.headline.map((line, i) => (
            <StoryReveal key={line} variant="fade-up" delay={i * 150}>
              <p className="text-3xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
                {line}
              </p>
            </StoryReveal>
          ))}

          {aboutFinalCta.subtext && (
            <StoryReveal variant="fade-in" delay={400}>
              <p className="mx-auto mt-6 max-w-lg text-base text-neutral-600 sm:text-lg">
                {aboutFinalCta.subtext}
              </p>
            </StoryReveal>
          )}

          <StoryReveal variant="scale" delay={500} className="mt-10">
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
