"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { brand } from "@/config/brand";
import { mainNav, siteApps } from "@/config/site";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthNav, AuthNavMobile } from "@/components/auth/AuthNav";
import { Icon } from "@/components/site/Icon";
import { AppIcon } from "@/components/site/ui";

export function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastY = useRef(0);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setHidden(y > 240 && y > lastY.current + 4);
      if (y < lastY.current - 4) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function openProducts() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setProductsOpen(true);
  }

  function scheduleClose() {
    closeTimer.current = window.setTimeout(() => setProductsOpen(false), 140);
  }

  const productsActive = pathname === "/products" || pathname.startsWith("/apps/");
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`sticky top-0 z-50 transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        hidden && !productsOpen && !mobileOpen ? "-translate-y-full" : "translate-y-0"
      } ${
        scrolled || mobileOpen
          ? "bg-white/75 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.5)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="shrink-0 transition-transform duration-300 hover:scale-[1.03]"
          aria-label={brand.productName}
        >
          <BrandLogo size="nav" priority />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          <li className="relative" onMouseEnter={openProducts} onMouseLeave={scheduleClose}>
            <button
              type="button"
              aria-expanded={productsOpen}
              aria-haspopup="true"
              onClick={() => setProductsOpen((open) => !open)}
              className={`group relative flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                productsActive ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              Products
              <Icon
                name="chevron-down"
                className={`h-3.5 w-3.5 transition-transform duration-300 ${productsOpen ? "rotate-180" : ""}`}
                strokeWidth={2.6}
              />
              <NavUnderline active={productsActive} />
            </button>

            <div
              className={`absolute left-1/2 top-full w-[600px] -translate-x-1/2 pt-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                productsOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-2 opacity-0"
              }`}
            >
              <div className="overflow-hidden rounded-3xl bg-white/95 p-3 shadow-[0_40px_80px_-30px_rgba(15,23,42,0.4)] ring-1 ring-ink/5 backdrop-blur-xl">
                <div className="grid grid-cols-2 gap-2">
                  {siteApps.map((app, index) => (
                    <Link
                      key={app.slug}
                      href={app.href}
                      onClick={() => setProductsOpen(false)}
                      className="group/item flex items-start gap-3 rounded-2xl p-3 transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        transitionDelay: productsOpen ? `${index * 30}ms` : "0ms",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = app.colorSoft)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <AppIcon src={app.iconPath} name={app.name} size={40} className="transition-transform duration-300 group-hover/item:scale-110" />
                      <span>
                        <span className="block text-sm font-bold text-ink">{app.name}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{app.cardSubtitle}</span>
                      </span>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/products"
                  onClick={() => setProductsOpen(false)}
                  className="group/all mt-2 flex items-center justify-between rounded-2xl bg-ink/[0.03] px-4 py-3 text-sm font-semibold text-ink transition hover:bg-ink/[0.06]"
                >
                  See how the apps work together
                  <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover/all:translate-x-1" />
                </Link>
              </div>
            </div>
          </li>
          {mainNav.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`group relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive(link.href) ? "text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {link.label}
                <NavUnderline active={isActive(link.href)} />
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden shrink-0 lg:block">
          <AuthNav />
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-ink ring-1 ring-ink/10 transition active:scale-95 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <Icon name={mobileOpen ? "x" : "menu"} className="h-5 w-5" />
        </button>
      </nav>

      <div
        className={`fixed inset-x-0 bottom-0 top-[68px] overflow-y-auto bg-white/95 px-5 pb-10 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <p className="pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Products</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {siteApps.map((app, index) => (
            <Link
              key={app.slug}
              href={app.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-2xl p-3 transition-all duration-500 ${
                mobileOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
              style={{ background: app.colorSoft, transitionDelay: `${80 + index * 50}ms` }}
            >
              <AppIcon src={app.iconPath} name={app.name} size={34} />
              <span className="text-sm font-bold text-ink">{app.name}</span>
            </Link>
          ))}
        </div>
        <ul className="mt-6 space-y-1">
          {[{ label: "All products", href: "/products" }, ...mainNav, { label: "Contact", href: "/contact" }].map(
            (link, index) => (
              <li
                key={link.href}
                className={`transition-all duration-500 ${mobileOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
                style={{ transitionDelay: `${260 + index * 40}ms` }}
              >
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-2xl px-3 py-3.5 text-lg font-bold text-ink transition hover:bg-ink/[0.04]"
                >
                  {link.label}
                  <Icon name="arrow-right" className="h-4 w-4 text-ink-faint" />
                </Link>
              </li>
            ),
          )}
        </ul>
        <AuthNavMobile onNavigate={() => setMobileOpen(false)} />
      </div>
    </header>
  );
}

function NavUnderline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute inset-x-4 -bottom-0.5 h-[2px] origin-left rounded-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
      }`}
    />
  );
}
