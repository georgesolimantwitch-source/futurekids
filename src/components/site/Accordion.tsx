"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function Accordion({
  items,
  color = "#2563eb",
}: {
  items: { question: string; answer: string }[];
  color?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div
            key={item.question}
            className={`rounded-3xl bg-white ring-1 transition-shadow duration-500 ${
              isOpen ? "shadow-[0_24px_50px_-30px_rgba(15,23,42,0.35)] ring-ink/10" : "ring-ink/5"
            }`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left sm:px-7"
            >
              <span className="text-base font-bold text-ink sm:text-lg">{item.question}</span>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                  isOpen ? "rotate-45 text-white" : "text-ink"
                }`}
                style={{ background: isOpen ? color : "rgba(11,16,32,0.05)" }}
              >
                <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} />
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-6 text-[15px] leading-relaxed text-ink-soft sm:px-7">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
