"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildOAuthCallbackUrl } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";
import { AuthLink, AuthShell, authButtonClass, authInputClass } from "./AuthShell";

const EMAIL_STORAGE_KEY = "genlyn_pending_verify_email";

function providerInboxUrl(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (domain.includes("gmail") || domain.includes("googlemail")) {
    return "https://mail.google.com/mail/u/0/#search/from%3Agenlyn+OR+subject%3AConfirm";
  }
  if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live")) {
    return "https://outlook.live.com/mail/0/";
  }
  if (domain.includes("yahoo")) {
    return "https://mail.yahoo.com/";
  }
  if (domain.includes("icloud") || domain.includes("me.com") || domain.includes("mac.com")) {
    return "https://www.icloud.com/mail";
  }
  return null;
}

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";

  const [email, setEmail] = useState(emailFromQuery);
  const [editing, setEditing] = useState(!emailFromQuery);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (emailFromQuery) {
      try {
        sessionStorage.setItem(EMAIL_STORAGE_KEY, emailFromQuery);
      } catch {
        /* ignore */
      }
      setEmail(emailFromQuery);
      setEditing(false);
      return;
    }
    try {
      const stored = sessionStorage.getItem(EMAIL_STORAGE_KEY)?.trim() ?? "";
      if (stored) {
        setEmail(stored);
        setEditing(false);
      }
    } catch {
      /* ignore */
    }
  }, [emailFromQuery]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const inboxUrl = useMemo(
    () => (email.includes("@") ? providerInboxUrl(email) : null),
    [email],
  );

  async function resend() {
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Enter the email you used to create your account.");
      return;
    }

    setStatus("sending");
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: trimmed,
      options: {
        emailRedirectTo: buildOAuthCallbackUrl("/account/setup"),
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    try {
      sessionStorage.setItem(EMAIL_STORAGE_KEY, trimmed);
    } catch {
      /* ignore */
    }
    setEditing(false);
    setStatus("sent");
    setMessage("New confirmation email sent. Check your inbox and spam folder.");
    setCooldown(60);
  }

  return (
    <AuthShell
      title="Check your inbox"
      subtitle="We sent a confirmation link to verify your Genlyn family account."
      footer={
        <>
          Already verified? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#eef2ff] via-white to-[#f0f9ff] px-5 py-6 ring-1 ring-ink/[0.06]">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-brand/15 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-white shadow-lg shadow-ink/20">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5v10.5H3.75V6.75Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3.75 6.75 8.25 6 8.25-6"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                Verification email
              </p>
              {editing ? (
                <div className="mt-3 space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={authInputClass}
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (email.trim()) setEditing(false);
                    }}
                    className="text-sm font-bold text-ink underline decoration-ink/20 underline-offset-4"
                  >
                    Use this email
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-2 truncate text-lg font-bold text-ink">
                    {email || "your inbox"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="mt-1 text-sm font-semibold text-ink-soft underline decoration-ink/15 underline-offset-4 hover:text-ink"
                  >
                    Wrong address? Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <ol className="space-y-3">
          {[
            "Open the email from Genlyn",
            "Tap “Verify my email”",
            "You’ll land in account setup",
          ].map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-3 rounded-2xl bg-[#f7f8fc] px-4 py-3 text-sm font-semibold text-ink ring-1 ring-ink/[0.05]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <p className="text-sm leading-relaxed text-ink-soft">
          Don’t see it? Check spam/promotions. Links expire after about an hour.
        </p>

        {message && (
          <p
            className={`rounded-2xl px-4 py-3 text-sm ${
              status === "error"
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-800"
            }`}
            role="status"
          >
            {message}
          </p>
        )}

        <div className="space-y-3">
          {inboxUrl && (
            <a
              href={inboxUrl}
              target="_blank"
              rel="noreferrer"
              className={authButtonClass}
            >
              Open inbox
            </a>
          )}
          <button
            type="button"
            onClick={() => void resend()}
            disabled={status === "sending" || cooldown > 0}
            className="shine press flex w-full items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-bold text-ink ring-1 ring-ink/10 transition hover:bg-[#f7f8fc] disabled:opacity-60"
          >
            {status === "sending"
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend confirmation email"}
          </button>
        </div>

        <p className="text-center text-sm text-ink-soft">
          Need a different account?{" "}
          <Link
            href="/signup"
            className="font-bold text-ink underline decoration-ink/20 underline-offset-4"
          >
            Create account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
