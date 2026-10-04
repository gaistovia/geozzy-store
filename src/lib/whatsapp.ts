/**
 * WhatsApp helpers. GEOZZY STORE takes orders through WhatsApp only -
 * there is no online payment anywhere in this project.
 *
 * The store number is NOT hardcoded in components: it comes from the
 * `whatsapp_number` store setting (see lib/data/settings.ts).
 */

/**
 * Turns a phone number into the digits-only international format wa.me expects.
 * Accepts "+255 786 282 109", "0786 282 109", "00255786282109", "255786282109".
 * Returns null when the number is not usable.
 */
export function normalizeWhatsAppNumber(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Tanzanian local format 0XXXXXXXXX -> 255XXXXXXXXX
  if (/^0\d{9}$/.test(digits)) digits = `255${digits.slice(1)}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** Builds a safely encoded https://wa.me link, or null if the number is invalid. */
export function buildWhatsAppUrl(number: string, message?: string): string | null {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
