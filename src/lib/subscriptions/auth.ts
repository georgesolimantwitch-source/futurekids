import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export class SubscriptionAuthError extends Error {
  readonly status = 401;
}

/** Validate a Genlyn Supabase access token without cookie/session fallback. */
export async function requireBearerUser(request: Request): Promise<{
  token: string;
  user: User;
}> {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    throw new SubscriptionAuthError("A Genlyn bearer token is required");
  }

  const token = match[1];
  const admin = createAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    throw new SubscriptionAuthError("The Genlyn bearer token is invalid");
  }

  return { token, user: data.user };
}
