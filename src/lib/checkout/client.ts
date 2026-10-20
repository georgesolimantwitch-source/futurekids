/** Redirect to login when checkout requires authentication. */
export function redirectToLoginForCheckout(body: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const nextUrl = new URL("/checkout", window.location.origin);
  if (typeof body.planKey === "string") {
    nextUrl.searchParams.set("planKey", body.planKey);
  }
  if (typeof body.childCount === "number") {
    nextUrl.searchParams.set("children", String(body.childCount));
  }
  if (typeof body.scholarsTier === "string") {
    nextUrl.searchParams.set("scholarsTier", body.scholarsTier);
  }
  if (typeof body.scholarsChildCount === "number") {
    nextUrl.searchParams.set(
      "scholarsChildCount",
      String(body.scholarsChildCount),
    );
  }
  if (typeof body.creator_code === "string" && body.creator_code) {
    nextUrl.searchParams.set("creator_code", body.creator_code);
  }
  const next = `${nextUrl.pathname}${nextUrl.search}`;
  globalThis.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

const CREATOR_STORAGE_KEY = "genlyn_creator_code";

/** Creator code from `?creator_code=` or `?code=` (stored for the session). */
export function creatorCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = (params.get("creator_code") || params.get("code") || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  try {
    if (fromUrl) {
      window.sessionStorage.setItem(CREATOR_STORAGE_KEY, fromUrl);
      // Keep legacy key in sync for older paths
      window.sessionStorage.setItem("earnly_creator_code", fromUrl);
      return fromUrl;
    }
    return (
      window.sessionStorage.getItem(CREATOR_STORAGE_KEY) ||
      window.sessionStorage.getItem("earnly_creator_code") ||
      null
    );
  } catch {
    return fromUrl || null;
  }
}

export function storeCreatorCode(code: string) {
  if (typeof window === "undefined") return;
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  try {
    if (normalized) {
      window.sessionStorage.setItem(CREATOR_STORAGE_KEY, normalized);
      window.sessionStorage.setItem("earnly_creator_code", normalized);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Starts Genlyn custom checkout (Payment Element). Navigates to /checkout
 * with plan params — never redirects to Stripe-hosted Checkout.
 */
export async function postCheckout(requestBody: Record<string, unknown>) {
  const body: Record<string, unknown> = { ...requestBody };
  if (typeof body.creator_code !== "string" || !body.creator_code) {
    const code = creatorCodeFromUrl();
    if (code) body.creator_code = code;
  }

  if (typeof window === "undefined") return null;

  // Soft auth check: if we know we're logged out, go login first
  const params = new URLSearchParams();
  if (typeof body.planKey === "string") params.set("planKey", body.planKey);
  if (typeof body.childCount === "number") {
    params.set("children", String(body.childCount));
  }
  if (typeof body.scholarsTier === "string") {
    params.set("scholarsTier", body.scholarsTier);
  }
  if (typeof body.scholarsChildCount === "number") {
    params.set("scholarsChildCount", String(body.scholarsChildCount));
  }
  if (typeof body.scholarsGenerations === "number") {
    params.set("scholarsGenerations", String(body.scholarsGenerations));
  }
  if (typeof body.scholarsTutorMinutes === "number") {
    params.set("scholarsTutorMinutes", String(body.scholarsTutorMinutes));
  }
  if (typeof body.creator_code === "string" && body.creator_code) {
    params.set("creator_code", String(body.creator_code));
    storeCreatorCode(String(body.creator_code));
  }

  // Persist remaining body for the checkout page to POST
  try {
    window.sessionStorage.setItem(
      "genlyn_checkout_body",
      JSON.stringify(body),
    );
  } catch {
    /* ignore */
  }

  window.location.assign(`/checkout?${params.toString()}`);
  return null;
}
