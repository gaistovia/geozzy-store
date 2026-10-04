import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/store/pagination";
import { ProductGrid } from "@/components/store/product-grid";
import { SectionHeading } from "@/components/store/section-heading";
import { ShopFilters } from "@/components/store/shop-filters";
import { getCategories, listProducts } from "@/lib/data/catalog";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { parseListParams } from "@/lib/list-params";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  return pageMetadata({ locale, path: "/new-arrivals", title: d.shop.newArrivalsTitle, description: d.shop.newArrivalsSub });
}

export default async function NewArrivalsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDictionary(locale);
  const p = parseListParams(await searchParams, { isNew: true });
  const [categories, { items, total }] = await Promise.all([getCategories(), listProducts(p)]);
  const totalPages = Math.max(1, Math.ceil(total / p.pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <SectionHeading as="h1" eyebrow={d.shop.newArrivalsSub} title={d.shop.newArrivalsTitle} />
      <ShopFilters locale={locale} dict={d} action="/new-arrivals" categories={categories} params={p} />
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
        path="/new-arrivals"
        query={{ q: p.q, category: p.category, sort: p.sort === "newest" ? undefined : p.sort, min: p.minPrice, max: p.maxPrice, stock: p.inStock }}
        page={p.page}
        totalPages={totalPages}
      />
    </div>
  );
}
