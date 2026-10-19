/** Genlyn Creator Program — 20% of Hub hardware and subscription revenue. */

export const CREATOR_COMMISSION_RATE = 0.2;
export const CREATOR_CODE_MIN = 4;
export const CREATOR_CODE_MAX = 12;
export const CREATOR_KIND = "genlyn_creator";

export function commissionCents(grossCents: number): number {
  return Math.floor(Math.max(0, grossCents) * CREATOR_COMMISSION_RATE);
}

/** Short codes: letters + digits, no confusing 0/O/1/I. */
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

export function suggestCreatorCode(seed: string): string {
  const base = normalizeCreatorCode(seed.replace(/@.*/, "").slice(0, 6)) || "GEN";
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return normalizeCreatorCode(`${base}${suffix}`).slice(0, CREATOR_CODE_MAX);
}
