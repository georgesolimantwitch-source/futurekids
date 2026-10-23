import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * Freshys-category style: light gray squircle + 3D emoji graphic.
 */
export function EmojiTile({
  src,
  alt = "",
  size = 64,
  className = "",
  style,
  float = false,
  delay = 0,
  speed = 6,
}: {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  float?: boolean;
  delay?: number;
  speed?: number;
}) {
  const emoji = Math.round(size * 0.72);
  return (
    <span
      aria-hidden={!alt}
      className={`${float ? "float " : ""}relative inline-flex shrink-0 items-center justify-center rounded-[22%] bg-[#f2f2f7] shadow-[0_18px_36px_-18px_rgba(15,23,42,0.45)] ring-1 ring-black/[0.06] ${className}`}
      style={
        {
          width: size,
          height: size,
          ...style,
          ...(float
            ? { "--float-delay": `${delay}s`, "--float-speed": `${speed}s` }
            : null),
        } as CSSProperties
      }
    >
      <Image
        src={src}
        alt={alt}
        width={emoji}
        height={emoji}
        className="h-[72%] w-[72%] object-contain drop-shadow-sm"
        unoptimized
      />
    </span>
  );
}
