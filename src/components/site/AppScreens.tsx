import Image from "next/image";
import { appLifePhotos } from "@/config/photos";
import type { FeaturedSlug } from "@/config/site";

function RealLifeShot({
  slug,
  className = "",
}: {
  slug: FeaturedSlug;
  className?: string;
}) {
  const photo = appLifePhotos[slug];

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#f7f8fc] ${className}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(max-width: 768px) 280px, 360px"
        className="object-cover"
        priority={slug === "earnly" || slug === "fresher"}
      />
    </div>
  );
}

export function FreshysScreen() {
  return <RealLifeShot slug="fresher" />;
}

export function BallrScreen() {
  return <RealLifeShot slug="ballr" />;
}

export function ScholarsScreen() {
  return <RealLifeShot slug="scholars" />;
}

export function EarnlyScreen() {
  return <RealLifeShot slug="earnly" />;
}

export function AppScreen({ slug }: { slug: FeaturedSlug }) {
  return <RealLifeShot slug={slug} />;
}
