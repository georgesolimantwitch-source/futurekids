import type { Metadata } from "next";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `${brand.companyName} privacy policy placeholder — replace after legal review.`,
  openGraph: {
    title: `Privacy Policy | ${brand.companyName}`,
    description: `Privacy information for ${brand.companyName}.`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-500">
        Legal
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-4 text-sm text-neutral-500">Last updated: July 2026 (draft placeholder)</p>

      <aside className="mt-8 rounded-2xl border border-amber-100 bg-amber-50/60 p-5 text-sm leading-relaxed text-neutral-700">
        This page is a <strong>placeholder</strong> for launch readiness. It is not final
        legal advice or a verified compliance statement. Have counsel review and replace
        this content before public launch.
      </aside>

      <div className="mt-10 space-y-8 text-neutral-600">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Overview</h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base">
            {brand.companyName} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) intends to
            protect the privacy of children and families. This draft outlines themes we expect
            a final policy to cover across our apps and website.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
            Information We May Collect
          </h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base">
            Depending on the product, we may process account details, device information, usage
            data, and content created in-app. Final categories, purposes, and retention periods
            will be specified after privacy review.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
            Children&apos;s Privacy
          </h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base">
            Products intended for children are designed with parental involvement in mind. We
            plan to follow applicable children&apos;s privacy requirements. Specific legal
            commitments (including any named statute compliance) will be confirmed by counsel
            before launch.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">Contact</h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base">
            Privacy questions:{" "}
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
