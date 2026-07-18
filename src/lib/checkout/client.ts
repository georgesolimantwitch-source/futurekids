/** Redirect to login when checkout requires authentication. */
export function redirectToLoginForCheckout() {
  if (typeof window === "undefined") return;
  const next = `${window.location.pathname}${window.location.search}`;
  globalThis.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

export async function postCheckout(body: Record<string, unknown>) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as { url?: string; error?: string; code?: string };

  if (res.status === 401 || data.code === "AUTH_REQUIRED") {
    redirectToLoginForCheckout();
    return null;
  }

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Could not start checkout");
  }

  return data.url;
}
