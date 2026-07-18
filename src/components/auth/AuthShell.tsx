"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Wider layout for multi-column content like account type selection. */
  size?: "default" | "wide";
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  size = "default",
}: AuthShellProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] px-4 py-12 sm:py-16">
      <div className={`mx-auto w-full ${size === "wide" ? "max-w-2xl" : "max-w-md"}`}>
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Future Kids
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">{title}</h1>
          {subtitle && (
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-neutral-600">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthField({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-800">{label}</label>
      <div className="mt-2">{children}</div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const authInputClass =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200";

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-neutral-900 underline underline-offset-4">
      {children}
    </Link>
  );
}
