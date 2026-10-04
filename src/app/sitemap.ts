import type { MetadataRoute } from "next";
import { getLivePromotions, getSitemapEntries } from "@/lib/data/catalog";
import { getSiteUrl } from "@/lib/env";
import { locales, localePath } from "@/lib/i18n/config";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [{ products, categories }, promotions] = await Promise.all([getSitemapEntries(), getLivePromotions()]);

  const entry = (path: string, opts: { lastModified?: string; priority?: number; images?: string[] } = {}): MetadataRoute.Sitemap =>
    locales.map((locale) => ({
      url: `${base}${localePath(locale, path)}`,
      ...(opts.lastModified ? { lastModified: opts.lastModified } : {}),
      changeFrequency: "weekly" as const,
      priority: opts.priority ?? 0.6,
      ...(opts.images && opts.images.length > 0 ? { images: opts.images } : {}),
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${base}${localePath(l, path)}`])),
      },
    }));

  return [
    ...entry("/", { priority: 1 }),
    ...entry("/shop", { priority: 0.9 }),
    ...entry("/new-arrivals", { priority: 0.8 }),
    ...(promotions.length > 0 ? entry("/offers", { priority: 0.7 }) : []),
    ...entry("/about", { priority: 0.4 }),
    ...entry("/faq", { priority: 0.5 }),
    ...entry("/contact", { priority: 0.4 }),
    ...categories.flatMap((c) => entry(`/category/${c.slug}`, { priority: 0.8 })),
    ...products.flatMap((p) => {
      const image = mediaUrl(p.primary_image_path);
      return entry(`/product/${p.slug}`, { lastModified: p.updated_at, priority: 0.7, images: image ? [image] : [] });
    }),
  ];
}
