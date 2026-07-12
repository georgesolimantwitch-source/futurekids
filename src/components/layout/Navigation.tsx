"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { apps, brand, navigationLinks } from "@/config/brand";
import { Button } from "@/components/ui/Button";

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const appsMenuId = useId();
  const appsRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!appsOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (appsRef.current && !appsRef.current.contains(event.target as Node)) {
        setAppsOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAppsOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [appsOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = () => {
    setMobileOpen(false);
    setAppsOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-neutral-200/80 bg-white/75 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-white/90 backdrop-blur-md"
      }`}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="min-w-0 truncate text-lg font-semibold tracking-tight text-neutral-900 transition-opacity hover:opacity-70 sm:text-xl"
          onClick={closeMobile}
        >
          {brand.logo.text}
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          <li className="relative" ref={appsRef}>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              aria-expanded={appsOpen}
              aria-haspopup="true"
              aria-controls={appsMenuId}
              onClick={() => setAppsOpen((open) => !open)}
            >
              Apps
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${appsOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {appsOpen && (
              <div
                id={appsMenuId}
                role="menu"
                className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-2 shadow-lg"
              >
                {apps.map((app) => (
                  <Link
                    key={app.slug}
                    href={app.learnMorePath}
                    role="menuitem"
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-neutral-50"
                    onClick={() => setAppsOpen(false)}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: app.accentColorLight }}
                    >
                      <Image
                        src={app.iconPath}
                        alt=""
                        width={22}
                        height={22}
                        className="h-[22px] w-[22px]"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-neutral-900">
                        {app.name}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">
                        {app.tagline}
                      </span>
                    </span>
                  </Link>
                ))}
                <div className="mt-1 border-t border-neutral-100 pt-1">
                  <Link
                    href="/#apps"
                    role="menuitem"
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                    onClick={() => setAppsOpen(false)}
                  >
                    View all apps →
                  </Link>
                </div>
              </div>
            )}
          </li>
          {navigationLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <Button href="/#apps" size="sm">
            Explore Apps
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-neutral-700 hover:bg-neutral-100 lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className="max-h-[calc(100dvh-57px)] overflow-y-auto border-t border-neutral-100 bg-white lg:hidden"
        >
          <div className="space-y-1 px-4 py-4">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Apps
            </p>
            {apps.map((app) => (
              <Link
                key={app.slug}
                href={app.learnMorePath}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-neutral-50"
                onClick={closeMobile}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: app.accentColorLight }}
                >
                  <Image
                    src={app.iconPath}
                    alt=""
                    width={22}
                    height={22}
                    className="h-[22px] w-[22px]"
                    aria-hidden="true"
                  />
                </span>
                <span>
                  <span className="block text-base font-medium text-neutral-900">
                    {app.name}
                  </span>
                  <span className="block text-sm text-neutral-500">{app.tagline}</span>
                </span>
              </Link>
            ))}

            <div className="my-3 border-t border-neutral-100" />

            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-12 items-center rounded-xl px-3 text-base font-medium text-neutral-700 hover:bg-neutral-50"
                onClick={closeMobile}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3" onClick={closeMobile}>
              <Button href="/#apps" size="md" className="w-full">
                Explore Apps
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
