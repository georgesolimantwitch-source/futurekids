import Image from "next/image";
import { brand } from "@/config/brand";

const SIZES = {
  nav: { width: 200, height: 80, className: "h-9 w-auto sm:h-10" },
  footer: { width: 230, height: 92, className: "h-10 w-auto" },
  auth: { width: 320, height: 128, className: "mx-auto h-16 w-auto sm:h-20" },
  account: { width: 210, height: 84, className: "h-10 w-auto" },
  hero: { width: 360, height: 144, className: "h-16 w-auto sm:h-24" },
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
