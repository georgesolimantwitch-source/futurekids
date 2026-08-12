"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { brand, listedApps } from "@/config/brand";

type AppSticker = {
  slug: string;
  name: string;
  icon: string;
  href: string;
  left: number;
  top: number;
  rotate: number;
  depth: number;
  delay: string;
};

type Doodle = {
  emoji: string;
  left: string;
  top: string;
  rotate: number;
  depth: number;
  size: string;
};

/** Percent positions — shared by stickers + connecting rope */
const APP_LAYOUT = [
  { left: 7, top: 44, rotate: -9, depth: 46, delay: "0s" },
  { left: 28, top: 30, rotate: 7, depth: 66, delay: "0.35s" },
  { left: 50, top: 46, rotate: -5, depth: 34, delay: "0.7s" },
  { left: 72, top: 29, rotate: 8, depth: 54, delay: "1.05s" },
  { left: 93, top: 43, rotate: -7, depth: 48, delay: "1.4s" },
] as const;

const APP_STICKERS: AppSticker[] = listedApps.map((app, index) => {
  const layout = APP_LAYOUT[index] ?? APP_LAYOUT[2];
  return {
    slug: app.slug,
    name: app.name,
    icon: app.iconPath,
    href: app.learnMorePath,
    ...layout,
  };
});

const DOODLES: Doodle[] = [
  { emoji: "📚", left: "18%", top: "78%", rotate: -12, depth: 30, size: "text-5xl" },
  { emoji: "✏️", left: "42%", top: "82%", rotate: 10, depth: 70, size: "text-5xl" },
  { emoji: "🧮", left: "64%", top: "78%", rotate: -7, depth: 40, size: "text-5xl" },
  { emoji: "⭐️", left: "5%", top: "74%", rotate: 6, depth: 80, size: "text-4xl" },
  { emoji: "📝", left: "88%", top: "76%", rotate: -10, depth: 50, size: "text-4xl" },
  { emoji: "💡", left: "50%", top: "12%", rotate: 8, depth: 90, size: "text-4xl" },
];

/** Clothesline rope + drop strings through each sticker’s washi-tape point */
function AppRope({ stickers }: { stickers: AppSticker[] }) {
  if (stickers.length < 2) return null;

  // Pin sits just above each card’s washi tape
  const attachY = (top: number) => Math.max(12, top - 16);
  const points = stickers.map((s) => ({
    x: s.left,
    y: attachY(s.top),
    cardY: s.top - 7,
    slug: s.slug,
  }));

  // Wavy clothesline through the pin points
  const lineParts: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const sag = i % 2 === 0 ? -4.8 : 4.2;
    lineParts.push(
      `Q ${midX} ${(prev.y + curr.y) / 2 + sag} ${curr.x} ${curr.y}`,
    );
  }
  const clothesline = lineParts.join(" ");

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="rope-fiber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b6a3a" />
            <stop offset="35%" stopColor="#c4a06a" />
            <stop offset="70%" stopColor="#9a7340" />
            <stop offset="100%" stopColor="#b89258" />
          </linearGradient>
        </defs>

        <path
          d={clothesline}
          fill="none"
          stroke="rgba(80, 50, 15, 0.2)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          transform="translate(0 0.65)"
        />
        <path
          d={clothesline}
          fill="none"
          stroke="url(#rope-fiber)"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={clothesline}
          fill="none"
          stroke="rgba(255, 236, 200, 0.5)"
          strokeWidth="0.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          transform="translate(0 -0.22)"
        />

        {points.map((p) => (
          <path
            key={`drop-${p.slug}`}
            d={`M ${p.x} ${p.y} L ${p.x} ${p.cardY}`}
            fill="none"
            stroke="#a67c45"
            strokeWidth="0.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.9"
          />
        ))}
      </svg>

      {points.map((p) => (
        <span
          key={`pin-${p.slug}`}
          className="app-rope-pin absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        />
      ))}
    </div>
  );
}

export function StudyBoardHero() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const handleMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPointer({
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    });
    setActive(true);
  }, []);

  const handleLeave = useCallback(() => {
    setActive(false);
    setPointer({ x: 0, y: 0 });
  }, []);

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const layerTransform = (depth: number) => {
    if (reduceMotion) return undefined;
    const factor = active ? depth : 0;
    return {
      transform: `translate3d(${(pointer.x * factor).toFixed(1)}px, ${(
        pointer.y * factor
      ).toFixed(1)}px, 0)`,
    };
  };

  return (
    <section className="paper-bg relative overflow-hidden">
      <div className="paper-vignette pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-5xl px-4 pt-14 text-center sm:px-6 sm:pt-16">
        <p className="text-base font-semibold tracking-tight text-[#c0873c] sm:text-lg">
          {brand.productName}
        </p>
        <h1 className="font-display mt-2 text-[2.6rem] font-semibold leading-[1.03] tracking-tight text-[#2a1e12] sm:text-6xl">
          {brand.tagline}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-[#5b4a37] sm:text-[21px]">
          {brand.description}
        </p>
        <div className="mt-5 flex items-center justify-center gap-4">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full bg-[#0071e3] px-[19px] py-[7px] text-[17px] font-normal text-white transition-colors hover:bg-[#0077ed]"
          >
            Explore plans
          </Link>
          <Link
            href="/#apps"
            className="inline-flex items-center justify-center rounded-full border border-[#0071e3] px-[19px] py-[7px] text-[17px] font-normal text-[#0071e3] transition-colors hover:bg-[#0071e3] hover:text-white"
          >
            See the apps
          </Link>
        </div>
      </div>

      <div
        ref={boardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="relative mx-auto h-[460px] w-full max-w-6xl px-2 sm:h-[500px] sm:px-4"
      >
        {/* Narrow screens pull the board in so the outer cards stay fully visible */}
        <div className="absolute inset-y-0 inset-x-10 sm:inset-x-8 md:inset-x-5 lg:inset-x-0">
          <AppRope stickers={APP_STICKERS} />

          {DOODLES.map((doodle) => (
            <div
              key={doodle.emoji}
              className="sticker-layer absolute -translate-x-1/2 -translate-y-1/2 select-none"
              style={{ left: doodle.left, top: doodle.top, ...layerTransform(doodle.depth) }}
              aria-hidden
            >
              <div className="sticker-float">
                <span
                  className={`sticker inline-block ${doodle.size} drop-shadow-[0_8px_16px_rgba(90,60,20,0.25)]`}
                  style={{ ["--r" as string]: `${doodle.rotate}deg` }}
                >
                  {doodle.emoji}
                </span>
              </div>
            </div>
          ))}

          {APP_STICKERS.map((sticker) => (
            <div
              key={sticker.slug}
              // Cards overlap on phones; the raised ones stack on top so no app name is hidden.
              className={`sticker-layer absolute -translate-x-1/2 -translate-y-1/2 ${
                sticker.top < 40 ? "z-[3]" : "z-[2]"
              }`}
              style={{
                left: `${sticker.left}%`,
                top: `${sticker.top}%`,
                ...layerTransform(sticker.depth),
              }}
            >
              <div
                className="sticker-float"
                style={{ animationDelay: sticker.delay }}
              >
                <Link
                  href={sticker.href}
                  aria-label={`${sticker.name} — learn more`}
                  className="sticker paper-card group relative flex w-[96px] flex-col items-center gap-2 rounded-xl px-2 pb-3 pt-5 min-[360px]:w-[112px] min-[360px]:px-3 sm:w-[140px] sm:px-4"
                  style={{ ["--r" as string]: `${sticker.rotate}deg` }}
                >
                  <span className="washi-tape" aria-hidden />
                  <Image
                    src={sticker.icon}
                    alt=""
                    width={72}
                    height={72}
                    className="h-14 w-14 rounded-[22%] shadow-sm sm:h-[72px] sm:w-[72px]"
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-[#2a1e12]">
                    {sticker.name}
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white"
        aria-hidden
      />
    </section>
  );
}
