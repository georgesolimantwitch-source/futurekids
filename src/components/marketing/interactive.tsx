"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { siteApps, type FeaturedSlug } from "@/config/site";
import { Icon } from "@/components/site/Icon";

const demoKids: { name: string; age: string; initial: string; tint: string; apps: FeaturedSlug[] }[] = [
  { name: "Maya", age: "Age 12", initial: "M", tint: "#f3efff", apps: ["earnly", "scholars", "fresher"] },
  { name: "Leo", age: "Age 9", initial: "L", tint: "#fff1eb", apps: ["ballr", "earnly"] },
];

export function FamilyDashboardDemo() {
  const [access, setAccess] = useState(() =>
    Object.fromEntries(demoKids.map((kid) => [kid.name, new Set(kid.apps)])),
  );
  const [active, setActive] = useState(demoKids[0].name);

  function toggle(kid: string, slug: FeaturedSlug) {
    setAccess((current) => {
      const next = new Set(current[kid]);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return { ...current, [kid]: next };
    });
  }

  const kid = demoKids.find((k) => k.name === active)!;
  const enabled = access[active];

  return (
    <div className="rounded-[32px] bg-white p-5 shadow-[0_40px_90px_-40px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">Family account</p>
          <p className="mt-1 text-xl font-extrabold text-ink">Manage kids</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-bold text-[#15803d]">
          <span className="pulse-ring h-2 w-2 rounded-full bg-[#16a34a]" />
          All Access
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {demoKids.map((k) => {
          const selected = k.name === active;
          return (
            <button
              key={k.name}
              type="button"
              onClick={() => setActive(k.name)}
              className={`press flex items-center gap-3 rounded-2xl p-3 text-left ring-1 transition-all duration-300 ${
                selected ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-ink/10 hover:ring-ink/25"
              }`}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold text-ink"
                style={{ background: k.tint }}
              >
                {k.initial}
              </span>
              <span>
                <span className="block text-sm font-bold">{k.name}</span>
                <span className={`block text-xs ${selected ? "text-white/60" : "text-ink-faint"}`}>
                  {k.age} · {access[k.name].size} apps
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-5 space-y-2.5">
        {siteApps.map((app) => {
          const on = enabled.has(app.slug);
          return (
            <li key={app.slug}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`${on ? "Turn off" : "Turn on"} ${app.name} for ${kid.name}`}
                onClick={() => toggle(kid.name, app.slug)}
                className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors duration-300 hover:bg-ink/[0.03]"
              >
                <Image src={app.iconPath} alt="" width={40} height={40} className="h-10 w-10 rounded-xl" />
                <span className="flex-1">
                  <span className="block text-sm font-bold text-ink">{app.name}</span>
                  <span className="block text-xs text-ink-faint">{on ? "Login enabled" : "Off"}</span>
                </span>
                <span
                  className="relative h-7 w-12 rounded-full transition-colors duration-300"
                  style={{ background: on ? app.color : "rgba(11,16,32,0.12)" }}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      on ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-center text-xs text-ink-faint">Try it — tap a switch.</p>
    </div>
  );
}

export function ScrollWords({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const value = reduced ? 1 : (vh * 0.85 - rect.top) / (rect.height + vh * 0.35);
      setProgress(Math.min(1, Math.max(0, value)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((word, index) => {
        const lit = progress * words.length > index;
        return (
          <span
            key={`${word}-${index}`}
            className="transition-[opacity,color] duration-300"
            style={{ opacity: lit ? 1 : 0.16 }}
          >
            {word}{" "}
          </span>
        );
      })}
    </p>
  );
}

export function EcosystemOrbit() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      <div aria-hidden className="absolute inset-[12%] rounded-full bg-[conic-gradient(from_90deg,#bbf7d0,#fed7aa,#bfdbfe,#ddd6fe,#bbf7d0)] opacity-70 blur-3xl" />
      <div aria-hidden className="absolute inset-[6%] rounded-full border border-dashed border-ink/10" />
      <div aria-hidden className="absolute inset-[24%] rounded-full border border-ink/[0.06]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-[36px] bg-white shadow-[0_30px_60px_-30px_rgba(15,23,42,0.5)] ring-1 ring-ink/5">
          <Image src="/images/brand/mark-dark.png" alt="Genlyn" width={240} height={240} className="h-24 w-24 object-contain" />
          <span aria-hidden className="pulse-ring absolute inset-0 rounded-[36px]" />
        </div>
      </div>
      <div className="orbit absolute inset-[6%]">
        {siteApps.map((app, index) => {
          const angle = (index / siteApps.length) * 360 - 90;
          return (
            <div
              key={app.slug}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `rotate(${angle}deg) translate(calc(var(--orbit-r, 200px))) rotate(${-angle}deg)` } as CSSProperties}
            >
              <div className="orbit-counter -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src={app.iconPath}
                    alt={app.name}
                    width={128}
                    height={128}
                    className="h-16 w-16 rounded-[20px] shadow-[0_20px_40px_-20px_rgba(15,23,42,0.6)] ring-4 ring-white sm:h-[72px] sm:w-[72px]"
                  />
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-ink shadow-sm">{app.name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Icon name="sparkles" className="float absolute right-[8%] top-[10%] h-6 w-6 text-[#7c3aed]" />
    </div>
  );
}
