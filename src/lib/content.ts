import type { Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/text";

/** Reads a {"sw": "...", "en": "..."} value from admin-editable JSON content. */
export function localizedField(value: unknown, locale: Locale): string {
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    return t(locale, typeof v.sw === "string" ? v.sw : "", typeof v.en === "string" ? v.en : "");
  }
  return "";
}

export function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
