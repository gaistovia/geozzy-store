export const locales = ["sw", "en"] as const;
export type Locale = (typeof locales)[number];

/** Swahili is the default language and lives at the root: "/", "/shop". English is under "/en". */
export const defaultLocale: Locale = "sw";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Builds a URL path for a language. ALWAYS use this for internal links.
 *   localePath("sw", "/shop") -> "/shop"
 *   localePath("en", "/shop") -> "/en/shop"
 *   localePath("en", "/")     -> "/en"
 */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/**
 * Splits a pathname into its language and the language-free path.
 * Also understands "/sw/..." because the server sees the internally rewritten
 * Swahili path while the browser sees the clean one; both must give the same result.
 */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return { locale, path: "/" };
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, path: pathname.slice(locale.length + 1) };
    }
  }
  return { locale: defaultLocale, path: pathname || "/" };
}
