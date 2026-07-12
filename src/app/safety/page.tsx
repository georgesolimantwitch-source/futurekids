import type { Metadata } from "next";
import { brand, safetyPageSections } from "@/config/brand";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Safety",
  description: `How ${brand.companyName} approaches parent-first design, child privacy, account controls, and age-appropriate experiences.`,
  openGraph: {
    title: `Safety | ${brand.companyName}`,
    description: `Parent-first safety principles across the ${brand.companyName} ecosystem.`,
  },
  twitter: {
    card: "summary",
    title: `Safety | ${brand.companyName}`,
    description: `Parent-first safety principles across the ${brand.companyName} ecosystem.`,
  },
};

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-500">
        Safety
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
        Safety is not a feature. It&apos;s the foundation.
      </h1>
      <p className="mt-5 text-base leading-relaxed text-neutral-600 sm:text-lg">
        Every app in the {brand.companyName} ecosystem is designed with families in mind.
        The statements below describe our product direction. They are not final legal
        guarantees — policies and compliance claims will be confirmed with legal and
        privacy review before launch.
      </p>

      <div className="mt-10 space-y-8 sm:mt-12">
        {safetyPageSections.map((section) => (
          <article
            key={section.title}
            className="border-b border-neutral-100 pb-8 last:border-0"
          >
            <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {section.description}
            </p>
          </article>
        ))}
      </div>

      <aside className="mt-10 rounded-2xl border border-amber-100 bg-amber-50/60 p-5 text-sm leading-relaxed text-neutral-700 sm:p-6">
        <p className="font-medium text-neutral-900">Compliance note</p>
        <p className="mt-2">
          Do not treat this page as a completed Privacy Policy, Terms of Service, or
          certified children&apos;s privacy attestation. Replace placeholder language
          after lawyer or compliance review.
        </p>
      </aside>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button href="/privacy" variant="secondary" size="md" className="w-full sm:w-auto">
          Privacy Policy
        </Button>
        <Button href="/contact" size="md" className="w-full sm:w-auto">
          Contact Us
        </Button>
      </div>
    </div>
  );
}
