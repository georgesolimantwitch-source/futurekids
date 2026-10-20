/** Genlyn Creator Program — 20% of Hub hardware and subscription revenue. */

export const CREATOR_COMMISSION_RATE = 0.2;
export const CREATOR_CODE_MIN = 4;
export const CREATOR_CODE_MAX = 6;
export const CREATOR_KIND = "genlyn_creator";

/** Letters + digits without confusing 0/O/1/I. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function commissionCents(grossCents: number): number {
  return Math.floor(Math.max(0, grossCents) * CREATOR_COMMISSION_RATE);
}

/** Short codes: 4–6 letters/digits. */
export function normalizeCreatorCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CREATOR_CODE_MAX);
}

export function isValidCreatorCodeFormat(code: string): boolean {
  const normalized = normalizeCreatorCode(code);
  return (
    normalized.length >= CREATOR_CODE_MIN &&
    normalized.length <= CREATOR_CODE_MAX &&
    /^[A-Z0-9]+$/.test(normalized)
  );
}

function randomCodeChars(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]!;
  }
  return out;
}

/**
 * Suggest a unique-looking 6-char code from a name/email seed.
 * Uniqueness is enforced at insert time; this just builds candidates.
 */
export function suggestCreatorCode(seed: string): string {
  const cleaned = normalizeCreatorCode(seed.replace(/@.*/, ""))
    .replace(/[01IO]/g, "");
  const prefix = (cleaned.slice(0, 3) || "GEN").padEnd(3, "X").slice(0, 3);
  return `${prefix}${randomCodeChars(3)}`.slice(0, CREATOR_CODE_MAX);
}
