"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { apps } from "@/config/brand";
import {
  formatAccountDate,
  initialsFromName,
} from "@/lib/auth/account-display";
import {
  buildAccountViewModel,
  countActiveApps,
  countActivePlans,
  entitlementForApp,
  REQUIRED_APP_IDS,
  SETUP_PENDING_MESSAGE,
} from "@/lib/auth/account-view";
import type {
  EcosystemAccount,
  EcosystemAppId,
  EntitlementStatus,
  UserEntitlement,
} from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "my-apps", label: "My Apps" },
  { id: "plans", label: "Plans & Billing" },
  { id: "family", label: "Family" },
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
] as const;

interface AccountDashboardProps {
  initialAccount: EcosystemAccount | null;
  authUser: User;
  emailVerified?: boolean;
  setupError?: string | null;
}

async function loadCanonicalAccount(): Promise<EcosystemAccount | null> {
  const supabase = createClient();
  const [accountResult, entitlementsResult, effectiveResult] = await Promise.all([
    supabase.rpc("get_ecosystem_account"),
    supabase
      .from("user_entitlements")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.rpc("get_effective_app_access"),
  ]);
  if (!accountResult.data) return null;
  const account = accountResult.data as EcosystemAccount;
  return {
    ...account,
    entitlements:
      (entitlementsResult.data as UserEntitlement[] | null) ??
      account.entitlements ??
      [],
    effective_access:
      (effectiveResult.data as EcosystemAccount["effective_access"] | null) ??
      [],
  };
}

export function AccountDashboard({
  initialAccount,
  authUser,
  emailVerified = false,
  setupError = null,
}: AccountDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const [rawAccount, setRawAccount] = useState(initialAccount);
  const [loading, setLoading] = useState(!initialAccount?.profile);
  const [signingOut, setSigningOut] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    if (initialAccount?.profile) return;

    async function load() {
      let data = await loadCanonicalAccount();

      if (!data?.profile) {
        await fetch("/api/account/setup", { method: "POST" });
        data = (await loadCanonicalAccount()) ?? data;
      }

      setRawAccount(data);
      setLoading(false);
    }

    load();
  }, [initialAccount]);

  useEffect(() => {
    if (!checkoutSuccess) return;
    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;

    async function refreshEntitlements() {
      const data = await loadCanonicalAccount();
      if (cancelled) return;
      if (data) setRawAccount(data as EcosystemAccount);

      attempts += 1;
      if (attempts < 5 && !(data as EcosystemAccount | null)?.entitlements?.length) {
        timer = window.setTimeout(refreshEntitlements, 1500);
      }
    }

    refreshEntitlements();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [checkoutSuccess]);

  useEffect(() => {
    if (!initialAccount?.profile?.stripe_customer_id || checkoutSuccess) return;
    let cancelled = false;
    async function reconcileStripe() {
      const response = await fetch("/api/subscriptions/stripe/reconcile", {
        method: "POST",
      });
      if (!response.ok || cancelled) return;
      const data = await loadCanonicalAccount();
      if (data && !cancelled) setRawAccount(data);
    }
    reconcileStripe();
    return () => {
      cancelled = true;
    };
  }, [checkoutSuccess, initialAccount?.profile?.stripe_customer_id]);

  const account = useMemo(
    () => buildAccountViewModel(rawAccount, authUser),
    [rawAccount, authUser],
  );

  const profile = account.profile!;
  const family = account.families[0];
  const members = account.family_members.filter((m) => m.family_id === family?.id);
  const activePlans = countActivePlans(account);
  const activeApps = countActiveApps(account);
  const showSetupBanner = Boolean(setupError) && !rawAccount?.profile;

  async function handleRepairSetup() {
    setRepairing(true);
    try {
      await fetch("/api/account/setup", { method: "POST" });
      const data = await loadCanonicalAccount();
      setRawAccount(data);
    } finally {
      setRepairing(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleOpenBillingPortal() {
    setOpeningPortal(true);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await response.json()) as { url?: string };
      if (response.ok && data.url) {
        globalThis.location.assign(data.url);
        return;
      }
    } finally {
      setOpeningPortal(false);
    }
  }

  if (loading) {
    return <AccountDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#f7f5f1]">
      <section className="border-b border-neutral-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-lg"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-full bg-neutral-950 text-2xl font-semibold text-white shadow-lg">
                  {initialsFromName(profile.full_name, profile.email)}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
                  Future Kids Account
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                  {profile.full_name ?? "Your account"}
                </h1>
                <p className="mt-2 text-sm text-neutral-600">{profile.email}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={emailVerified ? "success" : "warning"}>
                    {emailVerified ? "Email verified" : "Email pending"}
                  </Badge>
                  <Badge tone="neutral">{profile.account_type ?? "Parent"} account</Badge>
                  {profile.stripe_customer_id && (
                    <Badge tone="neutral">Billing connected</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                View plans
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {checkoutSuccess && (
        <div className="border-b border-emerald-100 bg-emerald-50">
          <p className="mx-auto max-w-7xl px-4 py-4 text-sm text-emerald-800 sm:px-6 lg:px-8">
            Checkout completed. Your subscription will activate once Stripe confirms payment —
            usually within a minute.
          </p>
        </div>
      )}

      {showSetupBanner && (
        <div className="border-b border-amber-100 bg-amber-50">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p className="text-sm text-amber-900">
              {setupError ?? SETUP_PENDING_MESSAGE} You can still view your account while setup
              finishes.
            </p>
            <button
              type="button"
              onClick={handleRepairSetup}
              disabled={repairing}
              className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {repairing ? "Retrying…" : "Retry setup"}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1 rounded-3xl border border-neutral-200/80 bg-white p-3">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-2xl px-4 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-[#fafafa] hover:text-neutral-950"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-10">
            <section id="overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <OverviewCard label="Active plans" value={String(activePlans)} hint="Paid subscriptions" />
              <OverviewCard label="Apps with access" value={String(activeApps)} hint="Across the ecosystem" />
              <OverviewCard
                label="Family"
                value={
                  family?.family_name ??
                  (profile.account_type === "individual" ? "Individual" : "Setting up")
                }
                hint={
                  profile.account_type === "individual"
                    ? "Personal account"
                    : `${members.length || 1} member${members.length === 1 ? "" : "s"}`
                }
              />
              <OverviewCard
                label="Member since"
                value={formatAccountDate(profile.created_at)}
                hint={emailVerified ? "Verified account" : "Verify your email"}
              />
            </section>

            <section id="my-apps">
              <SectionHeading
                title="My Apps"
                description="One Future Kids account unlocks Earnly, Scholars Notes, Ballr, and TinyPal."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {REQUIRED_APP_IDS.map((appId) => {
                  const brandApp = apps.find((a) => a.slug === appId)!;
                  const entitlement = entitlementForApp(account, appId);
                  const status = entitlement ? "active" : "inactive";

                  return (
                    <AppCard
                      key={appId}
                      appId={appId}
                      name={brandApp.name}
                      tagline={brandApp.tagline}
                      icon={brandApp.iconPath}
                      accent={brandApp.accentColor}
                      status={status}
                      entitlement={entitlement}
                      learnMore={brandApp.learnMorePath}
                      openHref={brandApp.appStoreUrl || brandApp.cta.href}
                    />
                  );
                })}
              </div>
            </section>

            <section id="plans">
              <SectionHeading
                title="Plans & Billing"
                description="Manage subscriptions, billing intervals, and renewal dates."
              />
              <div className="mt-6 overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-white shadow-sm">
                <div className="border-b border-neutral-100 bg-[#fafafa] px-6 py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">All Access bundle</p>
                      <p className="mt-1 text-sm text-neutral-600">
                        Save with every app in one subscription, or manage individual plans below.
                      </p>
                    </div>
                    <Link
                      href="/pricing"
                      className="inline-flex rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
                    >
                      Compare plans
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-500">
                      <tr>
                        <th className="px-6 py-4 font-medium">App</th>
                        <th className="px-6 py-4 font-medium">Plan</th>
                        <th className="px-6 py-4 font-medium">Provider</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Renews / expires</th>
                        <th className="px-6 py-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {account.entitlements.length ? (
                        account.entitlements.map((entitlement) => {
                          const brandApp =
                            apps.find((app) => app.slug === entitlement.app_key);

                          return (
                            <tr
                              key={entitlement.id}
                              className="border-b border-neutral-100 last:border-0"
                            >
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  {brandApp ? (
                                    <Image
                                      src={brandApp.iconPath}
                                      alt=""
                                      width={28}
                                      height={28}
                                      className="h-7 w-7"
                                      aria-hidden
                                    />
                                  ) : (
                                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-950 text-xs text-white">
                                      FK
                                    </div>
                                  )}
                                  <p className="font-medium text-neutral-950">
                                    {brandApp?.name ?? "Future Kids All Access"}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-neutral-600">
                                {planDisplayName(entitlement.plan_key)}
                                <span className="mt-1 block text-xs capitalize text-neutral-500">
                                  {entitlementAccessSummary(entitlement)}
                                </span>
                              </td>
                              <td className="px-6 py-5 capitalize text-neutral-600">
                                {entitlement.provider}
                              </td>
                              <td className="px-6 py-5">
                                <Badge tone={entitlementTone(entitlement.status)}>
                                  {entitlementStatusLabel(entitlement.status)}
                                </Badge>
                              </td>
                              <td className="px-6 py-5 text-neutral-600">
                                {formatAccountDate(entitlement.current_period_end)}
                              </td>
                              <td className="px-6 py-5">
                                {entitlement.provider === "stripe" ? (
                                  <button
                                    type="button"
                                    onClick={handleOpenBillingPortal}
                                    disabled={openingPortal}
                                    className="font-medium text-neutral-950 underline underline-offset-4 disabled:opacity-50"
                                  >
                                    {openingPortal ? "Opening…" : "Manage subscription"}
                                  </button>
                                ) : entitlement.provider === "apple" ? (
                                  <a
                                    href="https://apps.apple.com/account/subscriptions"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-neutral-950 underline underline-offset-4"
                                  >
                                    Manage in App Store
                                  </a>
                                ) : (
                                  <a
                                    href="https://play.google.com/store/account/subscriptions"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-neutral-950 underline underline-offset-4"
                                  >
                                    Manage in Google Play
                                  </a>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                            No subscriptions yet. Choose an app plan to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section id="family">
              <SectionHeading
                title="Family"
                description="Your household connected to this Future Kids account."
              />
              <div className="mt-6 rounded-[2rem] border border-neutral-200/80 bg-white p-6 shadow-sm">
                {family ? (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-neutral-950">{family.family_name}</p>
                        <p className="mt-1 text-sm text-neutral-600">
                          Created {formatAccountDate(family.created_at)}
                        </p>
                      </div>
                      <Badge tone="neutral">{members.length} member{members.length === 1 ? "" : "s"}</Badge>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {members.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center justify-between rounded-2xl bg-[#fafafa] px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {member.user_id === profile.id
                                ? profile.full_name ?? profile.email
                                : "Family member"}
                            </p>
                            <p className="text-xs text-neutral-500">
                              Joined {formatAccountDate(member.joined_at)}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium capitalize text-neutral-600 ring-1 ring-neutral-200">
                            {member.role}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : profile.account_type === "individual" ? (
                  <div className="text-center">
                    <p className="text-sm text-neutral-600">
                      Individual accounts are for personal use — perfect for Ballr and your own app
                      access. Family features are available if you switch to a parent account later.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-neutral-600">
                      Your family is still being prepared. This usually completes automatically after
                      signup.
                    </p>
                    <button
                      type="button"
                      onClick={handleRepairSetup}
                      disabled={repairing}
                      className="mt-4 rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-800"
                    >
                      {repairing ? "Setting up…" : "Finish family setup"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section id="profile">
              <SectionHeading title="Profile" description="Your account details across every app." />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard label="Full name" value={profile.full_name ?? "—"} />
                <InfoCard label="Email" value={profile.email} />
                <InfoCard
                  label="Email verification"
                  value={emailVerified ? "Verified" : "Pending verification"}
                />
                <InfoCard label="Account type" value={profile.account_type ?? "Parent"} />
                <InfoCard label="Member since" value={formatAccountDate(profile.created_at)} />
                <InfoCard
                  label="Stripe customer"
                  value={profile.stripe_customer_id ? "Connected" : "Not linked yet"}
                />
              </div>
            </section>

            <section id="security">
              <SectionHeading
                title="Security"
                description="Manage sign-in, password, and account access."
              />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <ActionCard
                  title="Reset password"
                  description="Send yourself a secure link to choose a new password."
                  href="/forgot-password"
                  label="Reset password"
                />
                <ActionCard
                  title="Need help?"
                  description="Contact support if you cannot access an app or subscription."
                  href="/contact"
                  label="Contact support"
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccountDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f5f1]">
      <div className="border-b border-neutral-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-start gap-5">
            <div className="h-20 w-20 animate-pulse rounded-full bg-neutral-200" />
            <div>
              <div className="h-3 w-32 animate-pulse rounded-full bg-neutral-200" />
              <div className="mt-4 h-10 w-64 animate-pulse rounded-2xl bg-neutral-200" />
              <div className="mt-3 h-4 w-48 animate-pulse rounded-full bg-neutral-100" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`overview-skeleton-${index}`} className="h-28 animate-pulse rounded-[1.5rem] bg-white" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`app-skeleton-${index}`} className="h-48 animate-pulse rounded-[1.5rem] bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">{description}</p>}
    </div>
  );
}

function OverviewCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-neutral-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">{value}</p>
      <p className="mt-2 text-sm text-neutral-500">{hint}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-neutral-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-3 text-sm font-medium capitalize text-neutral-950">{value}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-neutral-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
      >
        {label}
      </Link>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "warning" | "neutral";
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warning: "bg-amber-50 text-amber-800 ring-amber-100",
    neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  }[tone];

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${styles}`}>
      {children}
    </span>
  );
}

function entitlementStatusLabel(status: EntitlementStatus): string {
  const labels: Record<EntitlementStatus, string> = {
    active: "Active",
    trialing: "Trial",
    grace_period: "Grace period",
    past_due: "Past due",
    canceled: "Canceled",
    expired: "Expired",
    revoked: "Revoked",
    incomplete: "Incomplete",
  };
  return labels[status];
}

function entitlementTone(
  status: EntitlementStatus,
): "success" | "warning" | "neutral" {
  if (status === "active" || status === "trialing") return "success";
  if (status === "grace_period") return "warning";
  return "neutral";
}

function planDisplayName(planKey: string): string {
  return planKey
    .replace(/^futurekids_/, "Future Kids ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function entitlementAccessSummary(entitlement: UserEntitlement): string {
  const details = [entitlement.tier_key.replace(/_/g, " ")];
  if (entitlement.child_limit) {
    details.push(
      `${entitlement.child_limit} ${entitlement.child_limit === 1 ? "child" : "children"}`,
    );
  }
  const features = Object.entries(entitlement.features ?? {})
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase());
  if (features.length) details.push(features.join(", "));
  return details.join(" · ");
}

function AppCard({
  appId,
  name,
  tagline,
  icon,
  accent,
  status,
  entitlement,
  learnMore,
  openHref,
}: {
  appId: EcosystemAppId;
  name: string;
  tagline: string;
  icon: string;
  accent: string;
  status: "active" | "inactive" | "coming_soon";
  entitlement?: UserEntitlement;
  learnMore: string;
  openHref: string;
}) {
  const label =
    status === "active" ? "Active" : status === "coming_soon" ? "Coming soon" : "Not subscribed";

  return (
    <article
      className="flex h-full flex-col rounded-[1.75rem] border border-neutral-200/80 bg-white p-6 shadow-sm"
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image src={icon} alt="" width={36} height={36} className="h-9 w-9" aria-hidden />
          <div>
            <h3 className="font-semibold text-neutral-950">{name}</h3>
            <p className="mt-1 text-xs text-neutral-500">{tagline}</p>
          </div>
        </div>
        <Badge tone={status === "active" ? "success" : "neutral"}>{label}</Badge>
      </div>

      <div className="mt-5 space-y-2 text-sm text-neutral-600">
        <p>
          Plan:{" "}
          <span className="font-medium text-neutral-900">
            {entitlement ? planDisplayName(entitlement.plan_key) : "None"}
          </span>
        </p>
        <p>
          Provider:{" "}
          <span className="font-medium capitalize text-neutral-900">
            {entitlement?.provider ?? "—"}
          </span>
        </p>
        {entitlement?.current_period_end && (
          <p>
            Renews:{" "}
            <span className="font-medium text-neutral-900">
              {formatAccountDate(entitlement.current_period_end)}
            </span>
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/pricing#${appId}`}
          className="rounded-full px-4 py-2 text-xs font-medium text-white"
          style={{ backgroundColor: accent }}
        >
          Manage plan
        </Link>
        <a
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
        >
          Open app
        </a>
        <Link
          href={learnMore}
          className="rounded-full px-4 py-2 text-xs font-medium text-neutral-600 underline underline-offset-4"
        >
          Learn more
        </Link>
      </div>
    </article>
  );
}
