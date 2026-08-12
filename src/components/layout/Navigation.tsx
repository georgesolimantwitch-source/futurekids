"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brand, navigationLinks } from "@/config/brand";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthNav } from "@/components/auth/AuthNav";
import { Button } from "@/components/ui/Button";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-neutral-200/80 bg-white/75 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-white/90 backdrop-blur-md"
      }`}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto px-4 py-3 sm:gap-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="mr-1 shrink-0 transition-opacity hover:opacity-80 sm:mr-2"
            aria-label={brand.productName}
          >
            <BrandLogo size="nav" priority />
          </Link>

          <ul className="flex items-center gap-0.5 sm:gap-1">
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 sm:px-3 sm:text-sm"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <AuthNav />
          <Button href="/#apps" size="sm">
            Explore Apps
          </Button>
        </div>
      </nav>
    </header>
  );
}
