"use client";

import Image from "next/image";
import { useState } from "react";
import { ecosystemCircle, getEcosystemCircleApps } from "@/config/about";
import { StoryReveal } from "./StoryReveal";
import {
  AppScreenshotImage,
  getScreenshotDevice,
  getScreenshotFrameClass,
} from "@/components/ui/AppScreenshotImage";

export function EcosystemCircleSection() {
  const apps = getEcosystemCircleApps();
  const [active, setActive] = useState(0);

  const positions = [
    "left-1/2 top-0 -translate-x-1/2",
    "right-0 top-1/2 -translate-y-1/2",
    "left-1/2 bottom-0 -translate-x-1/2",
    "left-0 top-1/2 -translate-y-1/2",
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-white py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-indigo-50/20 to-sky-50/30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StoryReveal variant="fade-up">
          <h2 className="text-center text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-7xl">
            {ecosystemCircle.headline}
          </h2>
        </StoryReveal>

        {/* Desktop circle layout */}
        <div className="relative mx-auto mt-16 hidden h-[600px] max-w-3xl lg:block">
          {/* Glowing connection SVG */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 600" aria-hidden="true">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.6" />
                <stop offset="33%" stopColor="#6366f1" stopOpacity="0.6" />
                <stop offset="66%" stopColor="#ea580c" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <circle
              cx="300"
              cy="300"
              r="180"
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="2"
              strokeDasharray="12 8"
              className="animate-spin"
              style={{ animationDuration: "30s" }}
            />
            <path
              d="M300 120 L480 300 L300 480 L120 300 Z"
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="1.5"
              opacity="0.5"
            />
            <circle cx="300" cy="300" r="12" fill="#171717" className="animate-pulse" />
          </svg>

          {apps.map((app, i) => (
            <div key={app.slug} className={`absolute ${positions[i]} z-10`}>
              <PhoneNode
                app={app}
                expanded={active === i}
                onHover={() => setActive(i)}
              />
            </div>
          ))}
        </div>

        {/* Mobile stack with expand */}
        <div className="mt-12 space-y-6 lg:hidden">
          {apps.map((app, i) => (
            <StoryReveal key={app.slug} variant="fade-up" delay={i * 100}>
              <PhoneNode
                app={app}
                expanded={active === i}
                onHover={() => setActive(i)}
                mobile
              />
            </StoryReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PhoneNode({
  app,
  expanded,
  onHover,
  mobile = false,
}: {
  app: ReturnType<typeof getEcosystemCircleApps>[number];
  expanded: boolean;
  onHover: () => void;
  mobile?: boolean;
}) {
  const device = getScreenshotDevice(app);
  const isTablet = device === "tablet";

  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onHover}
      className={`group text-left transition-all duration-500 ${
        mobile ? "w-full" : expanded ? "scale-110" : "scale-100 hover:scale-105"
      }`}
    >
      <div
        className={`overflow-hidden rounded-[2rem] border bg-white/80 shadow-2xl backdrop-blur-xl transition-all duration-500 ${
          expanded
            ? "border-neutral-300 ring-4 ring-offset-2"
            : "border-neutral-100"
        } ${mobile ? "flex items-center gap-4 p-4" : "p-3"}`}
        style={{
          ...(expanded ? { boxShadow: `0 0 0 4px ${app.accentColor}33` } : {}),
          width: mobile ? "100%" : expanded ? (isTablet ? 240 : 200) : isTablet ? 200 : 160,
        }}
      >
        <div
          className={`relative overflow-hidden rounded-[1.5rem] ${mobile ? (isTablet ? "h-24 w-36 shrink-0" : "h-32 w-20 shrink-0") : `mx-auto w-full ${getScreenshotFrameClass(device)} ${isTablet ? "max-w-[220px]" : "max-w-[180px]"}`}`}
          style={{ backgroundColor: app.accentColorLight }}
        >
          <AppScreenshotImage
            app={app}
            src={app.screenshotPath}
            alt={app.name}
            fill
          />
        </div>
        <div className={mobile ? "min-w-0 flex-1" : "mt-3 px-2 pb-2 text-center"}>
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <Image src={app.iconPath} alt="" width={20} height={20} className="h-5 w-5" />
            <p className="font-semibold text-neutral-900">{app.name}</p>
          </div>
          {expanded && (
            <ul className="mt-2 space-y-1">
              {app.features.slice(0, 3).map((f) => (
                <li key={f} className="text-xs text-neutral-600">
                  • {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </button>
  );
}
