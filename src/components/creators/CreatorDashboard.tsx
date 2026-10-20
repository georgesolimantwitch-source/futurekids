"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { CREATOR_COMMISSION_RATE } from "@/config/creators";
import type {
  CreatorCommission,
  CreatorReferral,
  GenlynCreator,
} from "@/lib/creators/store";
import { Blobs } from "@/components/site/ui";

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CreatorDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [creator, setCreator] = useState<GenlynCreator | null>(null);
  const [referrals, setReferrals] = useState<CreatorReferral[]>([]);
  const [commissions, setCommissions] = useState<CreatorCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [codeDraft, setCodeDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/creators/me");
    if (res.status === 401) {
      router.replace("/login?next=/creator");
      return;
    }
    const data = (await res.json()) as {
      creator?: GenlynCreator | null;
      referrals?: CreatorReferral[];
      commissions?: CreatorCommission[];
      error?: string;
    };
    if (!res.ok) {
      setError(data.error ?? "Could not load creator dashboard");
      return;
    }
    setCreator(data.creator ?? null);
    setReferrals(data.referrals ?? []);
    setCommissions(data.commissions ?? []);
    if (data.creator?.code) setCodeDraft(data.creator.code);
  }, [router]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const connect = searchParams.get("connect");
    if (connect === "return" || connect === "refresh") {
      void fetch("/api/creators/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      }).then(() => load());
    }
  }, [searchParams, load]);

  async function join(event: FormEvent) {
    event.preventDefault();
    setJoining(true);
    setError(null);
    try {
      const res = await fetch("/api/creators/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          code: codeDraft || undefined,
        }),
      });
      const data = (await res.json()) as {
        onboardingUrl?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not join");
      if (data.onboardingUrl) {
        window.location.assign(data.onboardingUrl);
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setJoining(false);
    }
  }

  async function continueConnect() {
    setJoining(true);
    setError(null);
    try {
      const res = await fetch("/api/creators/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      const data = (await res.json()) as {
        onboardingUrl?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not open payouts");
      if (data.onboardingUrl) window.location.assign(data.onboardingUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open payouts");
    } finally {
      setJoining(false);
    }
  }

  function copyCode() {
    if (!creator?.code) return;
    void navigator.clipboard.writeText(creator.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (loading) {
    return (
      <Shell>
        <p className="text-sm text-ink-faint">Loading…</p>
      </Shell>
    );
  }

  if (!creator) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Creator program
          </p>
          <h1 className="font-display mt-3 text-4xl font-extrabold text-ink sm:text-5xl">
            Become a Genlyn creator
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            Share your short code. Earn{" "}
            <span className="font-extrabold text-ink">
              {Math.round(CREATOR_COMMISSION_RATE * 100)}%
            </span>{" "}
            of every Hub purchase and every subscription payment from people who
            use it — paid out through Stripe.
          </p>
          <form
            onSubmit={join}
            className="mt-8 space-y-4 rounded-[32px] bg-white p-6 shadow-[0_40px_90px_-44px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 sm:p-8"
          >
            <label className="block">
              <span className="text-xs font-bold text-ink-soft">
                Pick a short code (optional)
              </span>
              <input
                value={codeDraft}
                onChange={(e) =>
                  setCodeDraft(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  )
                }
                placeholder="e.g. MAYA"
                maxLength={6}
                className="mt-1.5 w-full rounded-2xl bg-[#f7f8fc] px-4 py-3 text-lg font-extrabold tracking-wider text-ink outline-none ring-1 ring-ink/[0.06] focus:bg-white focus:ring-2 focus:ring-brand/40"
              />
            </label>
            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={joining}
              className="shine press w-full rounded-full bg-ink py-3.5 text-sm font-bold text-white hover:bg-black disabled:opacity-60"
            >
              {joining ? "Starting…" : "Become a creator"}
            </button>
            <p className="text-xs leading-relaxed text-ink-faint">
              Next you’ll add your bank details on a short Stripe form (Global
              Payouts) so commissions can land in your account — no full Stripe
              business account needed.
            </p>
          </form>
        </div>
      </Shell>
    );
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pricing?creator_code=${creator.code}`
      : `https://genlyn.app/pricing?creator_code=${creator.code}`;

  return (
    <Shell>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
              Creator dashboard
            </p>
            <h1 className="font-display mt-3 text-4xl font-extrabold text-ink">
              {creator.display_name || "Your creator hub"}
            </h1>
            <p className="mt-2 text-ink-soft">
              Status:{" "}
              <span className="font-bold capitalize text-ink">{creator.status}</span>
              {creator.payouts_enabled ? " · Payouts ready" : " · Finish payout setup"}
            </p>
          </div>
          {!creator.payouts_enabled && (
            <button
              type="button"
              onClick={() => void continueConnect()}
              disabled={joining}
              className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {joining ? "Opening…" : "Add bank details"}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-10 rounded-[32px] bg-ink p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
            Your code
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <p className="font-display text-5xl font-extrabold tracking-[0.12em]">
              {creator.code}
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink"
            >
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
          <p className="mt-4 break-all text-sm text-white/70">{shareUrl}</p>
          <p className="mt-2 text-sm text-white/60">
            Share this link or code at checkout — you earn{" "}
            {Math.round(CREATOR_COMMISSION_RATE * 100)}% of Hub sales and
            subscription payments while they’re attributed to you.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="People used your code" value={String(creator.total_referred_users)} />
          <Stat label="Commission earned" value={money(Number(creator.total_commission_cents))} />
          <Stat label="Paid out" value={money(Number(creator.total_paid_cents))} />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Referrals
            </h2>
            <div className="mt-4 space-y-3">
              {referrals.length === 0 ? (
                <p className="text-sm text-ink-soft">No one has used your code yet.</p>
              ) : (
                referrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="rounded-2xl bg-white px-4 py-3 ring-1 ring-ink/5"
                  >
                    <p className="text-sm font-bold text-ink">
                      Buyer · {ref.buyer_user_id.slice(0, 8)}…
                    </p>
                    <p className="text-xs text-ink-faint">
                      {new Date(ref.created_at).toLocaleDateString()} ·{" "}
                      {ref.source || "checkout"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Commissions
            </h2>
            <div className="mt-4 space-y-3">
              {commissions.length === 0 ? (
                <p className="text-sm text-ink-soft">No commissions yet.</p>
              ) : (
                commissions.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-2xl bg-white px-4 py-3 ring-1 ring-ink/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">
                          {money(row.commission_cents)}{" "}
                          <span className="font-medium text-ink-faint">
                            of {money(row.gross_cents)}
                          </span>
                        </p>
                        <p className="text-xs capitalize text-ink-faint">
                          {row.source} · {row.status}
                        </p>
                      </div>
                      <span className="text-xs text-ink-faint">
                        {new Date(row.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <p className="mt-10 text-sm text-ink-soft">
          Need help?{" "}
          <Link href="/contact" className="font-bold text-ink underline underline-offset-4">
            Contact support
          </Link>
        </p>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] bg-white p-5 ring-1 ring-ink/5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </p>
      <p className="font-display mt-2 text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mt-[68px] min-h-screen overflow-hidden pt-[68px]">
      <Blobs intensity={0.5} />
      <div className="relative px-5 py-12 sm:px-8 sm:py-16">{children}</div>
    </div>
  );
}
