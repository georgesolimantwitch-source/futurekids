"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildOAuthCallbackUrl } from "@/lib/auth/redirect";
import { metadataForAccountType, persistSignupAccountType } from "@/lib/auth/signup";
import type { AccountType } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/client";
import { AccountTypeSelector } from "./AccountTypeSelector";
import { AuthDivider, GoogleAuthButton } from "./GoogleAuthButton";
import { AuthField, AuthLink, AuthShell, authInputClass } from "./AuthShell";
import { PasswordInput } from "./PasswordInput";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("parent");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);
    persistSignupAccountType(accountType);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: buildOAuthCallbackUrl("/account/setup"),
        data: {
          full_name: fullName.trim(),
          ...metadataForAccountType(accountType),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/account/setup");
      router.refresh();
      return;
    }

    router.push("/verify-email");
    router.refresh();
  }

  return (
    <AuthShell
      size="wide"
      title="Create your account"
      subtitle="One account for every app — Earnly, Scholars Notes, Ballr, and TinyPal."
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <AccountTypeSelector value={accountType} onChange={setAccountType} />

      <div className="mt-5">
        <GoogleAuthButton
          next="/account/setup"
          label="Sign up with Google"
          accountType={accountType}
        />
      </div>
      <p className="mt-3 text-center text-xs text-neutral-500">
        By continuing with Google, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField label="Full name">
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            className={authInputClass}
            placeholder="Your name"
          />
        </AuthField>

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
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </AuthField>

        <AuthField label="Confirm password">
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </AuthField>

        <label className="flex items-start gap-3 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-neutral-300"
            required
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="underline underline-offset-4">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-full bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
