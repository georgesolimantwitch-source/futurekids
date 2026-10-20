import Image from "next/image";
import { apps } from "@/config/brand";
import type { FeaturedSlug } from "@/config/site";

const HERO_SHOT: Record<FeaturedSlug, string> = {
  fresher: "/images/apps/fresher/marketing-discover.png",
  ballr: "/images/apps/ballr/mockup-player-card.png",
  scholars: "/images/apps/scholars/marketing-classes.png",
  earnly: "/images/apps/earnly/mockup-home.png",
};

function RealAppShot({
  slug,
  className = "",
}: {
  slug: FeaturedSlug;
  className?: string;
}) {
  const app = apps.find((item) => item.slug === slug);
  const src = HERO_SHOT[slug] ?? app?.screenshots[0]?.path ?? app?.screenshotPath;
  const alt = app?.screenshots[0]?.alt ?? `${app?.name ?? slug} app preview`;

  if (!src) {
    return <div className={`h-full w-full bg-[#f7f8fc] ${className}`} />;
  }

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#f7f8fc] ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 280px, 360px"
        className="object-cover object-top"
        priority={slug === "earnly" || slug === "fresher"}
      />
    </div>
  );
}

export function FreshysScreen() {
  return <RealAppShot slug="fresher" />;
}

export function BallrScreen() {
  return <RealAppShot slug="ballr" />;
}

export function ScholarsScreen() {
  return <RealAppShot slug="scholars" />;
}

export function EarnlyScreen() {
  return <RealAppShot slug="earnly" />;
}

export function AppScreen({ slug }: { slug: FeaturedSlug }) {
  return <RealAppShot slug={slug} />;
}
