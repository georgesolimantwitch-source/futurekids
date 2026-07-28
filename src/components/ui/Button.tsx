import Link from "next/link";
import { type ReactNode } from "react";
import { accentForegroundColor } from "@/config/brand";

type ButtonVariant = "primary" | "secondary" | "ghost" | "app-store" | "inverted";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  accentColor?: string;
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string;
  onClick?: never;
  type?: never;
  external?: boolean;
}

interface ButtonAsButton extends ButtonBaseProps {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  external?: never;
}

type ButtonProps = ButtonAsLink | ButtonAsButton;

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-base",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm hover:shadow-md",
  secondary:
    "bg-white text-neutral-900 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 shadow-sm",
  ghost: "bg-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100",
  "app-store":
    "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm hover:shadow-md",
  inverted:
    "bg-white text-neutral-900 hover:bg-neutral-100 shadow-sm hover:shadow-md",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  accentColor,
  ...props
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2",
    sizeClasses[size],
    variantClasses[variant],
    className,
  ].join(" ");

  const style =
    variant === "primary" && accentColor
      ? {
          backgroundColor: accentColor,
          color: accentForegroundColor(accentColor),
        }
      : undefined;

  if ("href" in props && props.href) {
    const { href, external } = props;
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          style={style}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} style={style}>
        {children}
      </Link>
    );
  }

  const { onClick, type = "button" } = props as ButtonAsButton;
  return (
    <button type={type} onClick={onClick} className={classes} style={style}>
      {children}
    </button>
  );
}
