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
import { t } from "@/lib/i18n/text";
import { parseListParams } from "@/lib/list-params";
import { absoluteUrl, itemListJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) return {};
  const name = t(locale, category.name_sw, category.name_en);
  return pageMetadata({
    locale,
    path: `/category/${slug}`,
    title: `${name} - ${d.shop.buyOnline}`,
    description:
      t(locale, category.description_sw, category.description_en) || `${name}: ${d.shop.metaDescription}`,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDictionary(locale);
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const p = parseListParams(await searchParams, { category: slug });
  const { items, total } = await listProducts(p);
  const totalPages = Math.max(1, Math.ceil(total / p.pageSize));
  const name = t(locale, category.name_sw, category.name_en);
  const description = t(locale, category.description_sw, category.description_en);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: d.common.home, item: absoluteUrl(locale, "/") },
            { "@type": "ListItem", position: 2, name: d.shop.title, item: absoluteUrl(locale, "/shop") },
            { "@type": "ListItem", position: 3, name, item: absoluteUrl(locale, `/category/${slug}`) },
          ],
        }}
      />
      {items.length > 0 && <JsonLd data={itemListJsonLd(locale, items)} />}
      <SectionHeading as="h1" title={name} />
      {description && <p className="-mt-4 mb-8 max-w-2xl text-muted-foreground">{description}</p>}

      <ShopFilters locale={locale} dict={d} action={`/category/${slug}`} categories={categories} params={p} showCategory={false} />
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
        path={`/category/${slug}`}
        query={{ q: p.q, sort: p.sort === "newest" ? undefined : p.sort, min: p.minPrice, max: p.maxPrice, stock: p.inStock }}
        page={p.page}
        totalPages={totalPages}
      />
    </div>
  );
}
