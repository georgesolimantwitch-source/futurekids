import Image from "next/image";
import { apps } from "@/config/brand";
import type { FeaturedSlug } from "@/config/site";
import { PlayOnView } from "@/components/site/motion";

const PREVIEW: Record<FeaturedSlug, { src: string; alt: string }> = {
  fresher: {
    src: "/images/apps/fresher/marketing-discover.png",
    alt: "Freshys discover screen with local farms near you",
  },
  ballr: {
    src: "/images/apps/ballr/mockup-player-card.png",
    alt: "Ballr player card with overall rating, XP, and fitness progress",
  },
  scholars: {
    src: "/images/apps/scholars/marketing-classes.png",
    alt: "Scholars Notes course dashboard",
  },
  earnly: {
    src: "/images/apps/earnly/mockup-home.png",
    alt: "Earnly home screen with family balance and growth chart",
  },
};

/** Real app marketing screenshot — never a CSS fake UI. */
export function AppPreview({
  slug,
  width = 240,
  className = "",
  priority = false,
}: {
  slug: FeaturedSlug;
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  const shot = PREVIEW[slug];
  const app = apps.find((item) => item.slug === slug);
  const src = shot?.src ?? app?.screenshots[0]?.path ?? app?.screenshotPath;
  const alt = shot?.alt ?? app?.screenshots[0]?.alt ?? `${app?.name ?? slug} preview`;
  if (!src) return null;

  // Scholars previews are landscape tablet marketing shots
  const landscape = slug === "scholars";
  const height = landscape ? Math.round(width * 0.75) : Math.round(width * 2.05);

  return (
    <PlayOnView className={`max-w-full ${className}`}>
      <div
        className="max-w-full overflow-hidden rounded-[28px] bg-white shadow-[0_40px_80px_-36px_rgba(15,23,42,0.55)] ring-1 ring-ink/5"
        style={{ width, height, maxWidth: "100%" }}
      >
        <Image
          src={src}
          alt={alt}
          width={landscape ? 1024 : 460}
          height={landscape ? 768 : 996}
          priority={priority}
          className="h-full w-full object-cover object-top"
        />
      </div>
    </PlayOnView>
  );
}
