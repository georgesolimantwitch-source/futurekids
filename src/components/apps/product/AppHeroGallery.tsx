"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { type AppConfig } from "@/config/brand";
import {
  getScreenshotDevice,
  isUnoptimizedScreenshot,
} from "@/components/ui/AppScreenshotImage";

const AUTOPLAY_MS = 5000;
/** Keeps every app's hero the same height even though poster ratios differ. */
const MAX_HEIGHT_PX = 620;
const MAX_WIDTH_PX = 340;
const SWIPE_THRESHOLD_PX = 40;

const DEVICE_ASPECT = { phone: "9/19", tablet: "4/3" } as const;

interface AppHeroGalleryProps {
  app: AppConfig;
}

export function AppHeroGallery({ app }: AppHeroGalleryProps) {
  const slides =
    app.screenshots.length > 0
      ? app.screenshots
      : [{ path: app.screenshotPath, alt: `${app.name} app screenshot`, caption: undefined }];

  const isMarketing = app.screenshotGalleryStyle === "marketing";
  const aspect = app.screenshotAspect ?? DEVICE_ASPECT[getScreenshotDevice(app)];
  const [aspectWidth, aspectHeight] = aspect.split("/").map(Number);
  const frameWidth = Math.round(
    Math.min(MAX_WIDTH_PX, (MAX_HEIGHT_PX * aspectWidth) / aspectHeight),
  );
  const framePadding = isMarketing ? 0 : 40;

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const step = (delta: number) =>
    setActive((current) => (current + delta + slides.length) % slides.length);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const caption = slides[active]?.caption;

  const frame = (
    <div
      className="relative w-full overflow-hidden rounded-[26px] shadow-2xl ring-1 ring-black/5"
      style={{ aspectRatio: aspect }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        const startX = touchStartX.current;
        touchStartX.current = null;
        if (startX === null) return;
        const distance = event.changedTouches[0].clientX - startX;
        if (Math.abs(distance) > SWIPE_THRESHOLD_PX) step(distance < 0 ? 1 : -1);
      }}
    >
      {slides.map((slide, index) => (
        <Image
          key={slide.path}
          src={slide.path}
          alt={slide.alt}
          fill
          unoptimized={isUnoptimizedScreenshot(slide.path)}
          priority={index === 0}
          loading={index === 0 ? undefined : "lazy"}
          sizes={`(max-width: 640px) 90vw, ${frameWidth}px`}
          className={`object-cover transition-opacity duration-700 ${
            index === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div
      className="mx-auto w-full"
      style={{ maxWidth: frameWidth + framePadding }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {isMarketing ? (
        frame
      ) : (
        <div
          className="rounded-[32px] p-5"
          style={{ backgroundColor: app.accentColorLight }}
        >
          {frame}
        </div>
      )}

      {slides.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-4">
          <GalleryArrow
            direction="previous"
            accentColor={app.accentColor}
            onClick={() => step(-1)}
          />
          <div className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.path}
                type="button"
                onClick={() => setActive(index)}
                aria-label={slide.caption ?? slide.alt}
                aria-current={index === active}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: index === active ? 22 : 8,
                  backgroundColor: index === active ? app.accentColor : "#d4d4d4",
                }}
              />
            ))}
          </div>
          <GalleryArrow
            direction="next"
            accentColor={app.accentColor}
            onClick={() => step(1)}
          />
        </div>
      )}

      {caption && (
        <p
          className="mt-4 text-center text-sm font-medium text-neutral-600"
          aria-live="polite"
        >
          {caption}
        </p>
      )}
    </div>
  );
}

function GalleryArrow({
  direction,
  accentColor,
  onClick,
}: {
  direction: "previous" | "next";
  accentColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${direction === "next" ? "Next" : "Previous"} screenshot`}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:text-neutral-900"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        style={{ color: accentColor }}
        aria-hidden="true"
      >
        <path d={direction === "next" ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} />
      </svg>
    </button>
  );
}
