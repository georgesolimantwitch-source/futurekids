"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { apps } from "@/config/brand";
import { KID_APPS, type KidAppKey, type KidSummary } from "@/lib/kids/types";

type CreditBalance = { generations: number; tutor_minutes: number };

const APP_META = KID_APPS.map((appKey) => {
  const brandApp = apps.find((a) => a.slug === appKey)!;
  return {
    appKey,
    name: brandApp.name,
    icon: brandApp.iconPath,
    accent: brandApp.accentColor,
  };
});

const EMPTY_FORM = {
  full_name: "",
  username: "",
  password: "",
  date_of_birth: "",
  confirmed: false,
};

function kidName(child: KidSummary): string {
  return child.display_name || child.full_name || child.username || "Child";
}

function appEnabled(child: KidSummary, appKey: KidAppKey): boolean {
  return child.apps.find((a) => a.app_key === appKey)?.status === "active";
}

function parentSubscribed(child: KidSummary, appKey: KidAppKey): boolean {
  return child.apps.find((a) => a.app_key === appKey)?.parent_has_entitlement === true;
}

export function FamilyKidsSection() {
  const [children, setChildren] = useState<KidSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busyToggle, setBusyToggle] = useState<string | null>(null);
  const [busyChildId, setBusyChildId] = useState<string | null>(null);
  const [resetChild, setResetChild] = useState<KidSummary | null>(null);
  const [removeChild, setRemoveChild] = useState<KidSummary | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [scholarsSeatLimit, setScholarsSeatLimit] = useState(1);
  const [parentPool, setParentPool] = useState<CreditBalance>({
    generations: 0,
    tutor_minutes: 0,
  });
  const [balances, setBalances] = useState<Record<string, CreditBalance>>({});
  const [transferTarget, setTransferTarget] = useState<KidSummary | null>(null);
  const [transferFromId, setTransferFromId] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/kids");
      const data = (await res.json()) as {
        children?: KidSummary[];
        scholarsSeatLimit?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not load kids.");
        setChildren([]);
        return;
      }

      const kids = data.children ?? [];
      setChildren(kids);
      if (typeof data.scholarsSeatLimit === "number") {
        setScholarsSeatLimit(Math.max(1, data.scholarsSeatLimit));
      }

      const scholarsAvailable = kids.some((kid) =>
        parentSubscribed(kid, "scholars"),
      );
      if (!scholarsAvailable) {
        setParentPool({ generations: 0, tutor_minutes: 0 });
        setBalances({});
        return;
      }

      const [pool, entries] = await Promise.all([
        fetchBalance("/api/scholars/usage/balance?pool=1"),
        Promise.all(
          kids.map(
            async (kid) =>
              [
                kid.id,
                await fetchBalance(
                  `/api/scholars/usage/balance?childId=${encodeURIComponent(kid.id)}`,
                ),
              ] as const,
          ),
        ),
      ]);
      setParentPool(pool);
      setBalances(Object.fromEntries(entries));
    } catch {
      setError("Could not load kids.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          username: form.username,
          password: form.password,
          date_of_birth: form.date_of_birth,
          parent_manages_confirmed: form.confirmed,
          enabled_apps: [],
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not add this kid.");
        return;
      }
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await load();
    } catch {
      setError("Could not add this kid.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleApp(
    child: KidSummary,
    appKey: KidAppKey,
    enabled: boolean,
    transferFromChildId?: string,
  ) {
    setBusyToggle(`${child.id}:${appKey}`);
    setError(null);
    try {
      const res = await fetch("/api/kids/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_app_access",
          child_id: child.id,
          app_key: appKey,
          enabled,
          ...(transferFromChildId
            ? { transfer_from_child_id: transferFromChildId }
            : {}),
        }),
      });
      const data = (await res.json()) as { error?: string; code?: string };
      if (!res.ok) {
        if (enabled && appKey === "scholars" && data.code === "SCHOLARS_SEAT_FULL") {
          const donors = children.filter(
            (c) => c.id !== child.id && appEnabled(c, "scholars"),
          );
          setTransferTarget(child);
          setTransferFromId(donors[0]?.id ?? "");
        }
        setError(data.error ?? "Could not update app access.");
        return;
      }
      setTransferTarget(null);
      setTransferFromId("");
      await load();
    } catch {
      setError("Could not update app access.");
    } finally {
      setBusyToggle(null);
    }
  }

  async function toggleLogin(child: KidSummary) {
    setBusyChildId(child.id);
    setError(null);
    try {
      const res = await fetch("/api/kids/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: child.is_active ? "disable_login" : "enable_login",
          child_id: child.id,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not update login.");
        return;
      }
      await load();
    } catch {
      setError("Could not update login.");
    } finally {
      setBusyChildId(null);
    }
  }

  async function submitPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetChild) return;
    setBusyChildId(resetChild.id);
    setError(null);
    try {
      const res = await fetch("/api/kids/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          child_id: resetChild.id,
          new_password: newPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not reset password.");
        return;
      }
      setResetChild(null);
      setNewPassword("");
    } catch {
      setError("Could not reset password.");
    } finally {
      setBusyChildId(null);
    }
  }

  async function confirmRemoveChild() {
    if (!removeChild) return;
    setBusyChildId(removeChild.id);
    setError(null);
    try {
      const res = await fetch("/api/kids/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_child", child_id: removeChild.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not remove this child.");
        return;
      }
      setRemoveChild(null);
      await load();
    } catch {
      setError("Could not remove this child.");
    } finally {
      setBusyChildId(null);
    }
  }

  const scholarsAvailable = children.some((kid) =>
    parentSubscribed(kid, "scholars"),
  );
  const scholarsSeatsUsed = children.filter((kid) =>
    appEnabled(kid, "scholars"),
  ).length;

  return (
    <div className="mt-6 overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-neutral-100 bg-[#fefbf6] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900">Kids on this account</p>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Add kids any time — a subscription isn&apos;t required. A kid can only
            sign in to an app once you have an active plan for it and switch that
            app on for them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex shrink-0 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          {showCreate ? "Cancel" : "Add kid"}
        </button>
      </div>

      <div className="space-y-5 px-6 py-6">
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {showCreate && (
          <form
            onSubmit={handleCreate}
            autoComplete="off"
            className="space-y-4 rounded-2xl border border-neutral-200 bg-[#fefbf6] p-5"
          >
            <p className="text-xs text-neutral-600">
              New kids start with every app switched off. Turn on the apps you
              want them to use once they&apos;re added.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-neutral-800">Child name</span>
                <input
                  required
                  name="child_full_name"
                  autoComplete="off"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                  placeholder="Alex"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-neutral-800">Username</span>
                <input
                  required
                  name="child_username"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-1p-ignore
                  data-lpignore="true"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                  placeholder="alexplays"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-neutral-800">Password</span>
                <div className="mt-1.5">
                  <PasswordInput
                    id="child_password"
                    name="child_password"
                    value={form.password}
                    onChange={(value) => setForm((f) => ({ ...f, password: value }))}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Letter + number, 8+ chars"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                  />
                </div>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-neutral-800">Date of birth</span>
                <input
                  required
                  name="child_date_of_birth"
                  type="date"
                  autoComplete="off"
                  value={form.date_of_birth}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date_of_birth: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                />
              </label>
            </div>

            <label className="flex items-start gap-3 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={form.confirmed}
                onChange={(e) => setForm((f) => ({ ...f, confirmed: e.target.checked }))}
                className="mt-1"
                required
              />
              <span>I manage this child account and will keep their login secure.</span>
            </label>

            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {creating ? "Adding…" : "Add kid"}
            </button>
          </form>
        )}

        {scholarsAvailable && (
          <p className="rounded-xl border border-neutral-200 bg-[#f5f5f7] px-4 py-3 text-sm text-neutral-700">
            Scholars seats:{" "}
            <span className="font-semibold tabular-nums text-neutral-950">
              {scholarsSeatsUsed}/{scholarsSeatLimit}
            </span>
            . AI credits land on your parent account and follow whichever kid
            holds the seat.
            {(parentPool.generations > 0 || parentPool.tutor_minutes > 0) && (
              <>
                {" "}
                Unassigned:{" "}
                <span className="font-semibold tabular-nums text-neutral-950">
                  {parentPool.generations} generations · {parentPool.tutor_minutes}{" "}
                  tutor minutes
                </span>
                .
              </>
            )}
          </p>
        )}

        {transferTarget && (
          <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm font-medium text-amber-950">
              Transfer a Scholars seat to {kidName(transferTarget)}
            </p>
            <label className="block text-xs font-medium text-amber-900">
              Move seat &amp; AI credits from
              <select
                value={transferFromId}
                onChange={(e) => setTransferFromId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                {children
                  .filter(
                    (child) =>
                      child.id !== transferTarget.id && appEnabled(child, "scholars"),
                  )
                  .map((child) => (
                    <option key={child.id} value={child.id}>
                      {kidName(child)}
                      {balances[child.id]
                        ? ` (${balances[child.id].generations} gen · ${balances[child.id].tutor_minutes} min)`
                        : ""}
                    </option>
                  ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTransferTarget(null);
                  setTransferFromId("");
                  setError(null);
                }}
                className="flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-950"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!transferFromId || busyToggle !== null}
                onClick={() =>
                  void toggleApp(transferTarget, "scholars", true, transferFromId)
                }
                className="flex-1 rounded-xl bg-neutral-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Transfer seat
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-neutral-500">Loading kids…</p>
        ) : children.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 px-5 py-10 text-center">
            <p className="text-sm font-medium text-neutral-900">No kids yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add a kid with their own username and password, then switch on the
              apps they&apos;re allowed to use.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map((child) => {
              const balance = balances[child.id];
              const scholarsOn = appEnabled(child, "scholars");
              const busy = busyChildId === child.id;

              return (
                <article
                  key={child.id}
                  className="rounded-[1.5rem] border border-neutral-200 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-neutral-950">
                        {kidName(child)}
                      </h4>
                      <p className="mt-0.5 text-sm text-neutral-600">
                        @{child.username ?? "—"} ·{" "}
                        {child.is_active ? (
                          <span className="text-emerald-700">Login active</span>
                        ) : (
                          <span className="text-amber-700">Login paused</span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setResetChild(child)}
                        className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleLogin(child)}
                        className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        {child.is_active ? "Pause login" : "Resume login"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setRemoveChild(child)}
                        className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {APP_META.map(({ appKey, name, icon, accent }) => {
                      const enabled = appEnabled(child, appKey);
                      const subscribed = parentSubscribed(child, appKey);
                      const toggleBusy = busyToggle === `${child.id}:${appKey}`;
                      const blocked = !subscribed || !child.is_active;

                      return (
                        <div
                          key={appKey}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-[#fefbf6] px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Image
                              src={icon}
                              alt=""
                              width={28}
                              height={28}
                              className="h-7 w-7 shrink-0"
                              aria-hidden
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-neutral-900">
                                {name}
                              </p>
                              <p className="truncate text-xs text-neutral-500">
                                {!subscribed ? (
                                  <Link
                                    href={`/pricing#${appKey}`}
                                    className="underline underline-offset-2"
                                  >
                                    Subscribe to unlock
                                  </Link>
                                ) : !child.is_active ? (
                                  "Login paused"
                                ) : enabled ? (
                                  "Can sign in"
                                ) : (
                                  "Cannot sign in"
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            aria-label={`${enabled ? "Disable" : "Enable"} ${name} for ${kidName(child)}`}
                            disabled={toggleBusy || blocked}
                            onClick={() => void toggleApp(child, appKey, !enabled)}
                            className="relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40"
                            style={{ backgroundColor: enabled ? accent : "#e5e5e5" }}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                                enabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {scholarsOn && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f5f5f7] px-4 py-3">
                      <p className="text-xs text-neutral-600">
                        Scholars AI credits:{" "}
                        <span className="font-semibold tabular-nums text-neutral-900">
                          {balance?.generations ?? 0} generations ·{" "}
                          {balance?.tutor_minutes ?? 0} tutor minutes
                        </span>
                      </p>
                      <Link
                        href={`/pricing?app=scholars&childId=${encodeURIComponent(child.id)}`}
                        className="text-xs font-medium text-[#007AFF] hover:underline"
                      >
                        Buy credits
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {resetChild && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-4">
          <form
            onSubmit={submitPasswordReset}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-neutral-950">Reset password</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Set a new password for @{resetChild.username}.
            </p>
            <PasswordInput
              id="reset_child_password"
              name="reset_child_password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Letter + number, 8+ chars"
              className="mt-4 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setResetChild(null);
                  setNewPassword("");
                }}
                className="rounded-full px-4 py-2 text-sm text-neutral-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyChildId === resetChild.id}
                className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Save password
              </button>
            </div>
          </form>
        </div>
      )}

      {removeChild && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-child-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
          >
            <h3
              id="remove-child-title"
              className="text-lg font-semibold text-neutral-950"
            >
              Remove child?
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              This permanently deletes{" "}
              <span className="font-medium text-neutral-900">
                {kidName(removeChild)}
              </span>
              {removeChild.username ? ` (@${removeChild.username})` : ""} and removes
              their login across every Genlyn app. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRemoveChild(null)}
                className="rounded-full px-4 py-2 text-sm text-neutral-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyChildId === removeChild.id}
                onClick={() => void confirmRemoveChild()}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busyChildId === removeChild.id ? "Removing…" : "Remove child"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function fetchBalance(url: string): Promise<CreditBalance> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { generations: 0, tutor_minutes: 0 };
    const data = (await res.json()) as Partial<CreditBalance>;
    return {
      generations: data.generations ?? 0,
      tutor_minutes: data.tutor_minutes ?? 0,
    };
  } catch {
    return { generations: 0, tutor_minutes: 0 };
  }
}
