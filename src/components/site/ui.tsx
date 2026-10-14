import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { PlayOnView, Reveal } from "./motion";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  color = "#7c3aed",
  icon,
  className = "",
}: {
  children: ReactNode;
  color?: string;
  icon?: IconName;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border bg-white/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] shadow-[0_6px_20px_-12px_rgba(15,23,42,0.35)] backdrop-blur ${className}`}
      style={{ color, borderColor: `${color}26` }}
    >
      {icon ? (
        <Icon name={icon} className="h-3.5 w-3.5" strokeWidth={2.4} />
      ) : (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="pulse-ring absolute inline-flex h-full w-full rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        </span>
      )}
      {children}
    </span>
  );
}

/** Soft drifting color fields behind a section. */
export function Blobs({
  colors,
  className = "",
  intensity = 0.55,
}: {
  colors: string[];
  className?: string;
  intensity?: number;
}) {
  const layout: CSSProperties[] = [
    { top: "-12%", right: "-6%", width: "46vw", height: "46vw", maxWidth: 680, maxHeight: 680 },
    { bottom: "-20%", right: "18%", width: "34vw", height: "34vw", maxWidth: 520, maxHeight: 520 },
    { top: "12%", left: "-10%", width: "30vw", height: "30vw", maxWidth: 440, maxHeight: 440 },
    { bottom: "-10%", left: "30%", width: "24vw", height: "24vw", maxWidth: 360, maxHeight: 360 },
  ];
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {colors.slice(0, layout.length).map((color, index) => (
        <span
          key={`${color}-${index}`}
          className="blob"
          style={
            {
              ...layout[index],
              background: color,
              opacity: intensity,
              "--blob-speed": `${16 + index * 5}s`,
              "--blob-delay": `${index * -4}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

type PillVariant = "primary" | "dark" | "light" | "soft";

export function PillLink({
  href,
  children,
  variant = "primary",
  color,
  arrow = true,
  size = "md",
  className = "",
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: PillVariant;
  /** Overrides the fill for `primary` (app-colored buttons). */
  color?: string;
  arrow?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  external?: boolean;
}) {
  const sizes = {
    sm: "h-9 px-4 text-[13px]",
    md: "h-12 px-6 text-sm",
    lg: "h-14 px-7 text-[15px]",
  };
  const variants: Record<PillVariant, string> = {
    primary:
      "text-white shadow-[0_14px_30px_-12px_var(--pill-glow)] hover:shadow-[0_20px_40px_-14px_var(--pill-glow)]",
    dark: "bg-ink text-white shadow-[0_14px_30px_-14px_rgba(11,16,32,0.6)] hover:bg-black",
    light:
      "bg-white text-ink ring-1 ring-ink/10 shadow-[0_10px_24px_-16px_rgba(15,23,42,0.35)] hover:ring-ink/20",
    soft: "bg-ink/[0.04] text-ink hover:bg-ink/[0.07]",
  };
  const fill = color ?? "#2563eb";
  const style =
    variant === "primary"
      ? ({ background: fill, "--pill-glow": `${fill}99` } as CSSProperties)
      : undefined;

  const classes = `shine press group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[box-shadow,background-color,transform] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand ${sizes[size]} ${variants[variant]} ${className}`;

  const content = (
    <>
      {children}
      {arrow && (
        <Icon
          name="arrow-right"
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          strokeWidth={2.4}
        />
      )}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} style={style}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} style={style}>
      {content}
    </Link>
  );
}

/** "Watch video"-style secondary action that scrolls to an in-page section. */
export function PlayLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-12 items-center gap-3 rounded-full pl-1.5 pr-5 text-sm font-semibold text-ink transition hover:bg-white/70"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
        <span className="pulse-ring absolute inset-0 rounded-full bg-ink/40" />
        <Icon name="play" className="relative h-3.5 w-3.5 translate-x-[1px] fill-current" strokeWidth={0} />
      </span>
      {children}
    </Link>
  );
}

export function AppIcon({
  src,
  name,
  size = 40,
  className = "",
}: {
  src: string;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={`${name} icon`}
      width={size}
      height={size}
      className={`shrink-0 rounded-[28%] shadow-[0_8px_18px_-10px_rgba(15,23,42,0.5)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function SectionHeading({
  eyebrow,
  eyebrowColor,
  title,
  lead,
  align = "center",
  className = "",
}: {
  eyebrow?: string;
  eyebrowColor?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={`${centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"} ${className}`}>
      {eyebrow && (
        <Reveal>
          <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <Reveal delay={80}>
        <h2 className="font-display mt-5 text-4xl font-extrabold leading-[1.04] text-ink sm:text-5xl">
          {title}
        </h2>
      </Reveal>
      {lead && (
        <Reveal delay={160}>
          <p className={`mt-5 text-base leading-relaxed text-ink-soft sm:text-lg ${centered ? "mx-auto max-w-2xl" : ""}`}>
            {lead}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/** The white tile strip that sits under each hero in the mockups. */
export function FeatureStrip({
  items,
  color,
  colorSoft,
}: {
  items: { icon: IconName; label: string; description?: string }[];
  color: string;
  colorSoft: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-[28px] bg-white/80 p-3 shadow-[0_30px_60px_-36px_rgba(15,23,42,0.35)] ring-1 ring-ink/5 backdrop-blur-xl sm:gap-4 sm:p-4 lg:grid-cols-4">
      {items.map((item, index) => (
        <Reveal key={item.label} delay={index * 90} dir="up">
          <div className="lift group flex h-full items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/5 sm:flex-col sm:items-center sm:gap-3 sm:p-5 sm:text-center">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
              style={{ background: colorSoft, color }}
            >
              <Icon name={item.icon} className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-ink">{item.label}</span>
              {item.description && (
                <span className="mt-0.5 hidden text-xs leading-relaxed text-ink-soft sm:block">
                  {item.description}
                </span>
              )}
            </span>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function PhoneFrame({
  children,
  className = "",
  width = 280,
}: {
  children: ReactNode;
  className?: string;
  width?: number;
}) {
  const designWidth = 262;
  const designHeight = Math.round((designWidth * 19.2) / 9);
  const screenWidth = width - 18;
  const scale = screenWidth / designWidth;
  return (
    <PlayOnView className={`phone ${className}`}>
      <div className="phone-screen" style={{ width: screenWidth, height: designHeight * scale }}>
        <span className="phone-island" style={{ transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center" }} />
        <div
          style={{
            width: designWidth,
            height: designHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </PlayOnView>
  );
}

/** Floating glass chip used around hero imagery. */
export function FloatChip({
  children,
  className = "",
  delay = 0,
  speed = 6,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  speed?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`float absolute z-20 rounded-2xl bg-white/90 px-3.5 py-2.5 text-ink shadow-[0_20px_40px_-20px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 backdrop-blur-xl ${className}`}
      style={{ ...style, "--float-delay": `${delay}s`, "--float-speed": `${speed}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function CheckItem({ children, color }: { children: ReactNode; color: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-ink-soft">
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${color}1a`, color }}
      >
        <Icon name="check" className="h-3 w-3" strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}
