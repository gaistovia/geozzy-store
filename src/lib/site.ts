/**
 * Static site facts. Anything the owner should be able to change lives in the
 * database (store_settings) instead; these are only fallbacks used when the
 * database cannot be reached.
 */
export const site = {
  name: "GEOZZY STORE",
  /** Fallback only. The live value is the `whatsapp_number` store setting. */
  fallbackWhatsAppNumber: "255786282109",
  /** Fallback only. The live value is the `email` store setting. */
  fallbackEmail: "geozzystore@gmail.com",
  /** The current Blogger store, linked while the new site is being built. */
  legacyStoreUrl: "https://geozzystore.blogspot.com",
} as const;
