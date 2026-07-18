"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/safe-next";
import { AuthDivider, GoogleAuthButton } from "./GoogleAuthButton";
import { AuthField, AuthLink, AuthShell, authInputClass } from "./AuthShell";
import { PasswordInput } from "./PasswordInput";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const callbackError = searchParams.get("error");
  const callbackErrorMessage =
    callbackError === "auth_callback_failed"
      ? "Google sign-in could not be completed. Please try again."
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const displayError = error ?? callbackErrorMessage;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (!remember && typeof window !== "undefined") {
      sessionStorage.setItem("fk_session_only", "1");
    }

    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your Future Kids account to access every app."
      footer={
        <>
          New here? <AuthLink href="/signup">Create account</AuthLink>
        </>
      }
    >
      <GoogleAuthButton next={next} label="Sign in with Google" />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField label="Email">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={authInputClass}
            placeholder="you@email.com"
          />
        </AuthField>

        <AuthField label="Password">
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
        </AuthField>

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-neutral-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Remember me
          </label>
          <AuthLink href="/forgot-password">Forgot password?</AuthLink>
        </div>

        {displayError && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {displayError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-full bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
