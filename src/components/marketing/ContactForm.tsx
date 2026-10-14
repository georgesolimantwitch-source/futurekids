"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/site/Icon";

const topics = ["General question", "Account & billing", "App support", "Partnerships", "Press"];

export function ContactForm({
  email,
  appNames,
  defaultTopic,
  defaultApp,
}: {
  email: string;
  appNames: string[];
  defaultTopic?: string;
  defaultApp?: string;
}) {
  const [topic, setTopic] = useState(defaultTopic ?? topics[0]);
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const app = data.get("app")?.toString();
    const subject = [topic, app && topic === "App support" ? app : null].filter(Boolean).join(" · ");
    const body = `${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] bg-white p-10 text-center shadow-[0_40px_90px_-44px_rgba(15,23,42,0.45)] ring-1 ring-ink/5">
        <span className="pulse-ring flex h-16 w-16 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a]">
          <Icon name="check" className="h-7 w-7" strokeWidth={3} />
        </span>
        <p className="font-display mt-6 text-2xl font-extrabold text-ink">Your email is ready to send</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          We opened your email app with your message. Hit send and we’ll get back to you soon. If nothing opened, email us at{" "}
          <a href={`mailto:${email}`} className="font-semibold text-ink underline underline-offset-4">
            {email}
          </a>
          .
        </p>
        <button type="button" onClick={() => setSent(false)} className="press mt-8 rounded-full bg-ink/[0.05] px-5 py-2.5 text-sm font-bold text-ink hover:bg-ink/[0.08]">
          Write another message
        </button>
      </div>
    );
  }

  const field =
    "w-full rounded-2xl bg-[#f7f8fc] px-4 py-3.5 text-[15px] text-ink outline-none ring-1 ring-ink/[0.06] transition-all duration-300 placeholder:text-ink-faint focus:bg-white focus:ring-2 focus:ring-brand/40";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[32px] bg-white p-6 shadow-[0_40px_90px_-44px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 sm:p-9"
    >
      <p className="font-display text-2xl font-extrabold text-ink">Send us a message</p>
      <div className="mt-6 flex flex-wrap gap-2" role="radiogroup" aria-label="Topic">
        {topics.map((item) => {
          const selected = item === topic;
          return (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTopic(item)}
              className={`press rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-300 ${
                selected ? "bg-ink text-white" : "bg-[#f7f8fc] text-ink-soft ring-1 ring-ink/[0.06] hover:text-ink"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-ink-soft">Your name</span>
          <input name="name" required autoComplete="name" placeholder="Jordan Smith" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-ink-soft">Email</span>
          <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={field} />
        </label>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          topic === "App support" ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-ink-soft">Which app?</span>
            <select name="app" defaultValue={defaultApp ?? appNames[0]} className={field} tabIndex={topic === "App support" ? 0 : -1}>
              {appNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-bold text-ink-soft">Message</span>
        <textarea name="message" required rows={5} placeholder="How can we help?" className={`${field} resize-none`} />
      </label>

      <button
        type="submit"
        className="shine press mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-bold text-white transition hover:bg-black"
      >
        Send message
        <Icon name="send" className="h-4 w-4" />
      </button>
      <p className="mt-3 text-center text-xs text-ink-faint">Opens your email app with everything filled in.</p>
    </form>
  );
}
