import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { site } from "@/lib/site";
import type { Locale } from "@/lib/i18n/config";

export interface Localized {
  sw: string;
  en: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: Localized;
  whatsappNumber: string;
  email: string;
  address: string;
  businessHours: Localized;
  announcement: Localized;
  deliveryInfo: Localized;
  footerText: Localized;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  currency: string;
  returnPolicyDays: number;
  lowStockThreshold: number;
}

const empty: Localized = { sw: "", en: "" };

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: site.name,
  tagline: { sw: "Viatu • Saa Kali", en: "Shoes • Stylish Watches" },
  whatsappNumber: site.fallbackWhatsAppNumber,
  email: site.fallbackEmail,
  address: "",
  businessHours: empty,
  announcement: empty,
  deliveryInfo: empty,
  footerText: empty,
  instagram: "",
  facebook: "",
  tiktok: "",
  youtube: "",
  currency: "TZS",
  returnPolicyDays: 3,
  lowStockThreshold: 3,
};

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asLocalized(value: unknown, fallback: Localized): Localized {
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    return { sw: asString(v.sw, fallback.sw), en: asString(v.en, fallback.en) };
  }
  return fallback;
}

/** Converts raw store_settings rows into a typed object, filling gaps with defaults. */
export function parseSettings(rows: { key: string; value: unknown }[]): StoreSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const d = DEFAULT_SETTINGS;
  return {
    storeName: asString(map.get("store_name"), d.storeName),
    tagline: asLocalized(map.get("tagline"), d.tagline),
    whatsappNumber: asString(map.get("whatsapp_number"), d.whatsappNumber) || d.whatsappNumber,
    email: asString(map.get("email"), d.email),
    address: asString(map.get("address"), d.address),
    businessHours: asLocalized(map.get("business_hours"), d.businessHours),
    announcement: asLocalized(map.get("announcement"), d.announcement),
    deliveryInfo: asLocalized(map.get("delivery_info"), d.deliveryInfo),
    footerText: asLocalized(map.get("footer_text"), d.footerText),
    instagram: asString(map.get("social_instagram"), d.instagram),
    facebook: asString(map.get("social_facebook"), d.facebook),
    tiktok: asString(map.get("social_tiktok"), d.tiktok),
    youtube: asString(map.get("social_youtube"), d.youtube),
    currency: asString(map.get("currency"), d.currency),
    returnPolicyDays: asNumber(map.get("return_policy_days"), d.returnPolicyDays),
    lowStockThreshold: asNumber(map.get("low_stock_threshold"), d.lowStockThreshold),
  };
}

const fetchSettings = unstable_cache(
  async (): Promise<StoreSettings> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("key, value")
      .eq("is_public", true);
    if (error) throw new Error(`Could not load store settings: ${error.message}`);
    return parseSettings(data ?? []);
  },
  ["store-settings"],
  { tags: ["settings"], revalidate: 300 },
);

/**
 * Public store settings (WhatsApp number, contact info, announcement...).
 * Cached for 5 minutes and refreshed instantly by revalidateTag("settings")
 * when the owner saves settings in the admin. Falls back to safe defaults if
 * the database is unreachable so the site never breaks.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    return await fetchSettings();
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Picks the value for a language, falling back to the other language if empty. */
export function pick(value: Localized, locale: Locale): string {
  const other: Locale = locale === "sw" ? "en" : "sw";
  return value[locale] || value[other] || "";
}
