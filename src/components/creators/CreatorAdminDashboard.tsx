"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CreatorCommission, GenlynCreator } from "@/lib/creators/store";
import { Blobs } from "@/components/site/ui";

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CreatorAdminDashboard() {
  const [creators, setCreators] = useState<GenlynCreator[]>([]);
  const [commissions, setCommissions] = useState<CreatorCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/creators/admin");
      const data = (await res.json()) as {
        creators?: GenlynCreator[];
        commissions?: CreatorCommission[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Forbidden");
        return;
      }
      setCreators(data.creators ?? []);
      setCommissions(data.commissions ?? []);
    }
    load().finally(() => setLoading(false));
  }, []);

  const totalCommission = commissions.reduce(
    (sum, row) => sum + row.commission_cents,
    0,
  );
  const totalTransferred = commissions
    .filter((row) => row.status === "transferred")
    .reduce((sum, row) => sum + row.commission_cents, 0);

  return (
    <div className="relative -mt-[68px] min-h-screen pt-[68px]">
      <Blobs intensity={0.4} />
      <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
          Admin
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold text-ink">
          Creator program
        </h1>
        <p className="mt-3 text-ink-soft">
          All creators, referrals volume, and commission transfers.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/admin/hub-orders"
            className="font-bold text-ink underline underline-offset-4"
          >
            Hub orders
          </Link>
        </p>

        {error && (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-10 text-sm text-ink-faint">Loading…</p>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Card label="Creators" value={String(creators.length)} />
              <Card label="Commission accrued" value={money(totalCommission)} />
              <Card label="Transferred" value={money(totalTransferred)} />
            </div>

            <h2 className="font-display mt-12 text-2xl font-extrabold text-ink">
              Creators
            </h2>
            <div className="mt-4 overflow-x-auto rounded-[28px] bg-white ring-1 ring-ink/5">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink/5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                  <tr>
                    <th className="px-5 py-4">Code</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Referrals</th>
                    <th className="px-5 py-4">Earned</th>
                    <th className="px-5 py-4">Paid</th>
                    <th className="px-5 py-4">Payouts</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((creator) => (
                    <tr key={creator.id} className="border-b border-ink/5 last:border-0">
                      <td className="px-5 py-4 font-extrabold tracking-wider text-ink">
                        {creator.code}
                      </td>
                      <td className="px-5 py-4 capitalize text-ink-soft">
                        {creator.status}
                      </td>
                      <td className="px-5 py-4 text-ink">
                        {creator.total_referred_users}
                      </td>
                      <td className="px-5 py-4 text-ink">
                        {money(Number(creator.total_commission_cents))}
                      </td>
                      <td className="px-5 py-4 text-ink">
                        {money(Number(creator.total_paid_cents))}
                      </td>
                      <td className="px-5 py-4 text-ink-soft">
                        {creator.payouts_enabled ? "Ready" : "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="font-display mt-12 text-2xl font-extrabold text-ink">
              Recent commissions
            </h2>
            <div className="mt-4 space-y-3">
              {commissions.slice(0, 50).map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 ring-1 ring-ink/5"
                >
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {money(row.commission_cents)} · {row.source}
                    </p>
                    <p className="text-xs text-ink-faint">
                      Creator {row.creator_id.slice(0, 8)}… · {row.status}
                      {row.stripe_transfer_id
                        ? ` · ${row.stripe_transfer_id}`
                        : ""}
                    </p>
                  </div>
                  <p className="text-xs text-ink-faint">
                    {new Date(row.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] bg-white p-5 ring-1 ring-ink/5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </p>
      <p className="font-display mt-2 text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}
