"use client";

import Image from "next/image";
import { brand } from "@/config/brand";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative isolate min-h-[min(92vh,820px)] overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0">
        <Image
          src="/images/home/hero-kids.jpg"
          alt="Healthy, confident kids after practice — fit, capable, and ready for what’s next"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] motion-safe:animate-[hero-zoom_18s_ease-out_forwards]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/55 to-neutral-950/20"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-neutral-950/30"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto flex min-h-[min(92vh,820px)] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-24">
        <div className="max-w-2xl motion-safe:animate-[hero-rise_0.9s_ease-out_both]">
          <BrandLogo size="hero" variant="light" priority />
          <h1 className="font-display mt-6 text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {brand.tagline}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:mt-5 sm:text-lg">
            {brand.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <Button
              href="/#apps"
              variant="inverted"
              size="lg"
              className="w-full sm:w-auto"
            >
              Explore Our Apps
            </Button>
            <Button
              href="/pricing"
              variant="ghost"
              size="lg"
              className="w-full border border-white/35 bg-white/10 text-white backdrop-blur-sm hover:border-white/55 hover:bg-white/15 hover:text-white sm:w-auto"
            >
              See Plans
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
