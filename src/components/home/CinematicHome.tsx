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
import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AppPhoneShowcase } from "@/components/home/AppPhoneShowcase";

gsap.registerPlugin(ScrollTrigger);

/** Scroll runway height in viewport units. Raise for slower / longer experience. */
export const CINEMATIC_SCROLL_VH = 560;

/** How long the all-apps opening holds before the first app takes over. */
const COMBO_END = 0.12;

/** App order for the looping scroll commercial. */
const APP_LOOP = ["earnly", "scholars", "ballr", "fresher"] as const;
/** How many times the sequence repeats while pinned. */
const LOOP_COUNT = 2;

const SCREENS = {
  earnly: "/images/home/cinematic/earnly.png",
  scholars: "/images/home/cinematic/scholars.png",
  ballr: "/images/home/cinematic/ballr.png",
  fresher: "/images/home/cinematic/fresher.png",
} as const;

/** Phone-shaped screenshots for the opening 4-up row. */
const INTRO_SCREENS = {
  earnly: "/images/home/cinematic/earnly.png",
  scholars: "/images/home/cinematic/scholars-phone.png",
  ballr: "/images/home/cinematic/ballr.png",
  fresher: "/images/home/cinematic/fresher.png",
} as const;

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
  const overlap = slot * 0.22;
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
    accent: "#E8FF3D",
    env: {
      deep: "#2A3D00",
      mid: "#A8E000",
      bright: "#D4FF00",
      bloom: "#FFFFFF",
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

/** Opening wash: all four app colors blended into one field. */
function comboEnvironment() {
  const earnly = STAGE_COPY[0].env;
  const scholars = STAGE_COPY[1].env;
  const ballr = STAGE_COPY[2].env;
  const fresher = STAGE_COPY[3].env;
  return [
    `radial-gradient(ellipse 100% 70% at 50% 108%, #ffffff 0%, transparent 42%)`,
    `radial-gradient(ellipse 85% 90% at 8% 78%, ${earnly.bright} 0%, ${earnly.mid}aa 32%, transparent 62%)`,
    `radial-gradient(ellipse 80% 85% at 92% 72%, ${scholars.bright} 0%, ${scholars.mid}aa 34%, transparent 64%)`,
    `radial-gradient(ellipse 75% 80% at 22% 18%, ${scholars.mid}99 0%, transparent 55%)`,
    `radial-gradient(ellipse 90% 85% at 78% 88%, ${ballr.bright} 0%, ${ballr.mid}99 38%, transparent 68%)`,
    `radial-gradient(ellipse 80% 75% at 88% 22%, ${fresher.bright} 0%, ${fresher.mid}99 36%, transparent 62%)`,
    `radial-gradient(ellipse 70% 60% at 40% 55%, ${fresher.mid}55 0%, transparent 58%)`,
    `linear-gradient(165deg, #001428 0%, #0a1a08 45%, #001a12 100%)`,
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
      gsap.set(el(root, "[data-phone]"), { opacity: 0 });
      gsap.set(el(root, "[data-ipad]"), { opacity: 0 });
      gsap.set(els(root, "[data-copy]"), { opacity: 0 });
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const travel = isMobile ? 16 : 48;
    const tilt = isMobile ? 3 : 7;
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
          scrub: 0.7,
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
      });
      gsap.set(el(root, "[data-phone]"), {
        opacity: 0,
        scale: 0.72,
        y: 180,
        rotate: -8,
        x: 0,
        transformOrigin: "50% 50%",
      });
      gsap.set(el(root, "[data-ipad]"), {
        opacity: 0,
        scale: 0.55,
        y: 120,
        rotate: 10,
        x: 40,
        transformOrigin: "50% 50%",
      });
      gsap.set(els(root, "[data-phone-screen]"), { opacity: 0 });
      gsap.set(els(root, "[data-copy]"), { opacity: 0, y: 0 });

      const fadeCopy = (
        key: string,
        start: number,
        end: number,
        holdOut: boolean,
      ) => {
        const copy = el(root, `[data-copy="${key}"]`);
        const wash = el(root, `[data-bg-wash="${key}"]`);
        const fadeIn = 0.06;
        const fadeOut = 0.08;
        if (wash) {
          tl.to(wash, { opacity: 1, duration: fadeIn }, start);
          if (!holdOut) {
            tl.to(wash, { opacity: 0, duration: fadeOut }, end - fadeOut);
          }
        }
        if (copy) {
          // Opacity only — keep headlines locked so they never drift when a device fades in.
          tl.to(copy, { opacity: 1, duration: fadeIn }, start + 0.01);
          if (!holdOut) {
            tl.to(copy, { opacity: 0, duration: 0.06 }, end - fadeOut);
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
        tl.to(screen, { opacity: 1, duration: 0.05 }, start);
        if (!holdOut) {
          tl.to(screen, { opacity: 0, duration: 0.06 }, end - 0.06);
        }
      };

      tl.to(
        el(root, "[data-combo-phones]"),
        {
          opacity: 0,
          y: -40,
          scale: 0.92,
          filter: "blur(6px)",
          duration: 0.08,
        },
        COMBO_END - 0.07,
      );
      tl.to(
        el(root, '[data-bg-wash="combo"]'),
        { opacity: 0, duration: 0.08 },
        COMBO_END - 0.06,
      );

      const first = windows[0];
      tl.to(
        el(root, "[data-phone]"),
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotate: -tilt * 0.2,
          duration: 0.08,
        },
        first.start - 0.02,
      );

      windows.forEach((win, index) => {
        const { key, start, end, holdOut } = win;
        const dir = index % 2 === 0 ? 1 : -1;

        fadeCopy(key, start, end, holdOut);

        if (key === "scholars") {
          tl.to(
            el(root, "[data-phone]"),
            {
              opacity: 0,
              scale: 0.7,
              rotate: -16,
              x: -travel,
              filter: "blur(5px)",
              duration: 0.08,
            },
            start,
          );
          tl.to(
            el(root, "[data-ipad]"),
            {
              opacity: 1,
              scale: 1,
              rotate: -2,
              y: 0,
              x: 0,
              filter: "blur(0px)",
              duration: 0.1,
            },
            start + 0.02,
          );
          tl.to(
            el(root, "[data-ipad]"),
            {
              x: travel * 0.15 * dir,
              rotate: 2 * dir,
              duration: Math.max(0.04, end - start - 0.04),
            },
            start + 0.04,
          );
          if (!holdOut) {
            const nextStart = windows[index + 1]?.start ?? end;
            tl.to(
              el(root, "[data-ipad]"),
              {
                opacity: 0,
                scale: 0.75,
                rotate: 12,
                x: travel,
                filter: "blur(5px)",
                duration: 0.08,
              },
              nextStart,
            );
            tl.to(
              el(root, "[data-phone]"),
              {
                opacity: 1,
                scale: 1,
                rotate: 0,
                x: 0,
                y: 0,
                filter: "blur(0px)",
                duration: 0.09,
              },
              nextStart + 0.02,
            );
          }
        } else {
          showPhoneScreen(key, start, end, holdOut);
          tl.to(
            el(root, "[data-phone]"),
            {
              x: travel * 0.28 * dir,
              y: 0,
              rotate: tilt * 0.35 * dir,
              scale: key === "ballr" ? 1.03 : 1,
              duration: end - start,
            },
            start,
          );
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
            new Set([...Object.values(SCREENS), ...Object.values(INTRO_SCREENS)]),
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
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: [
                `radial-gradient(circle at 18% 62%, #fff 0 1.5px, transparent 2px)`,
                `radial-gradient(circle at 78% 48%, #5CE1FF 0 1.5px, transparent 2.5px)`,
                `radial-gradient(circle at 32% 78%, #E8FF3D 0 2px, transparent 3px)`,
                `radial-gradient(circle at 64% 70%, #7EB6FF 0 1px, transparent 2px)`,
                `radial-gradient(circle at 88% 82%, #5CFF9A 0 1.5px, transparent 2.5px)`,
                `radial-gradient(circle at 12% 40%, #00D4FF 0 1px, transparent 2px)`,
                `radial-gradient(circle at 55% 55%, #fff 0 1px, transparent 2px)`,
                `radial-gradient(circle at 42% 88%, #39FF88 0 2px, transparent 3px)`,
              ].join(", "),
              backgroundSize: "100% 100%",
            }}
          />
          <div
            className="absolute inset-x-[-30%] bottom-[-22%] h-[70%] blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 35% 65%, #00D4FF88 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 70% 70%, #39FF8888 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 55% 80%, #D4FF0066 0%, transparent 60%)",
            }}
          />
          <div
            className="absolute inset-x-[-10%] bottom-[-5%] h-[50%] opacity-80 mix-blend-screen"
            style={{
              background:
                "radial-gradient(ellipse 90% 60% at 50% 90%, #5CE1FF66 0%, #5CFF9A44 40%, transparent 70%)",
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
            className="pointer-events-none absolute inset-x-0 top-[max(4.75rem,9vh)] z-30 flex h-[min(22vh,150px)] flex-col items-center justify-end px-6 text-center will-change-[opacity] md:top-[max(5.25rem,10vh)]"
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
          data-combo-phones
          className="pointer-events-none absolute inset-x-0 bottom-[5%] top-[max(5.25rem,11vh)] z-20 flex items-center justify-center px-3 will-change-transform sm:px-6 md:px-10"
        >
          <div className="flex w-full max-w-6xl items-end justify-between gap-2 sm:gap-4 md:gap-8">
            {STAGE_COPY.map((stage) => (
              <div
                key={stage.key}
                className="flex min-w-0 flex-1 flex-col items-center gap-2.5 sm:gap-3"
              >
                <p
                  className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-xs"
                  style={{
                    color: stage.accent,
                    textShadow: "0 2px 16px rgba(0,0,0,0.45)",
                  }}
                >
                  {stage.eyebrow}
                </p>
                <ComboPhoneFrame>
                  <Image
                    src={INTRO_SCREENS[stage.key]}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 22vw, 160px"
                    className="object-cover object-top"
                    priority
                  />
                </ComboPhoneFrame>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[3%] top-[max(9.5rem,30vh)] z-20 flex items-start justify-center pt-2 md:top-[max(10rem,29vh)]">
          <div
            data-phone
            className="will-change-transform"
            style={{ opacity: 0 }}
          >
            <PhoneFrame>
              {(Object.keys(SCREENS) as Array<keyof typeof SCREENS>)
                .filter((k) => k !== "scholars")
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
                      priority={key === "earnly" || key === "ballr"}
                    />
                  </div>
                ))}
            </PhoneFrame>
          </div>

          <div
            data-ipad
            className="absolute will-change-transform"
            style={{ opacity: 0 }}
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

function ComboPhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: "min(158px, 21vw)",
        aspectRatio: "9 / 19.5",
      }}
    >
      <div className="absolute inset-0 rounded-[1.65rem] bg-gradient-to-b from-neutral-200 via-neutral-500 to-neutral-800 p-[1.5px] shadow-[0_24px_50px_rgba(0,0,0,0.5)] sm:rounded-[1.85rem]">
        <div className="relative h-full w-full overflow-hidden rounded-[1.55rem] bg-black sm:rounded-[1.75rem]">
          <div className="absolute left-1/2 top-1.5 z-10 h-[14px] w-[28%] -translate-x-1/2 rounded-full bg-black sm:top-2 sm:h-[16px]" />
          <div className="absolute inset-[2px] overflow-hidden rounded-[1.45rem] bg-neutral-950 sm:rounded-[1.65rem]">
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
