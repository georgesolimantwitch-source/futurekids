import Image from "next/image";
import { brand } from "@/config/brand";

const SIZES = {
  nav: {
    width: 200,
    height: 80,
    className: "h-9 max-h-9 w-auto max-w-[140px] sm:h-10 sm:max-h-10 sm:max-w-[160px]",
  },
  footer: {
    width: 230,
    height: 92,
    className: "h-10 max-h-10 w-auto max-w-[180px]",
  },
  auth: {
    width: 320,
    height: 128,
    className: "mx-auto h-16 max-h-16 w-auto max-w-[220px] sm:h-20 sm:max-h-20 sm:max-w-[280px]",
  },
  account: {
    width: 210,
    height: 84,
    className: "h-10 max-h-10 w-auto max-w-[160px]",
  },
  hero: {
    width: 360,
    height: 144,
    className: "h-16 max-h-16 w-auto max-w-[240px] sm:h-24 sm:max-h-24 sm:max-w-[320px]",
  },
} as const;

export function BrandLogo({
  size = "nav",
  /**
   * `dark` = dark wordmark for light backgrounds (default).
   * `light` = light wordmark for dark backgrounds.
   */
  variant = "dark",
  className = "",
  priority = false,
}: {
  size?: keyof typeof SIZES;
  variant?: "dark" | "light";
  className?: string;
  priority?: boolean;
}) {
  const dims = SIZES[size];
  const src =
    variant === "light" ? brand.logo.wordmarkLight : brand.logo.wordmarkDark;

  return (
    <Image
      src={src}
      alt={brand.productName}
      width={dims.width}
      height={dims.height}
      priority={priority}
      className={`${dims.className} object-contain ${className}`.trim()}
    />
  );
}
