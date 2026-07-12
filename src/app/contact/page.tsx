import type { Metadata } from "next";
import { brand, getAppBySlug } from "@/config/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${brand.companyName} team.`,
  openGraph: {
    title: `Contact | ${brand.companyName}`,
    description: `Contact ${brand.companyName}.`,
  },
  twitter: {
    card: "summary",
    title: `Contact | ${brand.companyName}`,
    description: `Contact ${brand.companyName}.`,
  },
};

interface ContactPageProps {
  searchParams: Promise<{ app?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { app: appSlug } = await searchParams;
  const app = appSlug ? getAppBySlug(appSlug) : undefined;
  const isWaitlist = app?.availability === "waitlist";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-500">
        {isWaitlist ? "Waitlist" : "Contact"}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
        {isWaitlist && app ? `Join the ${app.name} waitlist.` : "Get in touch."}
      </h1>
      <p className="mt-5 text-base leading-relaxed text-neutral-600 sm:text-lg">
        {isWaitlist && app
          ? `Be the first to know when ${app.name} launches. Email us and we’ll add you to the waitlist.`
          : "Whether you have a question, partnership inquiry, or press request, we’d love to hear from you."}
      </p>

      <div className="mt-10 space-y-5 sm:mt-12 sm:space-y-6">
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isWaitlist ? "Join the Waitlist" : "General Inquiries"}
          </h2>
          <a
            href={`mailto:${brand.supportEmail}?subject=${encodeURIComponent(
              isWaitlist && app ? `${app.name} Waitlist` : "General Inquiry",
            )}`}
            className="mt-2 block break-all text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
          >
            {brand.supportEmail}
          </a>
          <p className="mt-3 text-xs text-neutral-500">
            Placeholder support email — update in <code>config/brand.ts</code>.
          </p>
          {isWaitlist && (
            <p className="mt-4 text-sm text-neutral-500">
              Include your name and how many children you’d like to register.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-neutral-900">Follow Us</h2>
          <div className="mt-4 flex flex-wrap gap-6">
            <a
              href={brand.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 inline-flex items-center text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
            >
              Instagram
            </a>
            <a
              href={brand.social.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 inline-flex items-center text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
            >
              TikTok
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
