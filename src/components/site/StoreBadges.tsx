import Image from "next/image";
import type { AppConfig } from "@/config/brand";

type StoreBadgesProps = {
  app: Pick<AppConfig, "name" | "appStoreUrl" | "playStoreUrl">;
  className?: string;
  /** `sm` fits product cards; `lg` for app page heroes */
  size?: "sm" | "lg";
  /** Stack badges vertically (useful in narrow cards) */
  stack?: boolean;
};

const sizes = {
  sm: {
    appStore: { width: 120, height: 40, className: "h-9 w-auto" },
    play: { width: 130, height: 50, className: "h-[46px] w-auto -ml-0.5" },
  },
  lg: {
    appStore: { width: 150, height: 50, className: "h-10 w-auto sm:h-12" },
    play: { width: 162, height: 63, className: "h-[58px] w-auto sm:h-[70px] -ml-1" },
  },
} as const;

export function StoreBadges({
  app,
  className = "",
  size = "lg",
  stack = false,
}: StoreBadgesProps) {
  const appStoreUrl = app.appStoreUrl?.trim();
  const playStoreUrl = app.playStoreUrl?.trim();
  if (!appStoreUrl && !playStoreUrl) return null;

  const dims = sizes[size];

  return (
    <div
      className={`flex items-center ${stack ? "flex-col gap-1" : "flex-wrap gap-2.5 sm:gap-3"} ${className}`}
    >
      {appStoreUrl ? (
        <a
          href={appStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          aria-label={`Download ${app.name} on the App Store`}
        >
          <Image
            src="/images/badges/app-store-badge.svg"
            alt="Download on the App Store"
            width={dims.appStore.width}
            height={dims.appStore.height}
            className={dims.appStore.className}
            unoptimized
          />
        </a>
      ) : null}
      {playStoreUrl ? (
        <a
          href={playStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          aria-label={`Get ${app.name} on Google Play`}
        >
          <Image
            src="/images/badges/google-play-badge.png"
            alt="Get it on Google Play"
            width={dims.play.width}
            height={dims.play.height}
            className={dims.play.className}
            unoptimized
          />
        </a>
      ) : null}
    </div>
  );
}

export function hasStoreLinks(app: Pick<AppConfig, "appStoreUrl" | "playStoreUrl">): boolean {
  return Boolean(app.appStoreUrl?.trim() || app.playStoreUrl?.trim());
}
