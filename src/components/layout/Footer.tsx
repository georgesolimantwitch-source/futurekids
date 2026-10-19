import Link from "next/link";
import type { CSSProperties } from "react";
import { brand } from "@/config/brand";
import { siteApps } from "@/config/site";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { FooterCta } from "./FooterCta";
import { Reveal } from "@/components/site/motion";
import { AppIcon, Blobs, Container, PillLink } from "@/components/site/ui";

const columns = [
  {
    title: "Products",
    links: [
      ...siteApps.map((app) => ({ label: app.name, href: app.href })),
      { label: "Genlyn Hub", href: "/genlyn-hub" },
      { label: "All products", href: "/products" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Our Mission", href: "/mission" },
      { label: "For Families", href: "/families" },
      { label: "Resources", href: "/resources" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Plans & Pricing", href: "/pricing" },
      { label: "Help Center", href: "/support" },
      { label: "Contact", href: "/contact" },
      { label: "Safety", href: "/safety" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-10 overflow-hidden">
      <Container>
        <FooterCta>
        <Reveal dir="scale">
          <div className="relative overflow-hidden rounded-[36px] bg-ink px-8 py-14 text-white sm:px-14 sm:py-16">
            <Blobs intensity={0.55} />
            <div className="relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <div className="flex -space-x-2">
                  {siteApps.map((app, index) => (
                    <span
                      key={app.slug}
                      className="float rounded-[28%] ring-4 ring-ink"
                      style={{ "--float-delay": `${index * -0.7}s`, "--float-distance": "-6px" } as CSSProperties}
                    >
                      <AppIcon src={app.iconPath} name={app.name} size={44} />
                    </span>
                  ))}
                </div>
                <h2 className="font-display mt-7 text-4xl font-extrabold leading-[1.05] sm:text-5xl">
                  Raise kids ready for life.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">
                  One Genlyn account unlocks every app — and keeps you in the loop on all of it.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <PillLink href="/signup" variant="light" size="lg">
                  Get started
                </PillLink>
                <PillLink href="/pricing" variant="soft" size="lg" arrow={false} className="!bg-white/10 !text-white hover:!bg-white/20">
                  See pricing
                </PillLink>
              </div>
            </div>
          </div>
        </Reveal>
        </FooterCta>

        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block transition-transform hover:scale-[1.03]" aria-label={brand.productName}>
              <BrandLogo size="footer" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              Healthy eating, active lifestyles, smarter learning, and financial responsibility — all in one family ecosystem.
            </p>
            <div className="mt-6 flex gap-2">
              {[
                { label: "Instagram", href: brand.social.instagram },
                { label: "TikTok", href: brand.social.tiktok },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press rounded-full bg-ink/[0.04] px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink/[0.08]"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover:scale-x-100" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-ink/[0.06] py-8 text-sm text-ink-faint sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {brand.companyName}. All rights reserved.
          </p>
          <a href={`mailto:${brand.supportEmail}`} className="transition hover:text-ink">
            {brand.supportEmail}
          </a>
        </div>
      </Container>
    </footer>
  );
}
