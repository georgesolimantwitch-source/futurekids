"use client";

import { useCallback, useEffect, useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import type { KidAppKey, KidSummary } from "@/lib/kids/types";

function appAccessEnabled(child: KidSummary, appKey: KidAppKey): boolean {
  return child.apps.find((a) => a.app_key === appKey)?.status === "active";
}

function appAccessUnavailable(child: KidSummary, appKey: KidAppKey): boolean {
  const access = child.apps.find((a) => a.app_key === appKey);
  return !access?.parent_has_entitlement || access.status === "unavailable";
}

export function AppKidsManager({
  appKey,
  appName,
  accent,
  open,
  onClose,
}: {
  appKey: KidAppKey;
  appName: string;
  accent: string;
  open: boolean;
  onClose: () => void;
}) {
  const [children, setChildren] = useState<KidSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    password: "",
    date_of_birth: "",
    confirmed: false,
  });
  const [busyChildId, setBusyChildId] = useState<string | null>(null);
  const [resetChild, setResetChild] = useState<KidSummary | null>(null);
  const [removeChild, setRemoveChild] = useState<KidSummary | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [scholarsSeatLimit, setScholarsSeatLimit] = useState(1);
  const [parentPool, setParentPool] = useState({
    generations: 0,
    tutor_minutes: 0,
  });
  const [transferTarget, setTransferTarget] = useState<KidSummary | null>(null);
  const [transferFromId, setTransferFromId] = useState("");
  const [balances, setBalances] = useState<
    Record<string, { generations: number; tutor_minutes: number }>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kids");
      const data = (await res.json()) as {
        ok?: boolean;
        children?: KidSummary[];
        scholarsSeatLimit?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not load kids.");
        setChildren([]);
        setBalances({});
        setParentPool({ generations: 0, tutor_minutes: 0 });
        return;
      }
      const kids = data.children ?? [];
      setChildren(kids);
      if (typeof data.scholarsSeatLimit === "number") {
        setScholarsSeatLimit(Math.max(1, data.scholarsSeatLimit));
      }

      if (appKey === "scholars") {
        try {
          const poolRes = await fetch("/api/scholars/usage/balance?pool=1");
          if (poolRes.ok) {
            const pool = (await poolRes.json()) as {
              generations?: number;
              tutor_minutes?: number;
            };
            setParentPool({
              generations: pool.generations ?? 0,
              tutor_minutes: pool.tutor_minutes ?? 0,
            });
          } else {
            setParentPool({ generations: 0, tutor_minutes: 0 });
          }
        } catch {
          setParentPool({ generations: 0, tutor_minutes: 0 });
        }

        if (kids.length > 0) {
          const entries = await Promise.all(
            kids.map(async (kid) => {
              try {
                const balRes = await fetch(
                  `/api/scholars/usage/balance?childId=${encodeURIComponent(kid.id)}`,
                );
                if (!balRes.ok) {
                  return [kid.id, { generations: 0, tutor_minutes: 0 }] as const;
                }
                const bal = (await balRes.json()) as {
                  generations?: number;
                  tutor_minutes?: number;
                };
                return [
                  kid.id,
                  {
                    generations: bal.generations ?? 0,
                    tutor_minutes: bal.tutor_minutes ?? 0,
                  },
                ] as const;
              } catch {
                return [kid.id, { generations: 0, tutor_minutes: 0 }] as const;
              }
            }),
          );
          setBalances(Object.fromEntries(entries));
        } else {
          setBalances({});
        }
      } else {
        setBalances({});
        setParentPool({ generations: 0, tutor_minutes: 0 });
      }
    } catch {
      setError("Could not load kids.");
    } finally {
      setLoading(false);
    }
  }, [appKey]);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

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
          enabled_apps: [appKey],
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not add this kid.");
        return;
      }
      setShowCreate(false);
      setForm({
        full_name: "",
        username: "",
        password: "",
        date_of_birth: "",
        confirmed: false,
      });
      await load();
    } catch {
      setError("Could not add this kid.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleAppAccess(
    child: KidSummary,
    enabled: boolean,
    transferFromChildId?: string,
  ) {
    setBusyChildId(child.id);
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
        if (
          enabled &&
          appKey === "scholars" &&
          data.code === "SCHOLARS_SEAT_FULL"
        ) {
          const donors = children.filter(
            (c) => c.id !== child.id && appAccessEnabled(c, "scholars"),
          );
          setTransferTarget(child);
          setTransferFromId(donors[0]?.id ?? "");
          setError(
            data.error ??
              "All Scholars seats are in use. Choose a child to transfer the seat and AI credits from.",
          );
          return;
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
      setBusyChildId(null);
    }
  }

  async function confirmScholarsTransfer() {
    if (!transferTarget || !transferFromId) return;
    await toggleAppAccess(transferTarget, true, transferFromId);
  }

  async function toggleLogin(child: KidSummary, enable: boolean) {
    setBusyChildId(child.id);
    setError(null);
    try {
      const res = await fetch("/api/kids/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: enable ? "enable_login" : "disable_login",
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
        body: JSON.stringify({
          action: "remove_child",
          child_id: removeChild.id,
        }),
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/45 px-4 py-8 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-kids-title"
        className="max-h-full w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
              Manage kids
            </p>
            <h2
              id="app-kids-title"
              className="mt-1 text-xl font-semibold tracking-tight text-neutral-950"
            >
              {appName}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Choose which kids can use {appName}. Unlock or pause access per
              child without changing other apps.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close manage kids"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl font-light text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          {error && (
            <p
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          {appKey === "scholars" && (
            <p className="rounded-xl border border-neutral-200 bg-[#f5f5f7] px-4 py-3 text-sm text-neutral-700">
              Scholars seats:{" "}
              <span className="font-semibold tabular-nums text-neutral-950">
                {
                  children.filter((child) => appAccessEnabled(child, "scholars"))
                    .length
                }
                /{scholarsSeatLimit}
              </span>
              . Buy AI credits on Pricing — they land on your parent account.
              Unlock a kid to assign them; lock a kid to return credits to your
              pool. Transfer between kids when seats are full.
            </p>
          )}

          {appKey === "scholars" &&
            (parentPool.generations > 0 || parentPool.tutor_minutes > 0) && (
              <div className="rounded-2xl border border-[#007AFF]/30 bg-[#007AFF]/08 px-4 py-4">
                <p className="text-sm font-semibold text-[#1d1d1f]">
                  Unassigned AI credits
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  These credits are on your parent account. Unlock a child below
                  to assign them.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white px-3 py-3 text-center shadow-sm">
                    <p className="text-xs font-medium text-neutral-500">
                      Generations
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-[#1d1d1f]">
                      {parentPool.generations}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3 text-center shadow-sm">
                    <p className="text-xs font-medium text-neutral-500">
                      Tutor minutes
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-[#1d1d1f]">
                      {parentPool.tutor_minutes}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {transferTarget && appKey === "scholars" && (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-sm font-medium text-amber-950">
                Transfer Scholars seat to{" "}
                {transferTarget.display_name ||
                  transferTarget.full_name ||
                  transferTarget.username ||
                  "this child"}
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
                        child.id !== transferTarget.id &&
                        appAccessEnabled(child, "scholars"),
                    )
                    .map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.display_name ||
                          child.full_name ||
                          child.username ||
                          "Child"}
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
                  disabled={!transferFromId || busyChildId === transferTarget.id}
                  onClick={() => void confirmScholarsTransfer()}
                  className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                >
                  Transfer seat
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-neutral-900">Kids on this account</p>
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="rounded-full px-4 py-2 text-xs font-medium text-white"
              style={{ backgroundColor: accent }}
            >
              {showCreate ? "Cancel" : "Add kid"}
            </button>
          </div>

          {showCreate && (
            <form
              onSubmit={handleCreate}
              autoComplete="off"
              className="space-y-4 rounded-2xl border border-neutral-200 bg-[#fefbf6] p-4"
            >
              <p className="text-xs text-neutral-600">
                New kids start with {appName} unlocked. Turn on other apps from
                each app&apos;s Manage kids button.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-neutral-800">Child name</span>
                  <input
                    required
                    name="child_full_name"
                    autoComplete="off"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, full_name: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
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
                      onChange={(value) =>
                        setForm((f) => ({ ...f, password: value }))
                      }
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, confirmed: e.target.checked }))
                  }
                  className="mt-1"
                  required
                />
                <span>
                  I manage this child account and will keep their login secure.
                </span>
              </label>

              <button
                type="submit"
                disabled={creating}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: accent }}
              >
                {creating ? "Adding…" : `Add kid to ${appName}`}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-neutral-500">Loading kids…</p>
            ) : children.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 px-5 py-8 text-center">
                <p className="text-sm font-medium text-neutral-900">No kids yet</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Add a kid with a username and password, then unlock {appName}{" "}
                  for them.
                </p>
              </div>
            ) : (
              children.map((child) => {
                const enabled = appAccessEnabled(child, appKey);
                const unavailable = appAccessUnavailable(child, appKey);
                const busy = busyChildId === child.id;
                const balance = balances[child.id];

                return (
                  <article
                    key={child.id}
                    className="rounded-2xl border border-neutral-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-neutral-950">
                          {child.display_name || child.full_name || "Child"}
                        </h3>
                        <p className="mt-0.5 text-sm text-neutral-600">
                          @{child.username ?? "—"} ·{" "}
                          {child.is_active ? (
                            <span className="text-emerald-700">Login active</span>
                          ) : (
                            <span className="text-amber-700">Login paused</span>
                          )}
                        </p>
                      </div>

                      <label className="inline-flex items-center gap-2 text-sm font-medium text-neutral-800">
                        <span className="sr-only">
                          {enabled ? "Disable" : "Enable"} {appName} for{" "}
                          {child.display_name || child.username}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          disabled={busy || unavailable || !child.is_active}
                          onClick={() => toggleAppAccess(child, !enabled)}
                          className="relative h-7 w-12 rounded-full transition disabled:opacity-40"
                          style={{
                            backgroundColor: enabled ? accent : "#e5e5e5",
                          }}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                              enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span className="min-w-[4.5rem] text-xs text-neutral-600">
                          {unavailable
                            ? "Subscribe first"
                            : enabled
                              ? "Unlocked"
                              : "Locked"}
                        </span>
                      </label>
                    </div>

                    {appKey === "scholars" && (
                      <div className="mt-4 rounded-2xl border border-neutral-200 bg-[#f5f5f7] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-[#1d1d1f]">
                            Current live AI balance
                          </p>
                          <a
                            href={`/pricing?app=scholars&childId=${encodeURIComponent(child.id)}`}
                            className="shrink-0 text-xs font-medium text-[#007AFF] hover:underline"
                          >
                            Buy credits
                          </a>
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-neutral-500">
                          Remaining credits for this child right now.
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-white px-3 py-3 text-center shadow-sm">
                            <p className="text-xs font-medium text-neutral-500">
                              Current live generations
                            </p>
                            <p className="mt-1 text-3xl font-bold tabular-nums text-[#1d1d1f]">
                              {balance?.generations ?? 0}
                            </p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-3 text-center shadow-sm">
                            <p className="text-xs font-medium text-neutral-500">
                              Current live tutor minutes
                            </p>
                            <p className="mt-1 text-3xl font-bold tabular-nums text-[#1d1d1f]">
                              {balance?.tutor_minutes ?? 0}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-center text-[11px] leading-snug text-neutral-500">
                          Refill credits never expire. Monthly and yearly plans
                          refill the same amounts each month.
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
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
                        onClick={() => toggleLogin(child, !child.is_active)}
                        className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        {child.is_active ? "Disable login" : "Enable login"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setRemoveChild(child)}
                        className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Remove child
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {resetChild && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-4">
          <form
            onSubmit={submitPasswordReset}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-neutral-950">
              Reset password
            </h3>
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
                {removeChild.display_name || removeChild.full_name || "this child"}
              </span>
              {removeChild.username ? ` (@${removeChild.username})` : ""} and
              removes their login across every Genlyn app. This cannot be undone.
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
                onClick={confirmRemoveChild}
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
