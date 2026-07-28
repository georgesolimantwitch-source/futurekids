import type { AccountType } from "@/lib/auth/types";

export const SIGNUP_ACCOUNT_TYPE_KEY = "fk_signup_account_type";

export function persistSignupAccountType(type: AccountType) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SIGNUP_ACCOUNT_TYPE_KEY, type);
}

export function readSignupAccountType(): AccountType | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(SIGNUP_ACCOUNT_TYPE_KEY);
  return value === "parent" || value === "individual" ? value : null;
}

export function clearSignupAccountType() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SIGNUP_ACCOUNT_TYPE_KEY);
}

export function metadataForAccountType(accountType: AccountType) {
  return {
    account_type: accountType,
    ecosystem_role: accountType === "parent" ? "parent" : "individual",
  };
}

/**
 * Genlyn website signup is parent-only. Ignore any client-supplied `individual`
 * so account type cannot be tampered via the web setup flow.
 * Native Ballr/Scholars signup must send `source: "native_app"`.
 */
export function resolveSetupAccountType(input: {
  accountType?: AccountType | null;
  source?: string | null;
}): AccountType {
  if (input.source === "native_app" && input.accountType === "individual") {
    return "individual";
  }
  return "parent";
}
