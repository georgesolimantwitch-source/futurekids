"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

const FUNCTION_URL =
  "https://nepmwdctmilbsgbmiyea.supabase.co/functions/v1/earnly-hub";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcG13ZGN0bWlsYnNnYm1peWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTI0MjMsImV4cCI6MjA5OTM4ODQyM30.yL8GPriLey5VHhImAA0Vq8NtYqLusgAGRXvK8Xzp3OY";
const STORAGE_KEY = "earnly.hub.code";

type HubStatus = {
  linked: boolean;
  name: string | null;
  email: string | null;
};

async function postHub(body: Record<string, string>) {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    linked?: boolean;
    name?: string | null;
    email?: string | null;
  };
  if (!response.ok) {
    throw new Error(payload.error || "Could not reach Earnly Hub.");
  }
  return payload;
}

export function HubScreen() {
  const [code, setCode] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<HubStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const ready = stored
      ? Promise.resolve(stored)
      : postHub({ action: "create" }).then((created) => {
          if (!created.code) throw new Error("Could not create an Earnly Hub code.");
          window.localStorage.setItem(STORAGE_KEY, created.code);
          return created.code;
        });

    ready
      .then(async (nextCode) => {
        if (cancelled) return;
        setCode(nextCode);
        setQrUrl(await QRCode.toDataURL(nextCode, { margin: 1, width: 320 }));
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "Could not start this hub.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    const refresh = async () => {
      try {
        const next = await postHub({ action: "status", code });
        if (cancelled) return;
        setStatus({
          linked: Boolean(next.linked),
          name: next.name ?? null,
          email: next.email ?? null,
        });
        setError(null);
      } catch (reason: unknown) {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "Could not refresh this hub.");
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [code]);

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-[#1d1d1f]">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">
          Earnly Hub
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {status?.linked ? "This hub is linked" : "Scan to connect"}
        </h1>
        <p className="mt-3 max-w-md text-base leading-6 text-[#6e6e73]">
          On the parent’s phone, open Earnly and tap Connect Earnly Hub. Scan this
          code, then sign in or create the parent account. That account gets
          lifetime Earnly, and this hub stays paired with it.
        </p>

        <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm">
          {qrUrl ? (
            <img src={qrUrl} alt="Earnly Hub QR code" width={320} height={320} />
          ) : (
            <div className="grid h-80 w-80 place-items-center text-sm text-[#6e6e73]">
              {error ? "QR unavailable" : "Preparing this hub…"}
            </div>
          )}
        </div>

        {status?.linked ? (
          <div className="mt-6 rounded-2xl bg-white px-5 py-4 text-left shadow-sm">
            <p className="text-sm text-[#6e6e73]">Linked parent account</p>
            <p className="mt-1 text-lg font-semibold">{status.name || "Parent"}</p>
            {status.email ? (
              <p className="text-sm text-[#6e6e73]">{status.email}</p>
            ) : null}
            <p className="mt-3 text-sm leading-5 text-[#6e6e73]">
              They can sign in again on the phone without scanning. This code
              stays reserved for this account.
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-[#6e6e73]">Waiting for a parent to scan…</p>
        )}

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>
    </main>
  );
}
