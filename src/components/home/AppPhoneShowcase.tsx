"use client";

/**
 * Four-phone product showcase — one animated phone mockup per app.
 *
 * Screens use each app's screenshotPath as a placeholder; swap in final
 * marketing screenshots by updating `screenshotPath` in config/brand.ts.
 */

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { listedApps } from "@/config/brand";

gsap.registerPlugin(ScrollTrigger);

/**
 * Temporary placeholder screens per app until final marketing screenshots
 * arrive. Remove an entry to fall back to the app's `screenshotPath`.
 */
const PLACEHOLDER_SCREENS: Partial<Record<string, string>> = {
  scholars: "/images/apps/scholars/marketing-notes.png",
};

export function AppPhoneShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const cards = gsap.utils.toArray<HTMLElement>(
      root.querySelectorAll("[data-phone-card]"),
    );

    if (reduce) {
      gsap.set(cards, { opacity: 1, y: 0, rotate: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(cards, { opacity: 0, y: 90, rotateX: 18, scale: 0.92 });

      gsap.to(cards, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: root,
          start: "top 78%",
          once: true,
        },
      });

      // Gentle continuous float — each phone on its own offset.
      cards.forEach((card, i) => {
        gsap.to(card, {
          y: "+=12",
          duration: 2.6 + i * 0.25,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 0.9 + i * 0.15,
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="apps"
      className="scroll-mt-24 overflow-hidden bg-[#070708] px-6 py-24 text-white sm:py-28"
    >
      <div ref={rootRef} className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            The apps
          </p>
          <h2 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Four apps. One family.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">
            Everything your kids need to grow — money, learning, sport, and
            real food — in one place.
          </p>
        </div>

        <div
          className="mt-20 grid grid-cols-1 gap-x-6 gap-y-20 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-4"
          style={{ perspective: "1400px" }}
        >
          {listedApps.map((app) => (
            <Link
              key={app.slug}
              href={app.learnMorePath}
              data-phone-card
              className="group flex flex-col items-center will-change-transform"
            >
              <PhoneMockup accent={app.accentColor}>
                <Image
                  src={PLACEHOLDER_SCREENS[app.slug] ?? app.screenshotPath}
                  alt={`${app.name} app screenshot`}
                  fill
                  sizes="(max-width: 640px) 60vw, (max-width: 1024px) 40vw, 240px"
                  className="object-cover object-top"
                />
              </PhoneMockup>

              <div className="mt-7 flex flex-col items-center text-center">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-[26%] shadow-lg ring-1 ring-white/10 transition group-hover:scale-110"
                  style={{ backgroundColor: app.accentColorLight }}
                >
                  <Image
                    src={app.iconPath}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7"
                    aria-hidden
                  />
                </span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">
                  {app.name}
                </h3>
                <p
                  className="mt-1 text-sm font-medium"
                  style={{ color: app.accentColor }}
                >
                  {app.tagline}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Explore plans
          </Link>
          <Link
            href="/apps/earnly"
            className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60"
          >
            See the apps
          </Link>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup({
  children,
  accent,
}: {
  children: ReactNode;
  accent: string;
}) {
  return (
    <div className="relative">
      {/* Accent glow behind the phone */}
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-90"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${accent} 0%, transparent 70%)`,
        }}
        aria-hidden
      />
      <div
        className="relative mx-auto transition-transform duration-500 group-hover:-translate-y-1.5"
        style={{ width: "min(230px, 62vw)", aspectRatio: "9 / 19.5" }}
      >
        <div className="absolute inset-0 rounded-[2.4rem] bg-gradient-to-b from-neutral-300 via-neutral-600 to-neutral-900 p-[2px] shadow-[0_30px_70px_rgba(0,0,0,0.55)]">
          <div className="relative h-full w-full overflow-hidden rounded-[2.25rem] bg-black">
            <div className="absolute left-1/2 top-2.5 z-10 h-[20px] w-[28%] -translate-x-1/2 rounded-full bg-black" />
            <div className="absolute inset-[3px] overflow-hidden rounded-[2.05rem] bg-neutral-950">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
