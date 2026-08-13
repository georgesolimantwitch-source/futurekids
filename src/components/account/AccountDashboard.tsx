"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { apps, isAppListed } from "@/config/brand";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
import {
  EMPTY_PLAN_MANAGEMENT_CONTEXT,
  type PendingPlanChange,
  type PlanManagementContext,
} from "@/lib/subscriptions/plan-management";
import { FamilyKidsSection } from "@/components/account/FamilyKidsSection";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "my-apps", label: "My Apps" },
  { id: "plans", label: "Plans & Billing" },
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
  const [managedPlan, setManagedPlan] = useState<UserEntitlement | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [managePlanError, setManagePlanError] = useState<string | null>(null);
  const [planContext, setPlanContext] = useState<PlanManagementContext>(
    EMPTY_PLAN_MANAGEMENT_CONTEXT,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
  const activePlans = countActivePlans(account);
  const activeApps = countActiveApps(account);
  const showSetupBanner = Boolean(setupError) && !rawAccount?.profile;
  const kidCount = (account.family_members ?? []).filter(
    (member) => member.role === "child",
  ).length;
  const hasPasswordAuth =
    (authUser.identities ?? []).some((identity) => identity.provider === "email") ||
    (Array.isArray(authUser.app_metadata?.providers) &&
      authUser.app_metadata.providers.includes("email"));

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

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeletingAccount(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          hasPasswordAuth
            ? { password: deletePassword }
            : { confirm: deleteConfirm },
        ),
      });
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !data?.ok) {
        setDeleteError(data?.error ?? "Could not delete your account. Please try again.");
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/?deleted=1");
      router.refresh();
    } catch {
      setDeleteError("Could not delete your account. Please try again.");
    } finally {
      setDeletingAccount(false);
    }
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

  async function handleStripeRenewalChange(action: "cancel" | "resume") {
    if (!managedPlan || managedPlan.provider !== "stripe") return;
    setUpdatingPlan(true);
    setManagePlanError(null);
    try {
      const response = await fetch("/api/subscriptions/stripe/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entitlementId: managedPlan.id,
          action,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setManagePlanError(result.error ?? "Could not update this subscription.");
        return;
      }
      const refreshed = await loadCanonicalAccount();
      if (refreshed) {
        setRawAccount(refreshed);
        setManagedPlan(
          refreshed.entitlements.find((item) => item.id === managedPlan.id) ??
            null,
        );
      }
    } finally {
      setUpdatingPlan(false);
    }
  }

  function handleManagePlan(entitlement: UserEntitlement) {
    setManagePlanError(null);
    setManagedPlan(entitlement);
    createClient()
      .rpc("get_plan_management_context")
      .then(({ data }) => {
        if (data) setPlanContext(data as PlanManagementContext);
      });
  }

  async function handleCancelPendingChange(change: PendingPlanChange) {
    setUpdatingPlan(true);
    setManagePlanError(null);
    try {
      const response = await fetch("/api/subscriptions/stripe/change-plan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeId: change.id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setManagePlanError(result.error ?? "Could not cancel the pending change.");
        return;
      }
      setPlanContext((current) => ({
        ...current,
        pendingChanges: current.pendingChanges.filter(
          (pending) => pending.id !== change.id,
        ),
      }));
    } finally {
      setUpdatingPlan(false);
    }
  }

  if (loading) {
    return <AccountDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#fefbf6]">
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
                <div className="mb-1">
                  <BrandLogo size="account" />
                </div>
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
                  className="block rounded-2xl px-4 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-[#fefbf6] hover:text-neutral-950"
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
                label="Account type"
                value={
                  profile.account_type === "individual" ? "Individual" : "Parent"
                }
                hint={
                  profile.account_type === "individual"
                    ? "Personal account"
                    : "Kids are managed per app"
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
                description={
                  profile.account_type === "individual"
                    ? "One Genlyn account unlocks Earnly, Scholars Notes, Ballr, and Freshys."
                    : "Manage plans and choose which kids can use each app."
                }
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
                      onManagePlan={
                        entitlement
                          ? () => handleManagePlan(entitlement)
                          : undefined
                      }
                    />
                  );
                })}
              </div>

              {profile.account_type !== "individual" && (
                <div className="mt-10">
                  <h3 className="text-lg font-semibold tracking-tight text-neutral-950">
                    Kids &amp; app access
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
                    Add a kid whenever you like, then switch on the apps each of
                    them can sign in to.
                  </p>
                  <FamilyKidsSection />
                </div>
              )}
            </section>

            <section id="plans">
              <SectionHeading
                title="Plans & Billing"
                description="Manage subscriptions, billing intervals, and renewal dates."
              />
              <div className="mt-6 overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-white shadow-sm">
                <div className="border-b border-neutral-100 bg-[#fefbf6] px-6 py-5">
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
                                    {brandApp?.name ?? "Genlyn All Access"}
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
                                <button
                                  type="button"
                                  onClick={() => handleManagePlan(entitlement)}
                                  className="font-medium text-neutral-950 underline underline-offset-4"
                                >
                                  Manage subscription
                                </button>
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

              <div className="mt-6 rounded-[1.5rem] border border-red-200 bg-red-50/60 p-5 shadow-sm sm:p-6">
                <h3 className="text-base font-semibold text-red-900">Delete account</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-red-900/75">
                  Permanently delete your Genlyn account and everything connected to it.
                  This cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeletePassword("");
                    setDeleteConfirm("");
                    setDeleteError(null);
                    setDeleteOpen(true);
                  }}
                  className="mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Delete account
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
      {managedPlan && (
        <ManagePlanModal
          entitlement={managedPlan}
          entitlements={account.entitlements}
          openingPortal={openingPortal}
          updatingPlan={updatingPlan}
          errorMessage={managePlanError}
          pendingChange={planContext.pendingChanges.find(
            (change) => change.entitlement_id === managedPlan.id,
          )}
          onClose={() => {
            setManagePlanError(null);
            setManagedPlan(null);
          }}
          onOpenBillingPortal={handleOpenBillingPortal}
          onCancel={() => handleStripeRenewalChange("cancel")}
          onResume={() => handleStripeRenewalChange("resume")}
          onCancelPendingChange={handleCancelPendingChange}
        />
      )}
      {deleteOpen && (
        <DeleteAccountModal
          email={profile.email}
          hasPassword={hasPasswordAuth}
          kidCount={kidCount}
          activePlanCount={activePlans}
          activeAppCount={activeApps}
          password={deletePassword}
          confirmText={deleteConfirm}
          error={deleteError}
          deleting={deletingAccount}
          onPasswordChange={setDeletePassword}
          onConfirmChange={setDeleteConfirm}
          onClose={() => {
            if (deletingAccount) return;
            setDeleteOpen(false);
            setDeleteError(null);
          }}
          onConfirm={() => void handleDeleteAccount()}
        />
      )}
    </div>
  );
}

export function AccountDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#fefbf6]">
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

function DeleteAccountModal({
  email,
  hasPassword,
  kidCount,
  activePlanCount,
  activeAppCount,
  password,
  confirmText,
  error,
  deleting,
  onPasswordChange,
  onConfirmChange,
  onClose,
  onConfirm,
}: {
  email: string;
  hasPassword: boolean;
  kidCount: number;
  activePlanCount: number;
  activeAppCount: number;
  password: string;
  confirmText: string;
  error: string | null;
  deleting: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const lossItems = [
    "Your Genlyn login and profile",
    activeAppCount > 0
      ? `Access to ${activeAppCount} active app${activeAppCount === 1 ? "" : "s"} (Earnly, Scholars Notes, Ballr, Freshys, and more)`
      : "Access to every Genlyn app (Earnly, Scholars Notes, Ballr, Freshys, and more)",
    activePlanCount > 0
      ? `${activePlanCount} active subscription${activePlanCount === 1 ? "" : "s"} (Stripe plans are canceled immediately)`
      : "Any linked subscriptions and billing history on this account",
    kidCount > 0
      ? `${kidCount} child account${kidCount === 1 ? "" : "s"} and all of their app logins, progress, and data`
      : "Any child accounts you create later would also be removed with this account",
    "Scholars Notes AI credits, family settings, and saved account preferences",
    "App Store / Google Play subscriptions must still be canceled in those stores if you bought there",
  ];

  const canSubmit = hasPassword
    ? password.length > 0
    : confirmText.trim().toLowerCase() === "delete" ||
      confirmText.trim().toLowerCase() === email.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"
      >
        <h3
          id="delete-account-title"
          className="text-lg font-semibold text-neutral-950"
        >
          Delete your account?
        </h3>
        <p className="mt-2 text-sm text-neutral-600">
          This permanently removes your Genlyn account. You will lose:
        </p>
        <ul className="mt-4 space-y-2 rounded-2xl border border-red-100 bg-red-50/70 p-4 text-sm text-red-950">
          {lossItems.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit || deleting) return;
            onConfirm();
          }}
        >
          {hasPassword ? (
            <label className="block">
              <span className="text-sm font-medium text-neutral-800">
                Enter your password to confirm
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="Your account password"
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none ring-neutral-950 focus:ring-2"
              />
            </label>
          ) : (
            <label className="block">
              <span className="text-sm font-medium text-neutral-800">
                Type DELETE or {email} to confirm
              </span>
              <input
                type="text"
                autoComplete="off"
                value={confirmText}
                onChange={(event) => onConfirmChange(event.target.value)}
                placeholder="DELETE"
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none ring-neutral-950 focus:ring-2"
              />
              <span className="mt-2 block text-xs text-neutral-500">
                You signed in with Google or Apple, so there is no password on this
                account.
              </span>
            </label>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-full px-4 py-2 text-sm text-neutral-600 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || deleting}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </form>
      </div>
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
  const scholarsKids = /^scholars_all_access_kids(\d+)_(monthly|yearly)$/.exec(
    planKey,
  );
  if (scholarsKids) {
    const kids = Number(scholarsKids[1]);
    const period = scholarsKids[2] === "yearly" ? "Yearly" : "Monthly";
    return `Scholars Full · ${kids} ${kids === 1 ? "kid" : "kids"} · ${period}`;
  }
  if (planKey === "scholars_all_access_monthly") {
    return "Scholars Full · Monthly";
  }
  if (planKey === "scholars_all_access_yearly") {
    return "Scholars Full · Yearly";
  }

  return planKey
    .replace(/^futurekids_/, "Genlyn ")
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
  onManagePlan,
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
  onManagePlan?: () => void;
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
        {entitlement && onManagePlan ? (
          <button
            type="button"
            onClick={onManagePlan}
            className="rounded-full px-4 py-2 text-xs font-medium text-white"
            style={{ backgroundColor: accent }}
          >
            Manage plan
          </button>
        ) : (
          <Link
            href={`/pricing#${appId}`}
            className="rounded-full px-4 py-2 text-xs font-medium text-white"
            style={{ backgroundColor: accent }}
          >
            Choose plan
          </Link>
        )}
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

function ManagePlanModal({
  entitlement,
  entitlements,
  openingPortal,
  updatingPlan,
  errorMessage,
  pendingChange,
  onClose,
  onOpenBillingPortal,
  onCancel,
  onResume,
  onCancelPendingChange,
}: {
  entitlement: UserEntitlement;
  entitlements: UserEntitlement[];
  openingPortal: boolean;
  updatingPlan: boolean;
  errorMessage: string | null;
  pendingChange?: PendingPlanChange;
  onClose: () => void;
  onOpenBillingPortal: () => void;
  onCancel: () => void;
  onResume: () => void;
  onCancelPendingChange: (change: PendingPlanChange) => void;
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const brandApp = apps.find((app) => app.slug === entitlement.app_key);
  const appName = brandApp?.name ?? "Genlyn All Access";
  const otherApps = apps.filter((app) => app.slug !== entitlement.app_key && isAppListed(app));
  const hasAllAccess = entitlements.some(
    (item) =>
      item.app_key === "futurekids_all_access" &&
      ["active", "trialing", "grace_period"].includes(item.status),
  );
  const manageUrl =
    entitlement.provider === "apple"
      ? "https://apps.apple.com/account/subscriptions"
      : "https://play.google.com/store/account/subscriptions";

  useEffect(() => {
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
  }, [onClose]);

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
        aria-labelledby="manage-plan-title"
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            {brandApp ? (
              <Image
                src={brandApp.iconPath}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10"
                aria-hidden
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-950 text-xs text-white">
                FK
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                Manage plan
              </p>
              <h2
                id="manage-plan-title"
                className="mt-1 text-xl font-semibold tracking-tight text-neutral-950"
              >
                {appName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close manage plan"
            className="grid h-9 w-9 place-items-center rounded-full text-xl font-light text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-7">
          <div className="rounded-2xl bg-[#fefbf6] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-950">
                  {planDisplayName(entitlement.plan_key)}
                </p>
                <p className="mt-1 text-sm capitalize text-neutral-600">
                  Billed through {entitlement.provider}
                </p>
              </div>
              <Badge tone={entitlementTone(entitlement.status)}>
                {entitlement.cancel_at_period_end
                  ? "Ends soon"
                  : entitlementStatusLabel(entitlement.status)}
              </Badge>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-neutral-200/70 pt-4 text-sm">
              <div>
                <dt className="text-neutral-500">Plan includes</dt>
                <dd className="mt-1 font-medium capitalize text-neutral-900">
                  {entitlementAccessSummary(entitlement)}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">
                  {entitlement.cancel_at_period_end ? "Access until" : "Next renewal"}
                </dt>
                <dd className="mt-1 font-medium text-neutral-900">
                  {formatAccountDate(entitlement.current_period_end)}
                </dd>
              </div>
            </dl>
          </div>

          {entitlement.cancel_at_period_end && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
              Renewal is canceled. You will keep access through{" "}
              {formatAccountDate(entitlement.current_period_end)}.
            </p>
          )}

          {pendingChange && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
              <p className="font-medium">Plan change scheduled</p>
              <p className="mt-1 text-xs leading-relaxed text-indigo-800">
                Your child limit changes from {pendingChange.from_child_limit} to{" "}
                {pendingChange.target_child_limit} on{" "}
                {formatAccountDate(pendingChange.effective_at)}. Unselected child
                profiles and data will be paused in Earnly, not deleted.
              </p>
              <button
                type="button"
                onClick={() => onCancelPendingChange(pendingChange)}
                disabled={updatingPlan}
                className="mt-2 text-xs font-medium underline underline-offset-2 disabled:opacity-50"
              >
                Cancel pending change
              </button>
            </div>
          )}

          {entitlement.provider === "stripe" &&
            ["earnly", "futurekids_all_access"].includes(entitlement.app_key) && (
              <Link
                href={`/pricing?app=${entitlement.app_key === "earnly" ? "earnly" : "all-access"}`}
                className="flex items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-950 transition hover:border-neutral-400"
              >
                Change child count or billing period
                <span aria-hidden>→</span>
              </Link>
            )}

          <div>
            <p className="text-sm font-medium text-neutral-950">
              Explore more with Genlyn
            </p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Add another app or bring everything together with All Access.
            </p>
          </div>

          {!hasAllAccess && entitlement.app_key !== "futurekids_all_access" && (
            <Link
              href="/pricing"
              className="group block overflow-hidden rounded-2xl bg-neutral-950 p-5 text-white transition hover:bg-neutral-800"
            >
              <div className="flex items-center justify-between gap-5">
                <div>
                  <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-300">
                    Best value
                  </span>
                  <p className="mt-3 text-base font-semibold">
                    Genlyn All Access
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-300">
                    Unlock Earnly, Scholars Notes, Ballr, and Freshys with one family plan.
                  </p>
                </div>
                <span className="shrink-0 text-xl text-white/70 transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {otherApps.map((app) => {
              const active =
                entitlement.app_key === "futurekids_all_access" ||
                entitlements.some(
                  (item) =>
                    item.app_key === app.slug &&
                    ["active", "trialing", "grace_period"].includes(item.status),
                );
              return (
                <Link
                  key={app.slug}
                  href="/pricing#individual-apps"
                  className="rounded-2xl border border-neutral-200 p-4 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Image
                      src={app.iconPath}
                      alt=""
                      width={30}
                      height={30}
                      className="h-[30px] w-[30px]"
                      aria-hidden
                    />
                    <p className="text-sm font-medium text-neutral-950">
                      {app.name}
                    </p>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                    {app.tagline}
                  </p>
                  <p
                    className="mt-3 text-xs font-medium"
                    style={{ color: app.accentColor }}
                  >
                    {active ? "Included" : "View plans →"}
                  </p>
                </Link>
              );
            })}
          </div>

          {entitlement.provider === "stripe" ? (
            <button
              type="button"
              onClick={onOpenBillingPortal}
              disabled={openingPortal || updatingPlan}
              className="text-left text-xs font-normal text-neutral-500 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-900 disabled:opacity-50"
            >
              {openingPortal
                ? "Opening Stripe…"
                : "Update payment method or billing details"}
            </button>
          ) : (
            <a
              href={manageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-normal text-neutral-500 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-900"
            >
              Manage billing with{" "}
              {entitlement.provider === "apple" ? "Apple" : "Google Play"}
            </a>
          )}

          {errorMessage && (
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          {confirmingCancel && !entitlement.cancel_at_period_end && (
            <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
              <p className="text-sm font-medium text-neutral-950">Cancel this plan?</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                You will keep access until{" "}
                {formatAccountDate(entitlement.current_period_end)} and will not be charged again.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-neutral-100 px-6 py-5 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-normal text-neutral-600 transition hover:text-neutral-950"
          >
            Close
          </button>

          {entitlement.provider === "stripe" ? (
            entitlement.cancel_at_period_end ? (
              <button
                type="button"
                onClick={onResume}
                disabled={updatingPlan}
                className="text-sm font-normal text-emerald-700 transition hover:text-emerald-900 disabled:opacity-50"
              >
                {updatingPlan ? "Updating…" : "Resume renewal"}
              </button>
            ) : confirmingCancel ? (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  disabled={updatingPlan}
                  className="text-sm font-normal text-neutral-600"
                >
                  Keep plan
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={updatingPlan}
                  className="text-sm font-normal text-red-600 transition hover:text-red-800 disabled:opacity-50"
                >
                  {updatingPlan ? "Canceling…" : "Confirm cancellation"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingCancel(true)}
                className="text-sm font-normal text-neutral-500 transition hover:text-red-600"
              >
                Cancel plan
              </button>
            )
          ) : (
            <a
              href={manageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-normal text-neutral-500 transition hover:text-red-600"
            >
              Cancel with {entitlement.provider === "apple" ? "Apple" : "Google Play"}
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
