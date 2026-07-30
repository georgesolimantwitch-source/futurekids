import Image from "next/image";
import Link from "next/link";
import { accentForegroundColor, getAppBySlug } from "@/config/brand";

type TileAction = {
  label: string;
  href: string;
  external?: boolean;
};

type TileProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
  background: string;
  primary: TileAction;
  secondary?: TileAction;
  visual: React.ReactNode;
  compact?: boolean;
};

function ActionLink({
  action,
  variant,
  accent,
}: {
  action: TileAction;
  variant: "filled" | "outline";
  accent: string;
}) {
  const foreground = accentForegroundColor(accent);
  const base =
    "inline-flex items-center justify-center rounded-full px-[19px] py-[7px] text-[17px] leading-tight font-normal transition-all";
  const style =
    variant === "filled"
      ? { backgroundColor: accent, color: foreground }
      : { borderColor: accent, color: accent };
  const classes =
    variant === "filled"
      ? `${base} hover:opacity-90`
      : `${base} border hover:opacity-80`;

  if (action.external) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noreferrer"
        className={classes}
        style={style}
      >
        {action.label}
      </a>
    );
  }
  return (
    <Link href={action.href} className={classes} style={style}>
      {action.label}
    </Link>
  );
}

function HomeTile({
  eyebrow,
  title,
  subtitle,
  accent,
  background,
  primary,
  secondary,
  visual,
  compact = false,
}: TileProps) {
  return (
    <section
      className="relative flex flex-col items-center overflow-hidden text-center text-[#1d1d1f]"
      style={{ background }}
    >
      <div className="relative z-10 flex shrink-0 flex-col items-center px-4 pt-12 sm:pt-14">
        <p
          className="text-lg font-semibold sm:text-xl"
          style={{ color: accent }}
        >
          {eyebrow}
        </p>
        <h2 className="font-display mt-1 max-w-xl text-[2.2rem] font-semibold leading-[1.08] tracking-tight sm:text-[3rem]">
          {title}
        </h2>
        <p className="mt-2 max-w-md text-lg text-[#43434a] sm:max-w-xl sm:text-[21px]">
          {subtitle}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <ActionLink action={primary} variant="filled" accent={accent} />
          {secondary && (
            <ActionLink action={secondary} variant="outline" accent={accent} />
          )}
        </div>
      </div>

      {/* Peek phones from the bottom — fixed window so CTAs stay fully visible */}
      <div
        className={`relative mt-8 w-full overflow-hidden ${
          compact ? "h-[300px] sm:h-[340px]" : "h-[360px] sm:h-[420px]"
        }`}
      >
        <div className="absolute inset-x-0 top-0 flex justify-center">{visual}</div>
      </div>
    </section>
  );
}

function PhoneMock({
  src,
  alt,
  rotate = 0,
  width = 250,
  delay = 0,
  contain = false,
  className = "",
}: {
  src: string;
  alt: string;
  rotate?: number;
  width?: number;
  delay?: number;
  contain?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`device-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="phone-frame device"
        style={{ width, ["--r" as string]: `${rotate}deg` }}
      >
        <span className="phone-notch" aria-hidden />
        <div className="phone-screen" style={{ aspectRatio: "9 / 19.3" }}>
          <Image
            src={src}
            alt={alt}
            fill
            sizes={`${width}px`}
            className={contain ? "object-contain p-2" : "object-cover"}
          />
        </div>
      </div>
    </div>
  );
}

function TabletMock({
  src,
  alt,
  rotate = 0,
  width = 320,
  delay = 0,
  className = "",
}: {
  src: string;
  alt: string;
  rotate?: number;
  width?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`device-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="tablet-frame device"
        style={{ width, ["--r" as string]: `${rotate}deg` }}
      >
        <span className="tablet-camera" aria-hidden />
        <div className="tablet-screen" style={{ aspectRatio: "4 / 3" }}>
          <Image
            src={src}
            alt={alt}
            fill
            sizes={`${width}px`}
            className="object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
}

function tileBackground(light: string) {
  return `linear-gradient(180deg, ${light} 0%, #f5f5f7 100%)`;
}

export function HomeTiles() {
  const earnly = getAppBySlug("earnly")!;
  const scholars = getAppBySlug("scholars")!;
  const ballr = getAppBySlug("ballr")!;
  const tinypal = getAppBySlug("tinypal")!;
  const fresher = getAppBySlug("fresher")!;

  return (
    <>
      <HomeTile
        eyebrow="Earnly"
        title="Earn. Save. Grow."
        subtitle={earnly.tagline}
        accent={earnly.accentColor}
        background={tileBackground(earnly.accentColorLight)}
        primary={{ label: "Learn more", href: earnly.learnMorePath }}
        secondary={{ label: "Download", href: earnly.appStoreUrl, external: true }}
        visual={
          <div className="relative flex origin-top scale-[0.78] items-start justify-center gap-0 pt-2 min-[420px]:scale-90 sm:scale-100">
            <PhoneMock
              src="/images/apps/earnly/screenshot-2.png"
              alt="Earnly app"
              rotate={-9}
              width={200}
              delay={0.6}
              className="translate-x-6 sm:translate-x-10"
            />
            <PhoneMock
              src="/images/apps/earnly/screenshot.png"
              alt="Earnly app home screen"
              rotate={5}
              width={240}
              className="-ml-16 sm:-ml-20"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <HomeTile
          compact
          eyebrow="Scholars Notes"
          title="Study smarter."
          subtitle={scholars.tagline}
          accent={scholars.accentColor}
          background={tileBackground(scholars.accentColorLight)}
          primary={{ label: "Learn more", href: scholars.learnMorePath }}
          secondary={{
            label: "Download",
            href: scholars.appStoreUrl,
            external: true,
          }}
          visual={
            <div className="pt-2">
              <TabletMock
                src="/images/apps/scholars/screenshot.png"
                alt="Scholars Notes on iPad"
                rotate={3}
                width={300}
              />
            </div>
          }
        />
        <HomeTile
          compact
          eyebrow="Ballr"
          title="Find local runs."
          subtitle="Discover pickup games near you and build your personal player card."
          accent={ballr.accentColor}
          background={tileBackground(ballr.accentColorLight)}
          primary={{ label: "Learn more", href: ballr.learnMorePath }}
          secondary={{ label: "Download", href: ballr.appStoreUrl, external: true }}
          visual={
            <div className="pt-2">
              <PhoneMock
                src="/images/apps/ballr/screenshot.png"
                alt="Ballr app"
                rotate={-5}
                width={200}
              />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <HomeTile
          compact
          eyebrow="TinyPal"
          title="Stay connected, safely."
          subtitle={tinypal.tagline}
          accent={tinypal.accentColor}
          background={tileBackground(tinypal.accentColorLight)}
          primary={{ label: "Learn more", href: tinypal.learnMorePath }}
          secondary={{ label: "Join waitlist", href: tinypal.learnMorePath }}
          visual={
            <div className="relative flex items-start justify-center pt-2">
              <PhoneMock
                src="/images/apps/tinypal/screenshot.svg"
                alt="TinyPal app"
                rotate={-4}
                width={190}
                contain
              />
            </div>
          }
        />
        <HomeTile
          compact
          eyebrow="Freshys"
          title="Find real food."
          subtitle={fresher.tagline}
          accent={fresher.accentColor}
          background={tileBackground(fresher.accentColorLight)}
          primary={{ label: "Learn more", href: fresher.learnMorePath }}
          secondary={{ label: "Get Freshys", href: "/pricing?app=fresher" }}
          visual={
            <div className="pt-2">
              <PhoneMock
                src="/images/apps/fresher/screenshot.png"
                alt="Freshys local food map"
                rotate={5}
                width={200}
                contain
              />
            </div>
          }
        />
      </div>
    </>
  );
}
