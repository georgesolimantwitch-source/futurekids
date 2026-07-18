const PRODUCTION_SITE_URL = "https://kidsfuture.vercel.app";

/** Client-side OAuth / password-reset callback URL. Uses the current browser origin. */
export function buildOAuthCallbackUrl(next = "/account"): string {
  const safeNext = next.startsWith("/") ? next : "/account";

  if (typeof window === "undefined") {
    return `${PRODUCTION_SITE_URL}/auth/callback?next=${encodeURIComponent(safeNext)}`;
  }

  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

/** Server-side absolute origin for redirects (never localhost in production). */
export function getRequestOrigin(request: Request): string {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (process.env.NODE_ENV === "development") {
    return origin;
  }

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return siteUrl || PRODUCTION_SITE_URL;
}

/** Build an absolute redirect URL on the current site. */
export function buildRedirectUrl(request: Request, path: string): string {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${getRequestOrigin(request)}${safePath}`;
}
