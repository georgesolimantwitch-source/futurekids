import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  brand,
  supportCategories,
  supportFaqs,
} from "@/config/brand";
import { SupportForm } from "@/components/support/SupportForm";

export const metadata: Metadata = {
  title: "Support",
  description: `Get help with ${brand.companyName} apps. Browse common questions or contact support.`,
  openGraph: {
    title: `Support | ${brand.companyName}`,
    description: `Get help with ${brand.companyName} apps.`,
  },
  twitter: {
    card: "summary",
    title: `Support | ${brand.companyName}`,
    description: `Get help with ${brand.companyName} apps.`,
  },
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Support
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
          We&apos;re here to help.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-neutral-600 sm:text-lg">
          Browse app-specific help, common questions, or send a message. Prefer email? Reach us at{" "}
          <a
            href={`mailto:${brand.supportEmail}`}
            className="font-medium text-neutral-900 underline underline-offset-4"
          >
            {brand.supportEmail}
          </a>
          <span className="text-neutral-500"> (placeholder — update in config).</span>
        </p>
      </div>

      <section className="mt-12 sm:mt-16" aria-labelledby="support-apps">
        <h2 id="support-apps" className="text-xl font-semibold text-neutral-900 sm:text-2xl">
          Support by app
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {supportCategories.map((category) => (
            <article
              key={category.slug}
              className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: category.accentColorLight }}
                >
                  <Image
                    src={category.iconPath}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{category.name}</h3>
                  <p className="text-sm text-neutral-500">{category.description}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {category.topics.map((topic) => (
                  <li key={topic} className="text-sm text-neutral-600">
                    • {topic}
                  </li>
                ))}
              </ul>
              <Link
                href={category.href}
                className="mt-4 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
                style={{ color: category.accentColor }}
              >
                View {category.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 sm:mt-20" aria-labelledby="support-faq">
        <h2 id="support-faq" className="text-xl font-semibold text-neutral-900 sm:text-2xl">
          Common questions
        </h2>
        <div className="mt-6 space-y-4">
          {supportFaqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-2xl border border-neutral-100 bg-white p-5 sm:p-6"
            >
              <h3 className="font-semibold text-neutral-900">{faq.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 sm:mt-20" aria-labelledby="support-contact">
        <h2 id="support-contact" className="text-xl font-semibold text-neutral-900 sm:text-2xl">
          Contact form
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600 sm:text-base">
          UI only for now — submissions are not stored or emailed until a backend is connected.
        </p>
        <div className="mt-6 max-w-xl">
          <SupportForm />
        </div>
      </section>
    </div>
  );
}
