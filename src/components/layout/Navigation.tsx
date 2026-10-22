"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const lastY = useRef(0);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (mobileOpen) return;
      const y = window.scrollY;
      setScrolled(y > 8);
      // Auto-hide only on desktop — transform breaks fixed mobile menu
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setHidden(y > 240 && y > lastY.current + 4);
        if (y < lastY.current - 4) setHidden(false);
      } else {
        setHidden(false);
      }
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setProductsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const scrollY = window.scrollY;
    const { style } = document.body;
    const previous = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
    };
    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    return () => {
      style.overflow = previous.overflow;
      style.position = previous.position;
      style.top = previous.top;
      style.left = previous.left;
      style.right = previous.right;
      style.width = previous.width;
      window.scrollTo(0, scrollY);
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
  // Never leave a transform on the header when the menu is open — transforms
  // make position:fixed children resolve against the header instead of the viewport.
  const headerHidden = hidden && !productsOpen && !mobileOpen;

  const mobileMenu =
    mounted &&
    createPortal(
      <div
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`fixed inset-0 z-[60] flex flex-col bg-white transition-[opacity,visibility] duration-300 lg:hidden ${
          mobileOpen
            ? "pointer-events-auto visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-[68px] shrink-0 items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            className="shrink-0"
            aria-label={brand.productName}
            onClick={() => setMobileOpen(false)}
          >
            <BrandLogo size="nav" />
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f8fc] text-ink ring-1 ring-ink/10 transition active:scale-95"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-8">
          <p className="pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            Products
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {siteApps.map((app, index) => (
              <Link
                key={app.slug}
                href={app.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-2xl p-3 transition-all duration-500 ${
                  mobileOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                }`}
                style={{
                  background: app.colorSoft,
                  transitionDelay: `${80 + index * 50}ms`,
                }}
              >
                <AppIcon src={app.iconPath} name={app.name} size={34} />
                <span className="text-sm font-bold text-ink">{app.name}</span>
              </Link>
            ))}
          </div>
          <Link
            href="/genlyn-hub"
            onClick={() => setMobileOpen(false)}
            className={`mt-2 flex items-center gap-3 rounded-2xl bg-[#f3efff] p-3 transition-all duration-500 ${
              mobileOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
            style={{ transitionDelay: "280ms" }}
          >
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[28%] bg-white text-[#7c3aed]">
              <Icon name="home" className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-ink">Genlyn Hub</span>
          </Link>
          <ul className="mt-6 space-y-1">
            {[
              { label: "All products", href: "/products" },
              ...mainNav,
              { label: "Contact", href: "/contact" },
            ].map((link, index) => (
              <li
                key={link.href}
                className={`transition-all duration-500 ${
                  mobileOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                }`}
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
            ))}
          </ul>
          <AuthNavMobile onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          headerHidden ? "-translate-y-full" : ""
        } ${
          scrolled || mobileOpen
            ? "bg-white/90 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.5)] backdrop-blur-xl"
            : "bg-transparent"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
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
            <li
              className="relative"
              onMouseEnter={openProducts}
              onMouseLeave={scheduleClose}
            >
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
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${
                    productsOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={2.6}
                />
                <NavUnderline active={productsActive} />
              </button>

              <div
                className={`absolute left-1/2 top-full w-[min(600px,calc(100vw-2.5rem))] -translate-x-1/2 pt-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
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
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = app.colorSoft)
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <AppIcon
                          src={app.iconPath}
                          name={app.name}
                          size={40}
                          className="transition-transform duration-300 group-hover/item:scale-110"
                        />
                        <span>
                          <span className="block text-sm font-bold text-ink">
                            {app.name}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                            {app.cardSubtitle}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/genlyn-hub"
                    onClick={() => setProductsOpen(false)}
                    className="mt-2 flex items-center gap-3 rounded-2xl bg-[#f3efff] px-4 py-3 text-sm font-semibold text-ink transition hover:bg-[#ebe4ff]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#7c3aed] shadow-sm">
                      <Icon name="home" className="h-5 w-5" />
                    </span>
                    <span className="flex-1 text-left">
                      <span className="block font-bold">Genlyn Hub</span>
                      <span className="block text-xs font-medium text-ink-soft">
                        Family wall tablet · from $199
                      </span>
                    </span>
                    <Icon name="arrow-right" className="h-4 w-4 text-ink-faint" />
                  </Link>
                  <Link
                    href="/products"
                    onClick={() => setProductsOpen(false)}
                    className="group/all mt-2 flex items-center justify-between rounded-2xl bg-ink/[0.03] px-4 py-3 text-sm font-semibold text-ink transition hover:bg-ink/[0.06]"
                  >
                    See how the apps work together
                    <Icon
                      name="arrow-right"
                      className="h-4 w-4 transition-transform group-hover/all:translate-x-1"
                    />
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-ink ring-1 ring-ink/10 transition active:scale-95 lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <Icon name={mobileOpen ? "x" : "menu"} className="h-5 w-5" />
          </button>
        </nav>
      </header>
      {mobileMenu}
    </>
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
