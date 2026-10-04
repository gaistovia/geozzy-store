import type { Locale } from "./config";

/** Picks the Swahili or English text, falling back to the other language if one is empty. */
export function t(locale: Locale, sw: string | null | undefined, en: string | null | undefined): string {
  const primary = locale === "sw" ? sw : en;
  const secondary = locale === "sw" ? en : sw;
  return (primary && primary.trim()) || (secondary && secondary.trim()) || "";
}

/** Replaces {{return_days}} style placeholders in admin-editable text. */
export function fillPlaceholders(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
