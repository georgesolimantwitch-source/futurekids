"use client";

/**
 * Cinematic homepage — Poppi-style scroll-scrubbed brand commercial.
 *
 * ADJUST SPEED / LENGTH:
 * - `CINEMATIC_SCROLL_VH` — scroll runway in vh (raise = longer/slower).
 * - `LOOP_COUNT` — how many times the app sequence repeats.
 *
 * Master timeline: `useLayoutEffect` → `gsap.timeline({ scrollTrigger })`.
 */

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AppPhoneShowcase } from "@/components/home/AppPhoneShowcase";
import { brand } from "@/config/brand";

gsap.registerPlugin(ScrollTrigger);

/** Scroll runway height in viewport units. Raise for slower / longer experience. */
export const CINEMATIC_SCROLL_VH = 640;

/** How long the all-apps opening holds before the first app takes over. */
const COMBO_END = 0.15;

/** App order for the looping scroll commercial. */
const APP_LOOP = ["earnly", "scholars", "ballr", "fresher"] as const;
/** How many times the sequence repeats while pinned. */
const LOOP_COUNT = 2;

const SCREENS = {
  earnly: "/images/home/cinematic/earnly-home.png",
  scholars: "/images/home/cinematic/scholars.png",
  ballr: "/images/home/cinematic/ballr-badge.png",
  fresher: "/images/home/cinematic/fresher.png",
} as const;

/** Phone-shaped screenshots for the opening 4-up row. */
const INTRO_SCREENS = {
  earnly: "/images/home/cinematic/earnly-home.png",
  scholars: "/images/home/cinematic/scholars-phone.png",
  ballr: "/images/home/cinematic/ballr-badge.png",
  fresher: "/images/home/cinematic/fresher.png",
} as const;

/** Poppi-style opening fan — our real app screenshots. */
const FAN_PHONES = [
  {
    key: "earnly",
    src: INTRO_SCREENS.earnly,
    label: "Earnly",
    accent: "#5CE1FF",
    rotate: -16,
    x: "-32vw",
    y: 28,
    scale: 0.9,
    z: 2,
  },
  {
    key: "scholars",
    src: INTRO_SCREENS.scholars,
    label: "Scholars Notes",
    accent: "#7EB6FF",
    rotate: -6,
    x: "-11vw",
    y: 6,
    scale: 1.02,
    z: 4,
  },
  {
    key: "ballr",
    src: INTRO_SCREENS.ballr,
    label: "Ballr",
    accent: "#F0FF00",
    rotate: 6,
    x: "11vw",
    y: 6,
    scale: 1.02,
    z: 4,
  },
  {
    key: "fresher",
    src: INTRO_SCREENS.fresher,
    label: "Freshys",
    accent: "#5CFF9A",
    rotate: 16,
    x: "32vw",
    y: 28,
    scale: 0.9,
    z: 2,
  },
] as const;

/** Earnly fan — separate phones with captions, like Ballr. */
const EARNLY_FAN = [
  {
    src: "/images/home/cinematic/earnly-home.png",
    caption: "Watch your family money grow.",
    rotate: -16,
    x: "-34vw",
    y: 28,
    scale: 0.88,
    z: 1,
  },
  {
    src: "/images/home/cinematic/earnly-chores.png",
    caption: "Turn chores into real earnings.",
    rotate: -8,
    x: "-17vw",
    y: 10,
    scale: 0.96,
    z: 3,
  },
  {
    src: "/images/home/cinematic/earnly-accounts.png",
    caption: "Every kid gets their own account.",
    rotate: 0,
    x: "0vw",
    y: 0,
    scale: 1.05,
    z: 5,
  },
  {
    src: "/images/home/cinematic/earnly-balance.png",
    caption: "Move money in a couple taps.",
    rotate: 8,
    x: "17vw",
    y: 10,
    scale: 0.96,
    z: 3,
  },
  {
    src: "/images/home/cinematic/earnly-safety.png",
    caption: "Know they're safe, wherever they go.",
    rotate: 16,
    x: "34vw",
    y: 28,
    scale: 0.88,
    z: 1,
  },
] as const;

/** Ballr fan — separate phones with captions, like the opening. */
const BALLR_FAN = [
  {
    src: "/images/home/cinematic/ballr-badge.png",
    caption: "Earn badges as you play.",
    rotate: -18,
    x: "-36vw",
    y: 32,
    scale: 0.84,
    z: 1,
  },
  {
    src: "/images/home/cinematic/ballr-player.png",
    caption: "Build your player card.",
    rotate: -10,
    x: "-21vw",
    y: 14,
    scale: 0.93,
    z: 3,
  },
  {
    src: "/images/home/cinematic/ballr-fuel.png",
    caption: "Track your fuel.",
    rotate: -3,
    x: "-7vw",
    y: 2,
    scale: 1.02,
    z: 5,
  },
  {
    src: "/images/home/cinematic/ballr-meals.png",
    caption: "Log every meal.",
    rotate: 3,
    x: "7vw",
    y: 2,
    scale: 1.02,
    z: 5,
  },
  {
    src: "/images/home/cinematic/ballr-workouts.png",
    caption: "Personalized workouts.",
    rotate: 10,
    x: "21vw",
    y: 14,
    scale: 0.93,
    z: 3,
  },
  {
    src: "/images/home/cinematic/ballr-gym.png",
    caption: "See your potential.",
    rotate: 18,
    x: "36vw",
    y: 32,
    scale: 0.84,
    z: 1,
  },
] as const;

function buildLoopWindows() {
  const windows: Array<{
    key: (typeof APP_LOOP)[number];
    start: number;
    end: number;
    holdOut: boolean;
  }> = [];
  const spanStart = COMBO_END;
  const spanEnd = 1;
  const total = APP_LOOP.length * LOOP_COUNT;
  const slot = (spanEnd - spanStart) / total;
  // Tiny overlap only for bg wash crossfade — devices hard-cut so apps
  // never sit half-transparent on top of each other.
  const overlap = slot * 0.04;
  for (let i = 0; i < total; i++) {
    const start = spanStart + i * slot;
    const end = Math.min(spanEnd, start + slot + overlap);
    windows.push({
      key: APP_LOOP[i % APP_LOOP.length],
      start,
      end,
      holdOut: i === total - 1,
    });
  }
  return windows;
}

const STAGE_COPY: Array<{
  key: keyof typeof SCREENS;
  eyebrow: string;
  headline: string;
  accent: string;
  env: {
    deep: string;
    mid: string;
    bright: string;
    bloom: string;
  };
}> = [
  {
    key: "earnly",
    eyebrow: "Earnly",
    headline: "Learn money early.",
    accent: "#5CE1FF",
    env: {
      deep: "#003D66",
      mid: "#0090FF",
      bright: "#00D4FF",
      bloom: "#FFFFFF",
    },
  },
  {
    key: "scholars",
    eyebrow: "Scholars Notes",
    headline: "Study smarter.",
    accent: "#7EB6FF",
    env: {
      deep: "#0A1B6B",
      mid: "#2F6BFF",
      bright: "#5BA8FF",
      bloom: "#FFFFFF",
    },
  },
  {
    key: "ballr",
    eyebrow: "Ballr",
    headline: "Play. Train. Improve.",
    accent: "#F0FF00",
    env: {
      deep: "#1A2800",
      mid: "#C8F000",
      bright: "#F5FF00",
      bloom: "#FFFFB0",
    },
  },
  {
    key: "fresher",
    eyebrow: "Freshys",
    headline: "Eat closer to home.",
    accent: "#5CFF9A",
    env: {
      deep: "#004D28",
      mid: "#00C853",
      bright: "#39FF88",
      bloom: "#FFFFFF",
    },
  },
];

function stageEnvironment(env: (typeof STAGE_COPY)[number]["env"]) {
  return [
    `radial-gradient(ellipse 160% 130% at 50% 100%, ${env.bloom} 0%, ${env.bright} 16%, ${env.mid} 38%, ${env.deep} 68%, #000000 100%)`,
    `radial-gradient(ellipse 95% 70% at 50% 105%, #ffffff 0%, ${env.bright} 22%, ${env.mid}cc 48%, transparent 72%)`,
    `radial-gradient(ellipse 70% 90% at 0% 60%, ${env.mid}99 0%, transparent 55%)`,
    `radial-gradient(ellipse 70% 90% at 100% 60%, ${env.mid}99 0%, transparent 55%)`,
    `radial-gradient(ellipse 120% 45% at 50% -10%, #000000aa 0%, transparent 65%)`,
  ].join(", ");
}

/** Opening wash — saturated Poppi-style blend of all four app colors. */
function comboEnvironment() {
  const earnly = STAGE_COPY[0].env;
  const scholars = STAGE_COPY[1].env;
  const ballr = STAGE_COPY[2].env;
  const fresher = STAGE_COPY[3].env;
  return [
    `linear-gradient(115deg, ${earnly.mid} 0%, ${scholars.mid} 32%, ${ballr.bright} 62%, ${fresher.mid} 100%)`,
    `radial-gradient(ellipse 90% 70% at 50% 40%, #ffffff55 0%, transparent 55%)`,
    `radial-gradient(ellipse 70% 80% at 12% 75%, ${earnly.bright}cc 0%, transparent 60%)`,
    `radial-gradient(ellipse 70% 80% at 88% 70%, ${fresher.bright}bb 0%, transparent 58%)`,
    `radial-gradient(ellipse 55% 50% at 50% 95%, ${ballr.bright}99 0%, transparent 55%)`,
    `radial-gradient(ellipse 40% 35% at 70% 20%, ${scholars.bright}88 0%, transparent 60%)`,
  ].join(", ");
}

function el(root: HTMLElement, sel: string) {
  return root.querySelector(sel) as HTMLElement | null;
}

function els(root: HTMLElement, sel: string) {
  return gsap.utils.toArray<HTMLElement>(root.querySelectorAll(sel));
}

export function CinematicHome() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      gsap.set(el(root, '[data-bg-wash="combo"]'), { opacity: 1 });
      gsap.set(el(root, "[data-combo-phones]"), { opacity: 1 });
      gsap.set(el(root, "[data-combo-copy]"), { opacity: 1 });
      gsap.set(el(root, "[data-phone]"), { opacity: 0 });
      gsap.set(el(root, "[data-ipad]"), { opacity: 0 });
      gsap.set(el(root, "[data-ballr-fan]"), { opacity: 0 });
      gsap.set(el(root, "[data-earnly-fan]"), { opacity: 0 });
      gsap.set(els(root, "[data-copy]"), { opacity: 0 });
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const travel = isMobile ? 28 : 78;
    const tilt = isMobile ? 8 : 16;
    const yaw = isMobile ? 10 : 22;
    const windows = buildLoopWindows();

    const ctx = gsap.context(() => {
      const scrollDistance = () =>
        Math.round(window.innerHeight * (CINEMATIC_SCROLL_VH / 100));

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${scrollDistance()}`,
          scrub: 0.85,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      gsap.set(els(root, "[data-bg-wash]"), { opacity: 0 });
      gsap.set(el(root, '[data-bg-wash="combo"]'), { opacity: 1 });
      gsap.set(el(root, "[data-combo-phones]"), {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
      });
      gsap.set(el(root, "[data-combo-copy]"), {
        opacity: 1,
        y: 0,
      });
      gsap.set(els(root, "[data-combo-phone]"), {
        opacity: 1,
        filter: "blur(0px)",
      });
      // Rest fan phones into their designed poses, then float gently.
      els(root, "[data-combo-phone]").forEach((item, i) => {
        const fan = FAN_PHONES[i];
        if (!fan) return;
        gsap.set(item, {
          xPercent: -50,
          x: fan.x,
          y: fan.y,
          rotate: fan.rotate,
          scale: fan.scale,
          transformOrigin: "50% 100%",
        });
        const floater = item.querySelector("[data-combo-float]");
        if (floater) {
          gsap.to(floater, {
            y: -12,
            rotate: i % 2 === 0 ? -1.8 : 1.8,
            duration: 2.8 + i * 0.35,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.2,
          });
        }
      });
      gsap.set(el(root, "[data-phone]"), {
        opacity: 0,
        scale: 0.55,
        y: 220,
        x: -40,
        rotate: -18,
        rotateY: 28,
        rotateX: 12,
        transformOrigin: "50% 60%",
        transformPerspective: 1200,
      });
      gsap.set(el(root, "[data-ipad]"), {
        opacity: 0,
        scale: 0.45,
        y: 160,
        rotate: 18,
        rotateY: -30,
        rotateX: 8,
        x: 60,
        transformOrigin: "50% 55%",
        transformPerspective: 1200,
      });
      gsap.set(els(root, "[data-phone-screen]"), { opacity: 0 });
      gsap.set(els(root, "[data-copy]"), { opacity: 0, y: 0 });
      gsap.set(el(root, "[data-ballr-fan]"), { opacity: 0 });
      gsap.set(els(root, "[data-ballr-phone]"), { opacity: 0 });
      gsap.set(el(root, "[data-earnly-fan]"), { opacity: 0 });
      gsap.set(els(root, "[data-earnly-phone]"), { opacity: 0 });

      const fadeCopy = (
        key: string,
        start: number,
        end: number,
        holdOut: boolean,
      ) => {
        const copy = el(root, `[data-copy="${key}"]`);
        const wash = el(root, `[data-bg-wash="${key}"]`);
        const fadeIn = 0.03;
        const fadeOut = 0.03;
        if (wash) {
          tl.to(wash, { opacity: 1, duration: fadeIn }, start);
          if (!holdOut) {
            tl.to(wash, { opacity: 0, duration: fadeOut }, end - fadeOut);
          }
        }
        if (copy) {
          tl.to(copy, { opacity: 1, duration: fadeIn }, start + 0.01);
          if (!holdOut) {
            tl.to(copy, { opacity: 0, duration: 0.05 }, end - fadeOut);
          }
        }
      };

      const showPhoneScreen = (
        key: string,
        start: number,
        end: number,
        holdOut: boolean,
      ) => {
        const screen = el(root, `[data-phone-screen="${key}"]`);
        if (!screen) return;
        tl.to(screen, { opacity: 1, duration: 0.04 }, start);
        if (!holdOut) {
          tl.to(screen, { opacity: 0, duration: 0.05 }, end - 0.05);
        }
      };

      // Opening fan collapses into the first hero phone.
      tl.to(
        el(root, "[data-combo-copy]"),
        {
          opacity: 0,
          y: 36,
          filter: "blur(6px)",
          duration: 0.07,
        },
        COMBO_END - 0.1,
      );
      const comboItems = els(root, "[data-combo-phone]");
      comboItems.forEach((item, i) => {
        const side = i < comboItems.length / 2 ? -1 : 1;
        const fan = FAN_PHONES[i];
        tl.to(
          item,
          {
            opacity: 0,
            y: (fan?.y ?? 0) - 90,
            x: side * (isMobile ? 40 : 90),
            rotate: (fan?.rotate ?? 0) + side * 18,
            scale: (fan?.scale ?? 1) * 0.72,
            filter: "blur(10px)",
            duration: 0.1,
          },
          COMBO_END - 0.1 + i * 0.008,
        );
      });
      tl.to(
        el(root, "[data-combo-phones]"),
        { opacity: 0, duration: 0.04 },
        COMBO_END - 0.03,
      );
      tl.to(
        el(root, '[data-bg-wash="combo"]'),
        { opacity: 0, duration: 0.09 },
        COMBO_END - 0.07,
      );

      // First loop stage owns its own entrance (Earnly fan / etc.) —
      // don't flash the single hero phone between combo and that stage.

      windows.forEach((win, index) => {
        const { key, start, end, holdOut } = win;
        const dir = index % 2 === 0 ? 1 : -1;
        const span = Math.max(0.06, end - start);
        const a = start;
        const b = start + span * 0.35;
        const c = start + span * 0.7;
        const d = end;

        if (key !== "ballr" && key !== "earnly") {
          fadeCopy(key, start, end, holdOut);
        }

        if (key === "scholars") {
          // Hard-cut previous device, then iPad at full opacity.
          tl.to(
            el(root, "[data-phone]"),
            {
              opacity: 0,
              duration: 0.012,
            },
            start,
          );
          tl.fromTo(
            el(root, "[data-ipad]"),
            {
              opacity: 0,
              scale: 0.92,
              rotate: 8 * dir,
              rotateY: 12 * dir,
              rotateX: 4,
              x: travel * 0.35,
              y: 24,
              filter: "blur(4px)",
            },
            {
              opacity: 1,
              scale: 1.04,
              rotate: -4 * dir,
              rotateY: -6 * dir,
              rotateX: -3,
              x: 0,
              y: 0,
              filter: "blur(0px)",
              duration: 0.025,
            },
            start + 0.012,
          );
          tl.to(
            el(root, "[data-ipad]"),
            {
              scale: 1,
              x: travel * 0.22 * dir,
              rotate: 5 * dir,
              rotateY: -yaw * 0.45 * dir,
              rotateX: 2,
              duration: Math.max(0.04, b - (start + 0.05)),
            },
            start + 0.05,
          );
          tl.to(
            el(root, "[data-ipad]"),
            {
              x: -travel * 0.18 * dir,
              rotate: -6 * dir,
              rotateY: yaw * 0.35 * dir,
              y: -8,
              duration: Math.max(0.04, c - b),
            },
            b,
          );
          tl.to(
            el(root, "[data-ipad]"),
            {
              x: travel * 0.1 * dir,
              rotate: 3 * dir,
              rotateY: -yaw * 0.2 * dir,
              y: 0,
              duration: Math.max(0.03, d - c - 0.02),
            },
            c,
          );
          if (!holdOut) {
            const nextStart = windows[index + 1]?.start ?? end;
            // Cut iPad fully before next app — no ghosted overlap.
            tl.to(
              el(root, "[data-ipad]"),
              {
                opacity: 0,
                duration: 0.012,
              },
              nextStart,
            );
          }
        } else if (key === "earnly") {
          fadeCopy("earnly", start, end, holdOut);

          tl.to(
            el(root, "[data-phone]"),
            {
              opacity: 0,
              duration: 0.012,
            },
            start,
          );
          tl.to(
            el(root, "[data-ipad]"),
            { opacity: 0, duration: 0.012 },
            start,
          );

          const earnlyPhones = els(root, "[data-earnly-phone]");
          earnlyPhones.forEach((item, i) => {
            const fan = EARNLY_FAN[i];
            if (!fan) return;
            gsap.set(item, {
              xPercent: -50,
              x: fan.x,
              y: fan.y + 40,
              rotate: fan.rotate * 1.15,
              scale: fan.scale * 0.94,
              opacity: 1,
              filter: "blur(0px)",
              transformOrigin: "50% 100%",
            });
            tl.to(
              item,
              {
                opacity: 1,
                y: fan.y,
                rotate: fan.rotate,
                scale: fan.scale,
                filter: "blur(0px)",
                duration: 0.03,
              },
              start + 0.012 + i * 0.004,
            );
          });
          tl.to(
            el(root, "[data-earnly-fan]"),
            { opacity: 1, duration: 0.018 },
            start + 0.012,
          );
          tl.to(
            el(root, "[data-earnly-fan]"),
            {
              y: -6,
              duration: Math.max(0.05, end - start - 0.06),
            },
            start + 0.05,
          );

          if (!holdOut) {
            const nextStart = windows[index + 1]?.start ?? end;
            // Full-opacity fan until a hard cut into the next app.
            tl.to(
              el(root, "[data-earnly-fan]"),
              { opacity: 0, duration: 0.012 },
              nextStart,
            );
            tl.to(
              earnlyPhones,
              { opacity: 0, duration: 0.012 },
              nextStart,
            );
          }
        } else if (key === "ballr") {
          fadeCopy("ballr", start, end, holdOut);

          // Hide prior device; show Ballr fan at full opacity.
          tl.to(
            el(root, "[data-phone]"),
            {
              opacity: 0,
              duration: 0.012,
            },
            start,
          );
          tl.to(
            el(root, "[data-ipad]"),
            { opacity: 0, duration: 0.012 },
            start,
          );

          const ballrPhones = els(root, "[data-ballr-phone]");
          ballrPhones.forEach((item, i) => {
            const fan = BALLR_FAN[i];
            if (!fan) return;
            gsap.set(item, {
              xPercent: -50,
              x: fan.x,
              y: fan.y + 40,
              rotate: fan.rotate * 1.15,
              scale: fan.scale * 0.94,
              opacity: 1,
              filter: "blur(0px)",
              transformOrigin: "50% 100%",
            });
            tl.to(
              item,
              {
                opacity: 1,
                y: fan.y,
                rotate: fan.rotate,
                scale: fan.scale,
                filter: "blur(0px)",
                duration: 0.03,
              },
              start + 0.012 + i * 0.004,
            );
          });
          tl.to(
            el(root, "[data-ballr-fan]"),
            { opacity: 1, duration: 0.018 },
            start + 0.012,
          );

          // Gentle sway while Ballr is on stage.
          tl.to(
            el(root, "[data-ballr-fan]"),
            {
              y: -6,
              duration: Math.max(0.05, end - start - 0.06),
            },
            start + 0.05,
          );

          if (!holdOut) {
            const nextStart = windows[index + 1]?.start ?? end;
            // Full-opacity fan until a hard cut into Freshys (no ghost phones).
            tl.to(
              el(root, "[data-ballr-fan]"),
              { opacity: 0, duration: 0.012 },
              nextStart,
            );
            tl.to(
              ballrPhones,
              { opacity: 0, duration: 0.012 },
              nextStart,
            );
          }
        } else {
          // Fresher (and any other single-phone app stages).
          showPhoneScreen(key, start, end, holdOut);

          // Ensure fans are gone, then bring this phone in at full opacity.
          tl.to(
            el(root, "[data-earnly-fan]"),
            { opacity: 0, duration: 0.01 },
            start,
          );
          tl.to(
            el(root, "[data-ballr-fan]"),
            { opacity: 0, duration: 0.01 },
            start,
          );
          tl.to(
            el(root, "[data-ipad]"),
            { opacity: 0, duration: 0.01 },
            start,
          );
          tl.fromTo(
            el(root, "[data-phone]"),
            {
              opacity: 0,
              scale: 0.94,
              rotate: -6 * dir,
              rotateY: -8 * dir,
              x: -travel * 0.25,
              y: 20,
              filter: "blur(3px)",
            },
            {
              opacity: 1,
              scale: 1,
              rotate: 0,
              rotateY: 0,
              rotateX: 0,
              x: 0,
              y: 0,
              filter: "blur(0px)",
              duration: 0.022,
            },
            start + 0.012,
          );

          tl.to(
            el(root, "[data-phone]"),
            {
              x: travel * 0.55 * dir,
              y: -6,
              rotate: tilt * 0.85 * dir,
              rotateY: -yaw * 0.7 * dir,
              rotateX: 6,
              scale: 1.04,
              duration: Math.max(0.04, b - a),
            },
            a + 0.04,
          );
          tl.to(
            el(root, "[data-phone]"),
            {
              x: -travel * 0.4 * dir,
              y: 4,
              rotate: -tilt * 0.7 * dir,
              rotateY: yaw * 0.85 * dir,
              rotateX: 2,
              scale: 0.98,
              duration: Math.max(0.04, c - b),
            },
            b,
          );
          tl.to(
            el(root, "[data-phone]"),
            {
              x: travel * 0.2 * dir,
              y: 0,
              rotate: tilt * 0.35 * dir,
              rotateY: -yaw * 0.3 * dir,
              rotateX: 0,
              scale: 1,
              duration: Math.max(0.03, d - c - (holdOut ? 0 : 0.02)),
            },
            c,
          );

          if (!holdOut) {
            const nextStart = windows[index + 1]?.start ?? end;
            tl.to(
              el(root, "[data-phone]"),
              {
                opacity: 0,
                duration: 0.012,
              },
              nextStart,
            );
          }
        }
      });

      tl.to({}, { duration: 0.001 }, 1);
    }, root);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, []);

  return (
    <div className="cinematic-home bg-black text-white">
      <div
        ref={rootRef}
        className="relative h-screen w-full overflow-hidden"
      >
        <div
          className="pointer-events-none absolute h-0 w-0 overflow-hidden"
          aria-hidden
        >
          {Array.from(
            new Set([
              ...Object.values(SCREENS),
              ...Object.values(INTRO_SCREENS),
              ...EARNLY_FAN.map((beat) => beat.src),
              ...BALLR_FAN.map((beat) => beat.src),
            ]),
          ).map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" />
          ))}
        </div>

        <div
          data-bg
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 110% 80% at 50% 120%, #0a1a14 0%, #041018 50%, #000 100%)",
          }}
        />
        <div
          data-bg-wash="combo"
          className="absolute inset-0 will-change-[opacity]"
          style={{ opacity: 1 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: comboEnvironment() }}
          />
          <div
            className="absolute inset-0 opacity-50 mix-blend-soft-light"
            style={{
              backgroundImage: [
                `radial-gradient(circle at 18% 30%, #fff 0 2px, transparent 3px)`,
                `radial-gradient(circle at 72% 22%, #fff 0 1.5px, transparent 2.5px)`,
                `radial-gradient(circle at 40% 70%, #fff 0 2px, transparent 3px)`,
                `radial-gradient(circle at 85% 60%, #fff 0 1px, transparent 2px)`,
                `radial-gradient(circle at 12% 78%, #fff 0 1.5px, transparent 2.5px)`,
                `radial-gradient(circle at 55% 45%, #fff 0 1px, transparent 2px)`,
              ].join(", "),
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-[55%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at center, #ffffff88 0%, #F0FF0044 35%, transparent 70%)",
            }}
          />
        </div>
        {STAGE_COPY.map((stage) => (
          <div
            key={stage.key}
            data-bg-wash={stage.key}
            className="absolute inset-0 will-change-[opacity]"
            style={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: stageEnvironment(stage.env) }}
            />
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage: [
                  `radial-gradient(circle at 18% 62%, #fff 0 1.5px, transparent 2px)`,
                  `radial-gradient(circle at 78% 48%, ${stage.env.bright} 0 1.5px, transparent 2.5px)`,
                  `radial-gradient(circle at 32% 78%, #fff 0 2px, transparent 3px)`,
                  `radial-gradient(circle at 64% 70%, ${stage.env.bright} 0 1px, transparent 2px)`,
                  `radial-gradient(circle at 88% 82%, #fff 0 1.5px, transparent 2.5px)`,
                  `radial-gradient(circle at 12% 40%, ${stage.env.bright} 0 1px, transparent 2px)`,
                  `radial-gradient(circle at 55% 55%, #fff 0 1px, transparent 2px)`,
                  `radial-gradient(circle at 42% 88%, ${stage.env.bright} 0 2px, transparent 3px)`,
                ].join(", "),
                backgroundSize: "100% 100%",
              }}
            />
            <div
              className="absolute inset-x-[-30%] bottom-[-22%] h-[70%] blur-3xl"
              style={{
                background: `radial-gradient(ellipse 65% 55% at 50% 65%, #fff 0%, ${stage.env.bright} 18%, ${stage.env.mid} 42%, transparent 70%)`,
              }}
            />
            <div
              className="absolute inset-x-[-10%] bottom-[-5%] h-[50%] opacity-90 mix-blend-screen"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 50% 90%, ${stage.env.bright} 0%, ${stage.env.mid}99 35%, transparent 65%)`,
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-[45%]"
              style={{
                background: `linear-gradient(to top, ${stage.env.bright}cc 0%, ${stage.env.mid}66 40%, transparent 100%)`,
              }}
            />
          </div>
        ))}

        {STAGE_COPY.map((stage) => (
          <div
            key={stage.key}
            data-copy={stage.key}
            className={
              stage.key === "ballr" || stage.key === "earnly"
                ? "pointer-events-none absolute inset-x-0 bottom-[3.5%] z-30 flex flex-col items-center px-6 text-center will-change-[opacity]"
                : "pointer-events-none absolute inset-x-0 top-[max(4.75rem,9vh)] z-30 flex h-[min(22vh,150px)] flex-col items-center justify-end px-6 text-center will-change-[opacity] md:top-[max(5.25rem,10vh)]"
            }
            style={{ opacity: 0 }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.22em] drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]"
              style={{ color: stage.accent }}
            >
              {stage.eyebrow}
            </p>
            <h2
              className="font-display mt-2 text-[clamp(1.75rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-white"
              style={{
                textShadow:
                  "0 1px 2px rgba(0,0,0,0.8), 0 4px 28px rgba(0,0,0,0.55), 0 0 48px rgba(0,0,0,0.35)",
              }}
            >
              {stage.headline}
            </h2>
          </div>
        ))}

        <div
          data-earnly-fan
          className="pointer-events-none absolute inset-x-0 top-[max(4.5rem,8vh)] z-20 flex h-[min(74vh,760px)] flex-col items-center justify-end will-change-transform"
          style={{ opacity: 0 }}
        >
          <div
            className="relative mx-auto h-full w-full max-w-6xl"
            style={{ perspective: "1600px" }}
          >
            {EARNLY_FAN.map((phone) => (
              <div
                key={phone.src}
                data-earnly-phone
                className="absolute bottom-[6%] left-1/2 will-change-transform"
                style={{
                  zIndex: phone.z,
                  transformOrigin: "50% 100%",
                  opacity: 0,
                }}
              >
                <p
                  className="mb-3 max-w-[11rem] text-center text-xs font-semibold leading-snug tracking-tight text-white sm:mb-3.5 sm:max-w-[13rem] sm:text-sm"
                  style={{
                    textShadow: "0 2px 14px rgba(0,0,0,0.55)",
                  }}
                >
                  {phone.caption}
                </p>
                <div
                  className="pointer-events-none absolute -inset-8 top-6 -z-10 rounded-full opacity-60 blur-2xl"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, #5CE1FF88 0%, transparent 70%)",
                  }}
                  aria-hidden
                />
                <FanPhoneFrame>
                  <Image
                    src={phone.src}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 36vw, 280px"
                    className="object-contain object-top"
                    priority
                  />
                </FanPhoneFrame>
              </div>
            ))}
          </div>
        </div>

        <div
          data-ballr-fan
          className="pointer-events-none absolute inset-x-0 top-[max(4.5rem,8vh)] z-20 flex h-[min(74vh,760px)] flex-col items-center justify-end will-change-transform"
          style={{ opacity: 0 }}
        >
          <div
            className="relative mx-auto h-full w-full max-w-6xl"
            style={{ perspective: "1600px" }}
          >
            {BALLR_FAN.map((phone) => (
              <div
                key={phone.src}
                data-ballr-phone
                className="absolute bottom-[6%] left-1/2 will-change-transform"
                style={{
                  zIndex: phone.z,
                  transformOrigin: "50% 100%",
                  opacity: 0,
                }}
              >
                <p
                  className="mb-3 max-w-[11rem] text-center text-xs font-semibold leading-snug tracking-tight text-white sm:mb-3.5 sm:max-w-[13rem] sm:text-sm"
                  style={{
                    textShadow: "0 2px 14px rgba(0,0,0,0.55)",
                  }}
                >
                  {phone.caption}
                </p>
                <div
                  className="pointer-events-none absolute -inset-8 top-6 -z-10 rounded-full opacity-60 blur-2xl"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, #F0FF0088 0%, transparent 70%)",
                  }}
                  aria-hidden
                />
                <FanPhoneFrame>
                  <Image
                    src={phone.src}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 36vw, 280px"
                    className="object-contain object-top"
                    priority
                  />
                </FanPhoneFrame>
              </div>
            ))}
          </div>
        </div>

        <div
          data-combo-phones
          className="absolute inset-x-0 top-[max(4.5rem,8vh)] z-20 flex h-[min(68vh,680px)] flex-col items-center justify-end will-change-transform sm:h-[min(70vh,720px)]"
        >
          <div
            className="relative mx-auto h-full w-full max-w-5xl"
            style={{ perspective: "1600px" }}
          >
            {FAN_PHONES.map((phone) => (
              <div
                key={phone.key}
                data-combo-phone={phone.key}
                className="absolute bottom-[8%] left-1/2 will-change-transform"
                style={{
                  zIndex: phone.z,
                  transformOrigin: "50% 100%",
                }}
              >
                <div data-combo-float className="will-change-transform">
                  <div
                    className="pointer-events-none absolute -inset-10 -z-10 rounded-full opacity-70 blur-2xl"
                    style={{
                      background: `radial-gradient(ellipse at center, ${phone.accent}88 0%, transparent 70%)`,
                    }}
                    aria-hidden
                  />
                  <FanPhoneFrame>
                    <Image
                      src={phone.src}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 36vw, 280px"
                      className="object-contain object-top"
                      priority
                    />
                  </FanPhoneFrame>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          data-combo-copy
          className="absolute inset-x-0 bottom-[4%] z-30 flex flex-col items-center px-6 text-center will-change-transform sm:bottom-[5%]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-xs">
            Four apps. One family.
          </p>
          <h1
            className="font-display mt-3 max-w-3xl text-[clamp(2rem,6vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-white"
            style={{
              textShadow:
                "0 2px 4px rgba(0,0,0,0.35), 0 12px 40px rgba(0,0,0,0.25)",
            }}
          >
            {brand.tagline}
          </h1>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90"
            >
              Explore plans
            </Link>
            <Link
              href="/#apps"
              className="inline-flex items-center justify-center rounded-full border border-white/50 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white hover:bg-white/20"
            >
              See the apps
            </Link>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-[3%] top-[max(9.5rem,30vh)] z-20 flex items-start justify-center pt-2 md:top-[max(10rem,29vh)]"
          style={{ perspective: "1400px" }}
        >
          <div
            data-phone
            className="will-change-transform"
            style={{ opacity: 0, transformStyle: "preserve-3d" }}
          >
            <PhoneFrame>
              {(Object.keys(SCREENS) as Array<keyof typeof SCREENS>)
                .filter((k) => k !== "scholars" && k !== "ballr" && k !== "earnly")
                .map((key) => (
                  <div
                    key={key}
                    data-phone-screen={key}
                    className="absolute inset-0"
                    style={{ opacity: 0 }}
                  >
                    <Image
                      src={SCREENS[key]}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 70vw, 280px"
                      className="object-cover object-top"
                      priority={key === "fresher"}
                    />
                  </div>
                ))}
            </PhoneFrame>
          </div>

          <div
            data-ipad
            className="absolute will-change-transform"
            style={{ opacity: 0, transformStyle: "preserve-3d" }}
          >
            <IPadFrame>
              <Image
                src={SCREENS.scholars}
                alt=""
                fill
                sizes="(max-width: 768px) 90vw, 680px"
                className="object-cover object-top"
                priority
              />
            </IPadFrame>
          </div>
        </div>
      </div>

      <AppPhoneShowcase />
    </div>
  );
}

function FanPhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative"
      style={{
        // Taller aspect matches our cropped app screens so nothing is zoomed/cropped.
        width: "min(280px, 32vw)",
        aspectRatio: "9 / 21.5",
      }}
    >
      <div className="absolute inset-0 rounded-[2.15rem] bg-gradient-to-b from-neutral-200 via-neutral-500 to-neutral-900 p-[2.5px] shadow-[0_32px_70px_rgba(0,0,0,0.5)] sm:rounded-[2.35rem]">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-[#f4f5f7] sm:rounded-[2.2rem]">
          <div className="absolute left-1/2 top-2.5 z-10 h-[18px] w-[30%] -translate-x-1/2 rounded-full bg-black sm:top-3 sm:h-[20px]" />
          <div className="absolute inset-[3px] overflow-hidden rounded-[1.85rem] bg-[#f4f5f7] sm:rounded-[2.05rem]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: "min(250px, 48vw)",
        aspectRatio: "9 / 19.5",
      }}
    >
      <div className="absolute inset-0 rounded-[2.35rem] bg-gradient-to-b from-neutral-200 via-neutral-500 to-neutral-800 p-[2px] shadow-[0_40px_90px_rgba(0,0,0,0.6)]">
        <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-black">
          <div className="absolute left-1/2 top-2.5 z-10 h-[22px] w-[30%] -translate-x-1/2 rounded-full bg-black" />
          <div className="absolute inset-[3px] overflow-hidden rounded-[2.05rem] bg-neutral-950">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function IPadFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: "min(560px, 82vw)",
        aspectRatio: "4 / 3",
      }}
    >
      <div className="absolute inset-0 rounded-[1.55rem] bg-gradient-to-b from-neutral-300 via-neutral-500 to-neutral-700 p-[3px] shadow-[0_50px_110px_rgba(0,0,0,0.6)]">
        <div className="relative h-full w-full overflow-hidden rounded-[1.4rem] bg-black">
          <span className="absolute left-1/2 top-2 z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-neutral-600" />
          <div className="absolute inset-[10px] overflow-hidden rounded-[1.05rem] bg-neutral-950 sm:inset-[14px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
