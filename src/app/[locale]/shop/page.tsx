import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/store/json-ld";
import { Pagination } from "@/components/store/pagination";
import { ProductGrid } from "@/components/store/product-grid";
import { SectionHeading } from "@/components/store/section-heading";
import { ShopFilters } from "@/components/store/shop-filters";
import { getCategories, listProducts } from "@/lib/data/catalog";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { parseListParams } from "@/lib/list-params";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  const p = parseListParams(await searchParams);
  const filtered = Boolean(p.q || p.category || p.minPrice !== undefined || p.maxPrice !== undefined || p.inStock || p.sort !== "newest");
  const meta = pageMetadata({
    locale,
    path: p.page > 1 && !filtered ? `/shop?page=${p.page}` : "/shop",
    title: d.shop.metaTitle,
    description: d.shop.metaDescription,
  });
  // Filtered result pages are thin duplicates: keep them out of search results.
  return filtered ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDictionary(locale);
  const p = parseListParams(await searchParams);
  const [categories, { items, total }] = await Promise.all([getCategories(), listProducts(p)]);
  const totalPages = Math.max(1, Math.ceil(total / p.pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {items.length > 0 && <JsonLd data={itemListJsonLd(locale, items)} />}
      <SectionHeading as="h1" title={d.shop.title} />
      <p className="-mt-4 mb-8 max-w-2xl text-muted-foreground">{d.shop.subtitle}</p>
      <ShopFilters locale={locale} dict={d} action="/shop" categories={categories} params={p} />

      <p className="mb-6 mt-6 text-sm text-muted-foreground" role="status">
        {total === 1 ? d.shop.oneResult : d.shop.results.replace("{n}", String(total))}
      </p>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <h2 className="font-display text-2xl font-semibold">{d.shop.noResults}</h2>
          <p className="mt-2 text-muted-foreground">{d.shop.noResultsHint}</p>
        </div>
      ) : (
        <ProductGrid products={items} locale={locale} dict={d} priorityCount={4} />
      )}

      <Pagination
        locale={locale}
        dict={d}
        path="/shop"
        query={{ q: p.q, category: p.category, sort: p.sort === "newest" ? undefined : p.sort, min: p.minPrice, max: p.maxPrice, stock: p.inStock }}
        page={p.page}
        totalPages={totalPages}
      />
    </div>
  );
}
