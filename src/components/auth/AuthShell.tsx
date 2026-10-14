"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { siteApps } from "@/config/site";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Blobs } from "@/components/site/ui";

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
    <div className="relative -mt-[68px] min-h-screen overflow-hidden pt-[68px]">
      <Blobs intensity={0.7} />
      <div className="relative mx-auto grid w-full max-w-6xl items-start gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_minmax(0,28rem)] lg:px-10">
        <div className="hidden lg:block lg:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Genlyn</p>
          <p className="font-display mt-4 text-5xl font-extrabold leading-[1.02] text-ink">
            One account.
            <br />
            <span className="gradient-text">Every app.</span>
          </p>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
            Freshys, Ballr, Scholars Notes, and Earnly — managed from one family login.
          </p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {siteApps.map((app) => (
              <li
                key={app.slug}
                className="flex items-center gap-2.5 rounded-2xl bg-white/80 px-3 py-2 text-sm font-bold text-ink shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 backdrop-blur"
              >
                <Image src={app.iconPath} alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
                {app.name}
              </li>
            ))}
          </ul>
        </div>

        <div className={`mx-auto w-full ${size === "wide" ? "max-w-2xl lg:max-w-none" : "max-w-md lg:max-w-none"}`}>
          <div className="mb-7 text-center">
            <BrandLogo size="auth" priority className="h-12! sm:h-14!" />
            <h1 className="font-display mt-5 text-4xl font-extrabold text-ink">{title}</h1>
            {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{subtitle}</p>}
          </div>

          <div className="rounded-[32px] bg-white p-6 shadow-[0_40px_90px_-44px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 sm:p-8">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>}
        </div>
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
      <label className="block text-xs font-bold text-ink-soft">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const authInputClass =
  "w-full rounded-2xl bg-[#f7f8fc] px-4 py-3.5 text-[15px] text-ink outline-none ring-1 ring-ink/[0.06] transition-all duration-300 placeholder:text-ink-faint focus:bg-white focus:ring-2 focus:ring-brand/40";

export const authButtonClass =
  "shine press flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60";

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-bold text-ink underline decoration-ink/20 underline-offset-4 transition hover:decoration-ink">
      {children}
    </Link>
  );
}
