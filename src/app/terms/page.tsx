import type { Metadata } from "next";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `${brand.companyName} terms of service placeholder — replace after legal review.`,
  openGraph: {
    title: `Terms of Service | ${brand.companyName}`,
    description: `Terms for ${brand.companyName} apps and website.`,
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-500">
        Legal
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
        Terms of Service
      </h1>
      <p className="mt-4 text-sm text-neutral-500">Last updated: July 2026 (draft placeholder)</p>

      <aside className="mt-8 rounded-2xl border border-amber-100 bg-amber-50/60 p-5 text-sm leading-relaxed text-neutral-700">
        This page is a <strong>placeholder</strong>. It is not a final contract. Replace with
        counsel-approved Terms before public launch.
      </aside>

      <div className="mt-10 space-y-8 text-neutral-600">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
            Acceptance of Terms
          </h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base">
            By accessing {brand.companyName} websites or apps, you agree to the terms that will
            govern those services. Until a final version is published, treat this page as
            informational only.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Use of Services</h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base">
            Our apps may be intended for use by children under parental supervision. Parents
            and guardians are expected to manage accounts and permissions where applicable.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
            Account Responsibilities
          </h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base">
            You are responsible for safeguarding account credentials and for activity under
            your account, subject to the final Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Contact</h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base">
            Questions:{" "}
            <a
              href={`mailto:${brand.supportEmail}`}
              className="text-neutral-900 underline underline-offset-4"
            >
              {brand.supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
