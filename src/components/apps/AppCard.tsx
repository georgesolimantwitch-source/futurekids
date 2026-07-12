import Link from "next/link";
import Image from "next/image";
import { type AppConfig, getAppCtaHref, isAppLive } from "@/config/brand";
import { Button } from "@/components/ui/Button";

function AppStoreIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

interface AppPrimaryActionProps {
  app: AppConfig;
  size?: "sm" | "md" | "lg";
  className?: string;
  showStoreIcon?: boolean;
  inverted?: boolean;
}

export function AppPrimaryAction({
  app,
  size = "lg",
  className = "",
  showStoreIcon = false,
  inverted = false,
}: AppPrimaryActionProps) {
  const variant = inverted ? "inverted" : "primary";
  const href = getAppCtaHref(app);
  const external = isAppLive(app);

  return (
    <Button
      href={href}
      external={external}
      size={size}
      variant={variant}
      accentColor={inverted ? undefined : app.accentColor}
      className={`gap-2 ${className}`}
    >
      {showStoreIcon && isAppLive(app) && <AppStoreIcon />}
      {app.cta.label}
    </Button>
  );
}

/** Optional Android / Play Store link when configured */
export function AppPlayStoreAction({
  app,
  size = "md",
  className = "",
}: {
  app: AppConfig;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!app.playStoreUrl) return null;

  return (
    <Button
      href={app.playStoreUrl}
      external
      variant="secondary"
      size={size}
      className={className}
    >
      Get on Google Play
    </Button>
  );
}

interface AppIconPreviewProps {
  app: AppConfig;
  size?: "sm" | "md" | "lg";
}

export function AppIconPreview({ app, size = "md" }: AppIconPreviewProps) {
  const sizeClasses = {
    sm: "h-12 w-12 rounded-xl",
    md: "h-16 w-16 rounded-2xl",
    lg: "h-20 w-20 rounded-2xl",
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  return (
    <Link
      href={app.learnMorePath}
      className="group flex flex-col items-center gap-3 transition-transform duration-200 hover:-translate-y-1"
    >
      <div
        className={`flex items-center justify-center shadow-sm transition-shadow duration-200 group-hover:shadow-md ${sizeClasses[size]}`}
        style={{ backgroundColor: app.accentColorLight }}
      >
        <Image
          src={app.iconPath}
          alt={`${app.name} icon`}
          width={iconSizes[size]}
          height={iconSizes[size]}
          className={`${size === "sm" ? "h-6 w-6" : size === "md" ? "h-8 w-8" : "h-10 w-10"}`}
        />
      </div>
      <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
        {app.name}
      </span>
    </Link>
  );
}
