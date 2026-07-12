"use client";

import { useState } from "react";
import { type AppConfig } from "@/config/brand";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface AppProductFaqProps {
  app: AppConfig;
}

export function AppProductFaq({ app }: AppProductFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-32 bg-[#fafafa] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions."
            description={`Everything you need to know about ${app.name}.`}
            className="mb-12"
          />
        </AnimateOnScroll>

        <div className="space-y-3">
          {app.faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <AnimateOnScroll key={faq.question} delay={index * 50}>
                <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                  >
                    <span className="font-medium text-neutral-900">{faq.question}</span>
                    <svg
                      className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-neutral-600">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
