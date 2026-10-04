/** East Africa Time is UTC+3 all year (no daylight saving), which keeps these conversions simple. */
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

/** "2026-10-03T14:30" typed in a datetime-local input (EAT) -> ISO string, or null if empty/invalid. */
export function eatInputToIso(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const date = new Date(`${v}:00+03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** ISO timestamp -> value for a datetime-local input, shown in EAT. */
export function isoToEatInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + EAT_OFFSET_MS).toISOString().slice(0, 16);
}
