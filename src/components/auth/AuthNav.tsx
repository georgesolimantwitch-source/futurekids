"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <div className="h-9 w-24 shrink-0" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/login"
          className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:text-ink"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="shine press inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(11,16,32,0.7)] transition hover:bg-black"
        >
          Get started
        </Link>
      </div>
    );
  }

  const initials =
    (user.user_metadata?.full_name as string | undefined)?.charAt(0)?.toUpperCase() ??
    user.email?.charAt(0)?.toUpperCase() ??
    "?";

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link
        href="/account"
        className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:text-ink"
      >
        Account
      </Link>
      <Link
        href="/account"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition hover:scale-105"
        aria-label="Profile"
        title={user.email ?? "Account"}
      >
        {initials}
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-full px-3 py-2 text-sm font-semibold text-ink-faint transition hover:text-ink"
      >
        Logout
      </button>
    </div>
  );
}

export function AuthNavMobile({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4">
        <Link
          href="/login"
          onClick={onNavigate}
          className="rounded-full px-3 py-3 text-center text-sm font-semibold text-ink ring-1 ring-ink/10"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          onClick={onNavigate}
          className="rounded-full bg-ink px-3 py-3 text-center text-sm font-semibold text-white"
        >
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4">
      <Link
        href="/account"
        onClick={onNavigate}
        className="rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-800"
      >
        Account
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-neutral-500"
      >
        Logout
      </button>
    </div>
  );
}
