import Link from "next/link";
import { brand, footerLinks } from "@/config/brand";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-900">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-neutral-100 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="text-xl font-semibold text-neutral-900">
              {brand.logo.text}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600">
              {brand.description}
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href={brand.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                aria-label="Instagram"
              >
                Instagram
              </a>
              <a
                href={brand.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                aria-label="TikTok"
              >
                TikTok
              </a>
              <Link
                href="/contact"
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                Contact
              </Link>
            </div>
          </div>

          <FooterColumn title="Apps" links={footerLinks.apps} />
          <FooterColumn title="Company" links={footerLinks.company} />
          <div>
            <FooterColumn title="Legal" links={footerLinks.legal} />
            <div className="mt-8">
              <FooterColumn title="Support" links={footerLinks.support} />
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-200 pt-8">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} {brand.companyName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
