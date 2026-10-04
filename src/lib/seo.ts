import type { Metadata } from "next";
import { allowIndexing, getSiteUrl } from "@/lib/env";
import { locales, localePath, type Locale } from "@/lib/i18n/config";

/** Absolute URL for a path in a given language. */
export function absoluteUrl(locale: Locale, path = "/"): string {
  return `${getSiteUrl()}${localePath(locale, path)}`;
}

/** schema.org ItemList for product listings (helps search engines understand a collection page). */
export function itemListJsonLd(
  locale: Locale,
  items: { slug: string; name: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(locale, `/product/${item.slug}`),
      name: item.name,
    })),
  };
}

/** Canonical + hreflang + Open Graph for a page. Pages are noindex until NEXT_PUBLIC_ALLOW_INDEXING=true. */
export function pageMetadata(opts: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  image?: string | null;
  type?: "website" | "article";
  /** Use the title exactly as given (no "| GEOZZY STORE" suffix). */
  absoluteTitle?: boolean;
}): Metadata {
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((l) => [l, localePath(l, opts.path)]),
  );
  languages["x-default"] = localePath("sw", opts.path);
  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: { canonical: localePath(opts.locale, opts.path), languages },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: localePath(opts.locale, opts.path),
      type: opts.type ?? "website",
      images: [{ url: opts.image || `${getSiteUrl()}/brand/og-image.png`, width: opts.image ? undefined : 1200, height: opts.image ? undefined : 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [opts.image || `${getSiteUrl()}/brand/og-image.png`],
    },
    robots: allowIndexing() ? { index: true, follow: true } : { index: false, follow: false },
  };
}
