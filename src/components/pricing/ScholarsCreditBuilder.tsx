"use client";

import { useState } from "react";
import {
  clampGenerations,
  clampTutorMinutes,
  combinedCompareAtPrice,
  combinedCreditPrice,
  combinedSavePercent,
  combinedYearlyMonthlyEquivalent,
  creditPriceLine,
  formatCreditUsd,
  grantSummaryLabel,
  periodLabel,
  scholarsCreditPricing,
  type ScholarsCreditPeriod,
} from "@/config/scholars-credits";
import { redirectToLoginForCheckout } from "@/lib/checkout/client";
import { subscribeUpgradeDowngradeLabel } from "@/lib/subscriptions/plan-cta";

function StepperCard({
  label,
  hint,
  amount,
  unit,
  onDec,
  onInc,
  footer,
}: {
  label: string;
  hint: string;
  amount: number;
  unit: string;
  onDec: () => void;
  onInc: () => void;
  footer: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-[15px] font-semibold text-[#1d1d1f]">{label}</p>
      <p className="mt-1 text-xs leading-snug text-neutral-500">{hint}</p>
      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onDec}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-2xl leading-none text-white transition hover:bg-[#0066d6]"
          aria-label={`Fewer ${label}`}
        >
          −
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-4xl font-bold tabular-nums tracking-tight text-[#1d1d1f]">
            {amount === 0 ? "—" : amount}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {amount === 0 ? "Not included" : unit}
          </p>
        </div>
        <button
          type="button"
          onClick={onInc}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-2xl leading-none text-white transition hover:bg-[#0066d6]"
          aria-label={`More ${label}`}
        >
          +
        </button>
      </div>
      <p className="mt-4 text-center text-[11px] text-neutral-400">{footer}</p>
    </div>
  );
}

export function ScholarsCreditBuilder({
  embedded = false,
  hasExistingPlan = false,
}: {
  embedded?: boolean;
  hasExistingPlan?: boolean;
}) {
  const [generations, setGenerations] = useState<number>(
    scholarsCreditPricing.generations.default,
  );
  const [tutorMinutes, setTutorMinutes] = useState<number>(
    scholarsCreditPricing.tutorMinutes.default,
  );
  const [period, setPeriod] = useState<ScholarsCreditPeriod>(
    scholarsCreditPricing.defaultPeriod,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gens = clampGenerations(generations);
  const mins = clampTutorMinutes(tutorMinutes);
  const price = combinedCreditPrice(gens, mins, period);
  const canCheckout = gens > 0 || mins > 0;
  const selectedMonthly = period === "yearly" ? price / 12 : price;
  const creditVerb = subscribeUpgradeDowngradeLabel({
    hasExistingPlan,
    isCurrentSelection: false,
    selectedMonthly,
    currentMonthly: null,
  });
  const stickyAction =
    !hasExistingPlan && period === "refill"
      ? "Buy"
      : creditVerb === "Current Plan"
        ? "Subscribe"
        : creditVerb;

  async function checkout() {
    if (!canCheckout) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scholars/usage/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          generations: gens,
          tutor_minutes: mins,
          period,
        }),
      });
      const raw = await res.text();
      let data: { url?: string; error?: string; code?: string } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        throw new Error("Could not start checkout");
      }
      if (res.status === 401 || data.code === "AUTH_REQUIRED") {
        redirectToLoginForCheckout({
          planKey: "scholars_credits",
          generations: gens,
          tutor_minutes: mins,
          period,
        });
        return;
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout");
      }
      globalThis.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  const billingOptions: Array<{
    id: ScholarsCreditPeriod;
    title: string;
    subtitle: string;
  }> = [
    {
      id: "refill",
      title: "Refill credits",
      subtitle: "Pay once · credits never expire",
    },
    {
      id: "monthly",
      title: "Monthly",
      subtitle: "Refills every month · cancel anytime",
    },
    {
      id: "yearly",
      title: "Yearly",
      subtitle: "Same monthly refill · billed once a year",
    },
  ];

  const body = (
    <>
      <div className={embedded ? "px-1 pb-2 pt-1" : "text-center"}>
        <h2
          className={`font-semibold tracking-tight text-[#1d1d1f] ${
            embedded ? "text-2xl" : "font-display text-3xl sm:text-4xl"
          }`}
        >
          Build your AI plan
        </h2>
        <p
          className={`mt-2 text-sm text-neutral-500 ${
            embedded ? "max-w-none" : "mx-auto max-w-xl sm:text-base"
          }`}
        >
          Credits land on your parent account. Assign them to a child anytime in
          Account → Manage kids. Set either to 0 to skip it — you only pay for
          what you pick.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <StepperCard
            label="Generations"
            hint="Flashcards, quiz, practice, grading · podcasts use 2"
            amount={gens}
            unit="generations"
            onDec={() =>
              setGenerations((v) =>
                clampGenerations(v - scholarsCreditPricing.generations.step),
              )
            }
            onInc={() =>
              setGenerations((v) =>
                clampGenerations(v + scholarsCreditPricing.generations.step),
              )
            }
            footer="Steps of 5 · 0 = skip"
          />
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
            <p className="text-sm font-medium text-[#1d1d1f]">
              Turn notes into study tools instantly
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
              One generation builds flashcards, quizzes, practice, or AI grading
              from what you already wrote.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <StepperCard
            label="Tutor Minutes"
            hint="Only while the voice tutor is active"
            amount={mins}
            unit="minutes"
            onDec={() =>
              setTutorMinutes((v) =>
                clampTutorMinutes(v - scholarsCreditPricing.tutorMinutes.step),
              )
            }
            onInc={() =>
              setTutorMinutes((v) =>
                clampTutorMinutes(v + scholarsCreditPricing.tutorMinutes.step),
              )
            }
            footer="Steps of 30 · 0 = skip"
          />
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
            <p className="text-sm font-medium text-[#1d1d1f]">
              A tutor that stays with you
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
              Tutor minutes power live voice help when you&apos;re stuck — talk
              through a problem like a real study session.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs leading-relaxed text-neutral-500">
        Mix generations and tutor minutes in one plan. Dial either to 0 and you
        only pay for what you&apos;ll use.
      </p>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-[#1d1d1f]">Billing</p>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {billingOptions.map((opt, index) => {
            const selected = period === opt.id;
            const optPrice = combinedCreditPrice(gens, mins, opt.id);
            const optCompare = combinedCompareAtPrice(gens, mins, opt.id);
            const optSave = combinedSavePercent(gens, mins, opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition ${
                  index > 0 ? "border-t border-neutral-100" : ""
                } ${selected ? "bg-[#007AFF]/08" : "hover:bg-neutral-50"}`}
              >
                <div className="flex min-w-0 gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected
                        ? "border-[#007AFF] bg-[#007AFF] text-white"
                        : "border-neutral-300"
                    }`}
                    aria-hidden
                  >
                    {selected ? (
                      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                        <path
                          d="M2.5 6.2 4.8 8.5 9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#1d1d1f]">{opt.title}</p>
                      {optSave != null && optSave > 0 && (
                        <span className="rounded-full bg-[#007AFF] px-2 py-0.5 text-[10px] font-semibold text-white">
                          Save {optSave}%
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">{opt.subtitle}</p>
                    {opt.id === "yearly" && (gens > 0 || mins > 0) && (
                      <p className="mt-1 text-xs font-medium text-[#007AFF]">
                        {formatCreditUsd(
                          combinedYearlyMonthlyEquivalent(gens, mins),
                        )}
                        /mo
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums text-[#1d1d1f]">
                    {gens > 0 || mins > 0
                      ? creditPriceLine(optPrice, opt.id)
                      : "—"}
                  </p>
                  {optCompare != null && (gens > 0 || mins > 0) && (
                    <p className="text-xs tabular-nums text-neutral-400 line-through">
                      {creditPriceLine(optCompare, opt.id)}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mt-5 text-center text-[11px] leading-relaxed text-neutral-400">
        Refill credits never expire. Subscriptions renew until canceled in your
        Genlyn account. Unused balance is kept if you cancel.{" "}
        <a href="/terms" className="underline">
          Terms of Use
        </a>{" "}
        ·{" "}
        <a href="/privacy" className="underline">
          Privacy Policy
        </a>
      </p>
    </>
  );

  const sticky = (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500">
            {periodLabel(period)} · Parent account
          </p>
          <p className="truncate text-sm font-semibold text-[#1d1d1f]">
            {grantSummaryLabel(gens, mins)}
          </p>
        </div>
        <button
          type="button"
          disabled={!canCheckout || loading}
          onClick={checkout}
          className="shrink-0 rounded-2xl bg-[#007AFF] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0066d6] disabled:opacity-40"
        >
          {loading
            ? "Starting…"
            : `${stickyAction} · ${
                gens > 0 || mins > 0 ? creditPriceLine(price, period) : "—"
              }`}
        </button>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="pb-24">
        {body}
        {sticky}
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden px-4 pb-28 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">{body}</div>
      {sticky}
    </section>
  );
}
