"use client";

import { useState } from "react";
import { buildOAuthCallbackUrl } from "@/lib/auth/redirect";
import { persistSignupAccountType } from "@/lib/auth/signup";
import type { AccountType } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/client";

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className ?? "h-5 w-5"} fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.42 2.23-1.21 3.05-.86.9-2.14 1.55-3.33 1.46-.15-1.18.44-2.4 1.21-3.2.86-.9 2.31-1.55 3.33-1.31zM20.5 17.2c-.6 1.36-.88 1.96-1.65 3.16-1.07 1.64-2.58 3.68-4.45 3.7-1.05.02-1.32-.68-2.76-.68-1.43 0-1.74.66-2.78.7-1.82.06-3.21-1.78-4.29-3.4-2.4-3.62-2.66-7.87-1.17-10.12 1.05-1.6 2.72-2.54 4.28-2.54 1.34 0 2.46.88 3.3.88.82 0 2.11-.98 3.56-.84.61.03 2.32.25 3.42 1.86-.09.06-2.04 1.19-2.02 3.55.03 2.81 2.46 3.75 2.5 3.77-.02.07-.39 1.35-1.28 2.66z" />
    </svg>
  );
}

export function AppleAuthButton({
  next = "/account",
  label = "Continue with Apple",
  accountType,
}: {
  next?: string;
  label?: string;
  accountType?: AccountType;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAppleSignIn() {
    setLoading(true);
    setError(null);

    if (accountType) {
      persistSignupAccountType(accountType);
    }

    const supabase = createClient();
    const redirectTo = buildOAuthCallbackUrl(next);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo,
        scopes: "name email",
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAppleSignIn}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        <AppleIcon className="h-5 w-5 text-white" />
        {loading ? "Redirecting to Apple…" : label}
      </button>
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
