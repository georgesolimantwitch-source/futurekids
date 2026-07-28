/** Redirect to login when checkout requires authentication. */
export function redirectToLoginForCheckout(body: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const nextUrl = new URL(window.location.href);
  if (typeof body.planKey === "string") {
    nextUrl.searchParams.set("checkoutPlan", body.planKey);
  }
  if (typeof body.childCount === "number") {
    nextUrl.searchParams.set("children", String(body.childCount));
  }
  const next = `${nextUrl.pathname}${nextUrl.search}`;
  globalThis.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

export async function postCheckout(body: Record<string, unknown>) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let data: { url?: string; error?: string; code?: string } = {};
  try {
    data = raw ? (JSON.parse(raw) as typeof data) : {};
  } catch {
    throw new Error(
      res.ok ? "Could not start checkout" : `Could not start checkout (${res.status})`,
    );
  }

  if (res.status === 401 || data.code === "AUTH_REQUIRED") {
    redirectToLoginForCheckout(body);
    return null;
  }

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Could not start checkout");
  }

  return data.url;
}
