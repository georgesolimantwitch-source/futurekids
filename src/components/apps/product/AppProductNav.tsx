"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { apps, productPageSections, type AppConfig } from "@/config/brand";
import { AppPrimaryAction } from "@/components/apps/AppCard";

interface AppProductNavProps {
  app: AppConfig;
}

export function AppProductNav({ app }: AppProductNavProps) {
  const pathname = usePathname();
  const baseSections = app.safety
    ? [...productPageSections.slice(0, 3), { id: "safety", label: "Safety" }, ...productPageSections.slice(3)]
    : [...productPageSections];
  // Marketing galleries lead the page, so they lead the section links too.
  const sections =
    app.screenshotGalleryStyle === "marketing"
      ? [{ id: "screenshots", label: "Screenshots" }, ...baseSections]
      : baseSections;

  return (
    <div
      className="sticky top-[65px] z-40 border-b border-neutral-100 bg-white/90 backdrop-blur-lg"
      style={{ borderBottomColor: `${app.accentColor}15` }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* App switcher */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
          <Link
            href="/#apps"
            className="mr-2 shrink-0 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            ← All Apps
          </Link>
          {apps.map((a) => {
            const isActive = pathname === a.learnMorePath;
            return (
              <Link
                key={a.slug}
                href={a.learnMorePath}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: a.accentColorLight,
                        color: a.accentColor,
                      }
                    : undefined
                }
                aria-current={isActive ? "page" : undefined}
              >
                <Image
                  src={a.iconPath}
                  alt=""
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px]"
                  aria-hidden="true"
                />
                {a.name}
              </Link>
            );
          })}
        </div>

        {/* Section links */}
        <div className="flex items-center justify-between gap-4 border-t border-neutral-50 py-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 sm:text-sm"
              >
                {section.label}
              </a>
            ))}
          </div>
          <div className="hidden shrink-0 sm:block">
            <AppPrimaryAction app={app} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
