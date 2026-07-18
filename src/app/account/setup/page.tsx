"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSignupAccountType, readSignupAccountType } from "@/lib/auth/signup";
import type { AccountType } from "@/lib/auth/types";

function setupStepsFor(accountType: AccountType | null) {
  if (accountType === "individual") {
    return [
      "Creating account",
      "Setting up your profile",
      "Preparing your apps",
      "Finishing setup...",
    ];
  }

  return [
    "Creating account",
    "Setting up your family",
    "Preparing your apps",
    "Finishing setup...",
  ];
}

export default function AccountSetupPage() {
  const router = useRouter();
  const [accountType] = useState<AccountType | null>(() =>
    typeof window === "undefined" ? null : readSignupAccountType(),
  );
  const setupSteps = setupStepsFor(accountType);
  const [activeStep, setActiveStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const timers = setupSteps.map((_, index) =>
      window.setTimeout(() => setActiveStep(index), index * 500),
    );
    const doneTimer = window.setTimeout(() => setComplete(true), 2100);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(doneTimer);
    };
  }, [retryKey, setupSteps]);

  useEffect(() => {
    let cancelled = false;

    async function finishSetup() {
      setError(null);

      try {
        const accountType = readSignupAccountType();
        const response = await fetch("/api/account/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountType ? { accountType } : {}),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string };

        if (!cancelled && !data.ok) {
          setError(data.error ?? "Your account setup needs one more moment.");
        }

        if (!cancelled) {
          clearSignupAccountType();
        }
      } catch {
        if (!cancelled) {
          setError("Your account setup needs one more moment.");
        }
      }
    }

    finishSetup();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  useEffect(() => {
    if (!complete) return;

    const timer = window.setTimeout(() => {
      router.replace("/account");
      router.refresh();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [complete, router]);

  function retrySetup() {
    setActiveStep(0);
    setComplete(false);
    setError(null);
    setRetryKey((key) => key + 1);
  }

  if (error && complete) {
    return <SetupRecoveryCard message={error} onRetry={retrySetup} />;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] overflow-hidden bg-[#f7f5f1] px-4 py-12 text-neutral-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.95),transparent_38%),radial-gradient(circle_at_15%_20%,rgba(34,197,94,0.14),transparent_28%),radial-gradient(circle_at_85%_25%,rgba(59,130,246,0.12),transparent_26%)]" />

      <section className="relative mx-auto flex min-h-[calc(100vh-10rem)] max-w-2xl flex-col items-center justify-center text-center">
        <div
          className={`grid h-28 w-28 place-items-center rounded-full bg-emerald-500 shadow-[0_24px_80px_rgba(16,185,129,0.35)] transition-all duration-700 ${
            complete ? "scale-100 opacity-100" : "scale-90 opacity-95"
          }`}
        >
          <svg
            viewBox="0 0 64 64"
            aria-hidden
            className="h-16 w-16 text-white"
          >
            <path
              d="M18 33.5 27.5 43 47 21"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="7"
              className="[stroke-dasharray:64] [stroke-dashoffset:0]"
            />
          </svg>
        </div>

        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Account Ready
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-6xl">
            Welcome to Future Kids!
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Your account has been created successfully.
          </p>
        </div>

        <div className="mt-10 w-full max-w-md rounded-[2rem] border border-white/70 bg-white/80 p-5 text-left shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="space-y-3">
            {setupSteps.map((step, index) => {
              const isVisible = index <= activeStep || complete;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-500 ${
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                  }`}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
                    ✓
                  </span>
                  <span className="text-sm font-medium text-neutral-800">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function SetupRecoveryCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f7f5f1] px-4 py-16">
      <section className="mx-auto flex min-h-[60vh] max-w-xl items-center">
        <div className="w-full rounded-[2rem] border border-neutral-200/80 bg-white p-8 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-2xl text-amber-700">
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-950">
            We&apos;re almost finished setting up your account.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">
            Your Future Kids sign-in worked, but a few account details are still being prepared.
            This can happen right after a new signup. {message}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Retry Setup
            </button>
            <Link
              href="/"
              className="rounded-full border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Return Home
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
