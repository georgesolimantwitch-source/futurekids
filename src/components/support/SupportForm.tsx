"use client";

import { useState, type FormEvent } from "react";
import { apps, brand } from "@/config/brand";
import { Button } from "@/components/ui/Button";

export function SupportForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-6 text-center shadow-sm sm:p-8">
        <h3 className="text-lg font-semibold text-neutral-900">Message captured (preview)</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          This form is not connected to a backend yet. Please email{" "}
          <a
            href={`mailto:${brand.supportEmail}`}
            className="font-medium text-neutral-900 underline underline-offset-4"
          >
            {brand.supportEmail}
          </a>{" "}
          for support.
        </p>
        <button
          type="button"
          className="mt-6 text-sm font-medium text-neutral-700 underline underline-offset-4"
          onClick={() => setSubmitted(false)}
        >
          Reset form
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm sm:p-8"
      noValidate
    >
      <div>
        <label htmlFor="support-name" className="mb-1.5 block text-sm font-medium text-neutral-900">
          Name
        </label>
        <input
          id="support-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
        />
      </div>

      <div>
        <label htmlFor="support-email" className="mb-1.5 block text-sm font-medium text-neutral-900">
          Email
        </label>
        <input
          id="support-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
        />
      </div>

      <div>
        <label htmlFor="support-app" className="mb-1.5 block text-sm font-medium text-neutral-900">
          App
        </label>
        <select
          id="support-app"
          name="app"
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          defaultValue=""
          required
        >
          <option value="" disabled>
            Select an app
          </option>
          {apps.map((app) => (
            <option key={app.slug} value={app.slug}>
              {app.name}
            </option>
          ))}
          <option value="general">General / Website</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="support-message"
          className="mb-1.5 block text-sm font-medium text-neutral-900"
        >
          How can we help?
        </label>
        <textarea
          id="support-message"
          name="message"
          rows={5}
          required
          className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
        />
      </div>

      <p className="text-xs leading-relaxed text-neutral-500">
        Form submissions are not sent yet. For now, email{" "}
        <span className="font-medium text-neutral-700">{brand.supportEmail}</span>{" "}
        (placeholder — update in brand config).
      </p>

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        Submit
      </Button>
    </form>
  );
}
