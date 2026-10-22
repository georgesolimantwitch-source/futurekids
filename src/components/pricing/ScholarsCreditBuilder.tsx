"use client";

import { useEffect, useState } from "react";
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
  isScholarsCreditSkuAvailable,
  periodLabel,
  scholarsCreditPricing,
  type ScholarsCreditPeriod,
} from "@/config/scholars-credits";
import {
  scholarsTextTutorPriceLine,
  type ScholarsTextTutorPeriod,
} from "@/config/scholars-text-tutor";
import { redirectToLoginForCheckout } from "@/lib/checkout/client";
import { subscribeUpgradeDowngradeLabel } from "@/lib/subscriptions/plan-cta";

type KidOption = {
  id: string;
  username: string | null;
  display_name: string | null;
  full_name: string | null;
};

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
  const [kids, setKids] = useState<KidOption[]>([]);
  /** 0 = parent pool; 1–6 = assign to that many child logins */
  const [childCount, setChildCount] = useState(0);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [textTutorLoading, setTextTutorLoading] = useState<
    ScholarsTextTutorPeriod | null
  >(null);

  const maxAssignableKids = Math.min(6, Math.max(kids.length, 1));

  useEffect(() => {
    let cancelled = false;
    async function loadKids() {
      try {
        const res = await fetch("/api/kids");
        if (!res.ok) return;
        const data = (await res.json()) as { children?: KidOption[] };
        if (cancelled || !Array.isArray(data.children)) return;
        setKids(data.children);
        if (data.children.length === 1) {
          setChildCount(1);
          setSelectedChildIds([data.children[0].id]);
        }
      } catch {
        // Guest / not signed in — checkout will redirect to login.
      }
    }
    loadKids();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (childCount <= 0) {
      setSelectedChildIds([]);
      return;
    }
    setSelectedChildIds((prev) => {
      const kept = prev.filter((id) => kids.some((kid) => kid.id === id));
      if (kept.length > childCount) return kept.slice(0, childCount);
      if (kept.length === childCount) return kept;
      const fill = kids
        .map((kid) => kid.id)
        .filter((id) => !kept.includes(id))
        .slice(0, childCount - kept.length);
      return [...kept, ...fill];
    });
  }, [childCount, kids]);

  const gens = clampGenerations(generations);
  const mins = clampTutorMinutes(tutorMinutes, generations);
  const price = combinedCreditPrice(gens, mins, period);
  const assignReady =
    childCount === 0 || selectedChildIds.length === childCount;
  const canCheckout =
    (gens > 0 || mins > 0) &&
    isScholarsCreditSkuAvailable(gens, mins, period) &&
    assignReady;

  useEffect(() => {
    if (gens === 0 && mins === 0) return;
    if (isScholarsCreditSkuAvailable(gens, mins, period)) return;
    const fallback = (["refill", "monthly", "yearly"] as const).find((p) =>
      isScholarsCreditSkuAvailable(gens, mins, p),
    );
    if (fallback) setPeriod(fallback);
  }, [gens, mins, period]);
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

  async function checkoutTextTutor(periodChoice: ScholarsTextTutorPeriod) {
    if (childCount > 0 && selectedChildIds.length !== childCount) {
      setError(
        `Select ${childCount} child login${childCount === 1 ? "" : "s"} before continuing.`,
      );
      return;
    }
    setTextTutorLoading(periodChoice);
    setError(null);
    try {
      const res = await fetch("/api/scholars/text-tutor/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          period: periodChoice,
          ...(selectedChildIds.length > 0
            ? { child_user_ids: selectedChildIds }
            : {}),
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
          planKey: `scholars_text_tutor_${periodChoice}`,
        });
        return;
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout");
      }
      globalThis.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setTextTutorLoading(null);
    }
  }

  async function checkout() {
    if (!canCheckout) {
      if (childCount > 0 && selectedChildIds.length !== childCount) {
        setError(
          `Select ${childCount} child login${childCount === 1 ? "" : "s"} before continuing.`,
        );
      }
      return;
    }
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
          ...(selectedChildIds.length > 0
            ? { child_user_ids: selectedChildIds }
            : {}),
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
  }> = (
    [
      {
        id: "refill" as const,
        title: "Refill credits",
        subtitle: "Pay once · credits never expire",
      },
      {
        id: "monthly" as const,
        title: "Monthly",
        subtitle: "Refills every month · cancel anytime",
      },
      {
        id: "yearly" as const,
        title: "Yearly",
        subtitle: "Same monthly refill · billed once a year",
      },
    ] as const
  ).filter((opt) =>
    gens === 0 && mins === 0
      ? true
      : isScholarsCreditSkuAvailable(gens, mins, opt.id),
  );

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
          Add unlimited text tutor, then buy generations and realtime voice as
          separate purchases. Choose how many kids with the counter, then assign
          each seat to a child login — or leave on the parent pool. Set either
          meter to 0 to skip it.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border-2 border-[#007AFF]/30 bg-[#F0F7FF] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-semibold text-[#1d1d1f]">
            Unlimited AI (text tutor)
          </p>
          <span className="rounded-full bg-[#007AFF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Flat rate
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Type with the tutor unlimited — $14.99/mo or $99.99/yr. Realtime voice
          and generations below are separate meters.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                id: "monthly" as const,
                label: "Monthly",
                subtitle: "Cancel anytime",
              },
              {
                id: "yearly" as const,
                label: "Yearly",
                subtitle: "$8.33/mo effective",
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={textTutorLoading != null || loading}
              onClick={() => checkoutTextTutor(opt.id)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-[#007AFF] hover:shadow-md disabled:opacity-40"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-neutral-500">
                  {opt.label}
                </p>
                {opt.id === "yearly" ? (
                  <span className="rounded-full bg-[#007AFF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#007AFF]">
                    Best value
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-[#1d1d1f]">
                {textTutorLoading === opt.id
                  ? "Starting…"
                  : scholarsTextTutorPriceLine(opt.id)}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">{opt.subtitle}</p>
            </button>
          ))}
        </div>
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
                clampTutorMinutes(
                  v - scholarsCreditPricing.tutorMinutes.step,
                  gens,
                ),
              )
            }
            onInc={() =>
              setTutorMinutes((v) =>
                clampTutorMinutes(
                  v + scholarsCreditPricing.tutorMinutes.step,
                  gens,
                ),
              )
            }
            footer="Steps of 15 · 0 = skip"
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

      {kids.length > 0 && (
        <div className="mt-5 space-y-3">
          <StepperCard
            label="Children"
            hint="How many child logins get Scholars unlocked and these credits"
            amount={childCount}
            unit={childCount === 1 ? "child" : "children"}
            onDec={() =>
              setChildCount((current) => Math.max(0, current - 1))
            }
            onInc={() =>
              setChildCount((current) =>
                Math.min(maxAssignableKids, current + 1),
              )
            }
            footer={`0 = parent pool · up to ${maxAssignableKids}`}
          />

          {childCount > 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold text-[#1d1d1f]">
                Assign to child login
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Pick {childCount} login
                {childCount === 1 ? "" : "s"}. Each selected kid gets this
                purchase on their wallet when payment completes.
              </p>
              <div className="mt-3 space-y-2">
                {kids.map((kid) => {
                  const selected = selectedChildIds.includes(kid.id);
                  const atCap =
                    !selected && selectedChildIds.length >= childCount;
                  const label =
                    kid.display_name ||
                    kid.full_name ||
                    kid.username ||
                    "Child";
                  return (
                    <button
                      key={kid.id}
                      type="button"
                      disabled={atCap}
                      onClick={() =>
                        setSelectedChildIds((prev) => {
                          if (selected) {
                            return prev.filter((id) => id !== kid.id);
                          }
                          if (prev.length >= childCount) return prev;
                          return [...prev, kid.id];
                        })
                      }
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition disabled:opacity-40 ${
                        selected
                          ? "border-[#007AFF] bg-[#F0F7FF]"
                          : "border-neutral-200 bg-white hover:border-neutral-300"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#1d1d1f]">
                          {label}
                        </span>
                        {kid.username ? (
                          <span className="mt-0.5 block text-xs text-neutral-500">
                            @{kid.username}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          selected
                            ? "border-[#007AFF] bg-[#007AFF] text-white"
                            : "border-neutral-300"
                        }`}
                        aria-hidden
                      >
                        {selected ? (
                          <svg
                            viewBox="0 0 12 12"
                            className="h-3 w-3"
                            fill="none"
                          >
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
                    </button>
                  );
                })}
              </div>
              {selectedChildIds.length < childCount ? (
                <p className="mt-3 text-xs font-medium text-amber-700">
                  Select {childCount - selectedChildIds.length} more login
                  {childCount - selectedChildIds.length === 1 ? "" : "s"} to
                  continue.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-[#f7f8fc] px-4 py-3">
              <p className="text-sm font-medium text-[#1d1d1f]">Parent pool</p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                Credits stay on your parent account until you assign them to a
                child login later.
              </p>
            </div>
          )}
        </div>
      )}

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
            {periodLabel(period)} ·{" "}
            {childCount > 0
              ? `${selectedChildIds.length}/${childCount} kid${
                  childCount === 1 ? "" : "s"
                }`
              : "Parent pool"}
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
