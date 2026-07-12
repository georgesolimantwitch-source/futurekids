import Image, { type ImageProps } from "next/image";
import { type AppConfig } from "@/config/brand";

export type ScreenshotDevice = "phone" | "tablet";

export const SCREENSHOT_DIMENSIONS = {
  phone: { width: 390, height: 844 },
  tablet: { width: 1376, height: 1032 },
} as const;

export function getScreenshotDevice(
  app: Pick<AppConfig, "screenshotDevice">,
): ScreenshotDevice {
  return app.screenshotDevice ?? "phone";
}

export function getScreenshotFrameClass(device: ScreenshotDevice): string {
  return device === "tablet" ? "aspect-[4/3]" : "aspect-[9/19]";
}

export function getScreenshotContainerClass(device: ScreenshotDevice): string {
  return device === "tablet"
    ? "mx-auto w-full max-w-md lg:max-w-xl"
    : "mx-auto w-full max-w-[280px] sm:max-w-xs";
}

interface AppScreenshotImageProps extends Omit<ImageProps, "width" | "height"> {
  app: Pick<AppConfig, "screenshotDevice">;
  src: string;
  alt: string;
  sizes?: string;
  fill?: boolean;
}

export function AppScreenshotImage({
  app,
  src,
  alt,
  className = "",
  sizes,
  priority,
  fill,
  ...rest
}: AppScreenshotImageProps) {
  const device = getScreenshotDevice(app);
  const { width, height } = SCREENSHOT_DIMENSIONS[device];

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover object-top ${className}`}
        sizes={sizes ?? (device === "tablet" ? "400px" : "280px")}
        priority={priority}
        {...rest}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`h-auto w-full ${className}`}
      sizes={sizes ?? (device === "tablet" ? "(max-width: 768px) 100vw, 480px" : "320px")}
      priority={priority}
      {...rest}
    />
  );
}
