import Image from "next/image";
import { appLifePhotos } from "@/config/photos";
import type { FeaturedSlug } from "@/config/site";
import { PlayOnView } from "@/components/site/motion";
import { AppIcon } from "@/components/site/ui";
import { getSiteApp } from "@/config/site";

/** Real-life photo preview for an app — never AI, 3D, or UI mockups. */
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
  const photo = appLifePhotos[slug];
  const app = getSiteApp(slug);
  const height = Math.round(width * 1.25);

  return (
    <PlayOnView className={`max-w-full ${className}`}>
      <div
        className="relative max-w-full overflow-hidden rounded-[28px] bg-white shadow-[0_40px_80px_-36px_rgba(15,23,42,0.55)] ring-1 ring-ink/5"
        style={{ width, height, maxWidth: "100%" }}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          width={920}
          height={1150}
          priority={priority}
          className="h-full w-full object-cover"
        />
        {app ? (
          <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/95 px-2.5 py-1.5 shadow-sm ring-1 ring-ink/5">
            <AppIcon src={app.iconPath} name={app.name} size={22} />
            <span className="text-xs font-extrabold text-ink">{app.name}</span>
          </span>
        ) : null}
      </div>
    </PlayOnView>
  );
}
