import type { CSSProperties } from "react";
import type { FeaturedSlug } from "@/config/site";
import { Icon, type IconName } from "./Icon";
import { CountUp } from "./motion";

function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-6 pt-3 text-[10px] font-semibold ${
        dark ? "text-white" : "text-ink"
      }`}
    >
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <span className="flex items-end gap-[1.5px]">
          {[4, 6, 8, 10].map((h) => (
            <span key={h} className="w-[2.5px] rounded-sm bg-current" style={{ height: h }} />
          ))}
        </span>
        <span className="ml-1 h-[9px] w-[18px] rounded-[3px] border border-current p-[1px]">
          <span className="block h-full w-3/4 rounded-[1.5px] bg-current" />
        </span>
      </span>
    </div>
  );
}

function rise(delay: number): CSSProperties {
  return { "--rise-delay": `${delay}s` } as CSSProperties;
}

export function FreshysScreen() {
  const categories: { icon: IconName; label: string; tint: string }[] = [
    { icon: "apple", label: "Fruits", tint: "#fee2e2" },
    { icon: "carrot", label: "Veggies", tint: "#ffedd5" },
    { icon: "milk", label: "Dairy", tint: "#e0f2fe" },
    { icon: "basket", label: "Markets", tint: "#dcfce7" },
  ];
  return (
    <div className="flex h-full flex-col bg-[#f7faf7]">
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-[#15803d]">
          <Icon name="leaf" className="h-4 w-4" strokeWidth={2.6} />
          Freshys
        </span>
        <span className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 ring-2 ring-white" />
      </div>
      <div className="rise mx-5 mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[10px] text-ink-faint shadow-sm" style={rise(0.2)}>
        <Icon name="search" className="h-3 w-3" />
        Search farms, markets, produce…
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 px-5">
        {categories.map((c, i) => (
          <div key={c.label} className="rise flex flex-col items-center gap-1" style={rise(0.3 + i * 0.08)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-ink" style={{ background: c.tint }}>
              <Icon name={c.icon} className="h-4 w-4" />
            </span>
            <span className="text-[9px] font-semibold text-ink-soft">{c.label}</span>
          </div>
        ))}
      </div>
      <p className="px-5 pt-5 text-[12px] font-extrabold text-ink">Local farms near you</p>
      <div className="rise mx-5 mt-2 overflow-hidden rounded-2xl bg-white shadow-sm" style={rise(0.55)}>
        <div className="relative h-24 bg-[radial-gradient(circle_at_20%_30%,#bbf7d0,transparent_45%),radial-gradient(circle_at_80%_70%,#fde68a,transparent_45%),linear-gradient(135deg,#4ade80,#16a34a)]">
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[8px] font-bold text-[#15803d]">
            Open now
          </span>
          <span className="float absolute bottom-3 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#dc2626] shadow-md" style={{ "--float-distance": "-5px" } as CSSProperties}>
            <Icon name="apple" className="h-4 w-4" />
          </span>
          <span className="float absolute bottom-6 right-16 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#ea580c] shadow-md" style={{ "--float-delay": "-2s", "--float-distance": "-4px" } as CSSProperties}>
            <Icon name="carrot" className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="flex items-center justify-between p-3">
          <div>
            <p className="text-[11px] font-bold text-ink">Johnson Family Farm</p>
            <p className="text-[9px] text-ink-soft">2.1 mi · Fresh today</p>
          </div>
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
            <Icon name="star" className="h-3 w-3 fill-current" strokeWidth={0} />
            4.9
          </span>
        </div>
      </div>
      <div className="mx-5 mt-2 space-y-2">
        {[
          { name: "Green Valley Market", meta: "0.8 mi · Sat & Sun" },
          { name: "Sunrise Orchard", meta: "3.4 mi · Apples, cider" },
        ].map((row, i) => (
          <div key={row.name} className="rise flex items-center gap-2.5 rounded-xl bg-white p-2.5 shadow-sm" style={rise(0.7 + i * 0.1)}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#dcfce7] text-[#15803d]">
              <Icon name="map-pin" className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1">
              <span className="block text-[10px] font-bold text-ink">{row.name}</span>
              <span className="block text-[8.5px] text-ink-soft">{row.meta}</span>
            </span>
            <Icon name="heart" className="h-3.5 w-3.5 text-ink-faint" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BallrScreen() {
  const bars = [38, 52, 46, 64, 58, 76, 88];
  return (
    <div className="flex h-full flex-col bg-[#0b0b0f] text-white">
      <StatusBar dark />
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[15px] font-black italic tracking-tight">
          BALLR<span className="text-[#f4511e]">.</span>
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
          <Icon name="flame" className="h-3.5 w-3.5 text-[#fb923c]" />
        </span>
      </div>
      <div className="px-5 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Vertical jump</p>
        <p className="mt-1 flex items-baseline gap-1">
          <CountUp value={28.5} decimals={1} className="text-[40px] font-black leading-none" />
          <span className="text-[12px] font-bold text-white/60">in</span>
          <span className="ml-2 rounded-full bg-[#22c55e]/20 px-2 py-0.5 text-[9px] font-bold text-[#4ade80]">+2.4</span>
        </p>
      </div>
      <div className="relative mx-5 mt-3 h-28 rounded-2xl bg-white/[0.04] p-3">
        <svg viewBox="0 0 200 80" className="h-full w-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ballr-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f4511e" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f4511e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 64 C 25 60, 35 48, 55 50 S 90 34, 110 38 S 150 18, 170 20 S 195 10, 200 8 L 200 80 L 0 80 Z" fill="url(#ballr-fill)" className="rise" style={rise(1)} />
          <path
            d="M0 64 C 25 60, 35 48, 55 50 S 90 34, 110 38 S 150 18, 170 20 S 195 10, 200 8"
            fill="none"
            stroke="#fb923c"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="draw"
            style={{ "--dash": 260 } as CSSProperties}
          />
          <circle cx="200" cy="8" r="4" fill="#fb923c" className="rise" style={rise(2)} />
        </svg>
      </div>
      <div className="mx-5 mt-3 flex h-16 items-end gap-1.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className="bar-grow flex-1 rounded-md"
            style={
              {
                height: `${h}%`,
                background: i === bars.length - 1 ? "#f4511e" : "rgba(255,255,255,0.14)",
                "--bar-delay": `${0.4 + i * 0.08}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="mx-5 mt-4 grid grid-cols-3 gap-2">
        {(
          [
            { icon: "dumbbell", label: "Train" },
            { icon: "trophy", label: "Compete" },
            { icon: "trending-up", label: "Progress" },
          ] as { icon: IconName; label: string }[]
        ).map((item, i) => (
          <div key={item.label} className="rise flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.06] py-3" style={rise(0.9 + i * 0.1)}>
            <Icon name={item.icon} className="h-4 w-4 text-[#fb923c]" />
            <span className="text-[9px] font-semibold text-white/70">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScholarsScreen() {
  const circumference = 2 * Math.PI * 26;
  return (
    <div className="flex h-full flex-col bg-[#f6f8ff]">
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-[#1d4ed8]">
          <Icon name="graduation-cap" className="h-4 w-4" strokeWidth={2.4} />
          Scholars
        </span>
        <span className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-200 to-indigo-300 ring-2 ring-white" />
      </div>
      <div className="rise mx-5 mt-4 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm" style={rise(0.2)}>
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r="26" fill="none" stroke="#e0e7ff" strokeWidth="7" />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="#2563eb"
            strokeWidth="7"
            strokeLinecap="round"
            className="draw"
            style={
              {
                "--dash": circumference,
                strokeDasharray: `${circumference * 0.85} ${circumference}`,
              } as CSSProperties
            }
          />
        </svg>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-ink-faint">Practice test</p>
          <p className="text-[22px] font-black leading-tight text-ink">
            <CountUp value={85} suffix="%" />
          </p>
          <p className="text-[9px] text-ink-soft">Biology · Unit 4</p>
        </div>
      </div>
      <p className="px-5 pt-4 text-[12px] font-extrabold text-ink">Study guides</p>
      <div className="mt-2 space-y-2 px-5">
        {[
          { title: "Cell Structure", meta: "12 key ideas", color: "#2563eb", progress: 0.9 },
          { title: "Photosynthesis", meta: "8 key ideas", color: "#7c3aed", progress: 0.6 },
          { title: "Genetics 101", meta: "15 key ideas", color: "#0ea5e9", progress: 0.35 },
        ].map((row, i) => (
          <div key={row.title} className="rise rounded-xl bg-white p-3 shadow-sm" style={rise(0.4 + i * 0.1)}>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-ink">{row.title}</span>
              <span className="text-[8.5px] text-ink-faint">{row.meta}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef2ff]">
              <span
                className="bar-grow-x block h-full rounded-full"
                style={
                  {
                    width: `${row.progress * 100}%`,
                    background: row.color,
                    "--bar-delay": `${0.6 + i * 0.12}s`,
                  } as CSSProperties
                }
              />
            </div>
          </div>
        ))}
      </div>
      <div className="rise mx-5 mt-3 flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#4f46e5] p-3 text-white" style={rise(0.8)}>
        <Icon name="sparkles" className="h-4 w-4" />
        <span className="text-[10px] font-semibold">Ask the AI tutor anything</span>
      </div>
    </div>
  );
}

export function EarnlyScreen() {
  const actions: { icon: IconName; label: string }[] = [
    { icon: "wallet", label: "Earn" },
    { icon: "piggy-bank", label: "Save" },
    { icon: "send", label: "Spend" },
    { icon: "target", label: "Goals" },
  ];
  return (
    <div className="flex h-full flex-col bg-[#f8f6ff]">
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[15px] font-extrabold text-[#6d28d9]">Earnly</span>
        <span className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-200 to-violet-300 ring-2 ring-white" />
      </div>
      <p className="px-5 pt-3 text-[12px] font-bold text-ink">Good morning, Alex</p>
      <div className="rise relative mx-5 mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] p-4 text-white shadow-lg" style={rise(0.15)}>
        <span className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15" />
        <span className="absolute -bottom-10 right-10 h-20 w-20 rounded-full bg-white/10" />
        <p className="text-[9px] font-semibold uppercase tracking-widest text-white/70">Total balance</p>
        <p className="mt-1 text-[30px] font-black leading-none">
          <CountUp value={124.5} decimals={2} prefix="$" />
        </p>
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold">
          <Icon name="trending-up" className="h-3 w-3" />
          +$25.00 this week
        </p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 px-5">
        {actions.map((a, i) => (
          <div key={a.label} className="rise flex flex-col items-center gap-1" style={rise(0.35 + i * 0.07)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#7c3aed] shadow-sm">
              <Icon name={a.icon} className="h-4 w-4" />
            </span>
            <span className="text-[9px] font-semibold text-ink-soft">{a.label}</span>
          </div>
        ))}
      </div>
      <p className="px-5 pt-4 text-[12px] font-extrabold text-ink">This week</p>
      <div className="mt-2 space-y-1.5 px-5">
        {[
          { label: "Completed 3 chores", amount: "+$15.00", positive: true },
          { label: "Saved for new bike", amount: "+$10.00", positive: true },
          { label: "Movie with friends", amount: "−$5.00", positive: false },
        ].map((row, i) => (
          <div key={row.label} className="rise flex items-center justify-between rounded-xl bg-white px-3 py-2.5 shadow-sm" style={rise(0.6 + i * 0.1)}>
            <span className="text-[10px] font-semibold text-ink">{row.label}</span>
            <span className={`text-[10px] font-bold ${row.positive ? "text-[#16a34a]" : "text-ink-soft"}`}>
              {row.amount}
            </span>
          </div>
        ))}
      </div>
      <div className="rise mx-5 mt-3 rounded-xl bg-white p-3 shadow-sm" style={rise(0.95)}>
        <div className="flex justify-between text-[9.5px] font-bold">
          <span className="text-ink">New bike goal</span>
          <span className="text-[#7c3aed]">68%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ede9fe]">
          <span
            className="bar-grow-x block h-full w-[68%] rounded-full bg-gradient-to-r from-[#a78bfa] to-[#7c3aed]"
            style={{ "--bar-delay": "1.1s" } as CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}

export function AppScreen({ slug }: { slug: FeaturedSlug }) {
  switch (slug) {
    case "fresher":
      return <FreshysScreen />;
    case "ballr":
      return <BallrScreen />;
    case "scholars":
      return <ScholarsScreen />;
    case "earnly":
      return <EarnlyScreen />;
  }
}
