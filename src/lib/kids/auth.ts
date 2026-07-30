import type { User } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/auth/account";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireBearerUser,
  SubscriptionAuthError,
} from "@/lib/subscriptions/auth";

/**
 * Resolve the caller from a Bearer token (native apps) or cookie session (website).
 */
export async function resolveRequestUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    try {
      const { user } = await requireBearerUser(request);
      return user;
    } catch (error) {
      if (error instanceof SubscriptionAuthError) return null;
      throw error;
    }
  }

  return getAuthenticatedUser();
}

export type ParentAuthResult =
  | { user: User }
  | { error: { message: string; status: number } };

/**
 * Ensure the caller is an authenticated family parent (not individual/child).
 */
export async function requireParentFromRequest(
  request: Request,
): Promise<ParentAuthResult> {
  const user = await resolveRequestUser(request);
  if (!user) {
    return { error: { message: "Authentication required", status: 401 } };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();

  const metaType =
    user.user_metadata?.account_type ?? user.user_metadata?.ecosystem_role;
  const accountType = profile?.account_type ?? metaType;
  if (accountType === "individual" || accountType === "child") {
    return {
      error: {
        message: "Kids are only available on family accounts.",
        status: 403,
      },
    };
  }

  return { user };
}
