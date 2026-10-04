import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/store/json-ld";
import { Price } from "@/components/store/price";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductGrid } from "@/components/store/product-grid";
import { ProductPurchase } from "@/components/store/product-purchase";
import { SectionHeading } from "@/components/store/section-heading";
import { getProductBySlug, getProductReviews, listProducts } from "@/lib/data/catalog";
import { getStoreSettings, pick } from "@/lib/data/settings";
import { formatTZS } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, localePath } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/text";
import { mediaUrl } from "@/lib/media";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const [product, settings] = await Promise.all([getProductBySlug(slug), getStoreSettings()]);
  if (!product) return {};
  const d = getDictionary(locale);
  void settings;
  const price = formatTZS(product.current_price);
  const detail =
    t(locale, product.short_description_sw, product.short_description_en) ||
    t(locale, product.description_sw, product.description_en);
  const line = d.product.metaTemplate.replace("{name}", product.name).replace("{price}", price);
  return pageMetadata({
    locale,
    path: `/product/${slug}`,
    title: `${product.name} - ${price}`,
    description: (detail ? `${line} ${detail}` : line).replace(/\s+/g, " ").slice(0, 160),
    image: mediaUrl(product.images[0]?.storage_path),
    type: "website",
  });
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const d = getDictionary(locale);
  const [settings, reviews, related] = await Promise.all([
    getStoreSettings(),
    getProductReviews(product.id),
    product.category
      ? listProducts({ category: product.category.slug, sort: "newest", page: 1, pageSize: 5 })
      : Promise.resolve({ items: [], total: 0 }),
  ]);

  const relatedItems = related.items.filter((p) => p.id !== product.id).slice(0, 4);
  const categoryName = product.category ? t(locale, product.category.name_sw, product.category.name_en) : "";
  const shortDescription = t(locale, product.short_description_sw, product.short_description_en);
  const description = t(locale, product.description_sw, product.description_en);
  const images = product.images
    .map((img) => ({ url: mediaUrl(img.storage_path), alt: img.alt || product.name }))
    .filter((img): img is { url: string; alt: string } => Boolean(img.url));
  const specs = Object.entries(product.specifications).filter(
    ([, v]) => (typeof v === "string" && v.trim()) || typeof v === "number",
  );
  const delivery = pick(settings.deliveryInfo, locale);
  const productUrl = absoluteUrl(locale, `/product/${slug}`);

  const crumbs = [
    { name: d.product.home, href: localePath(locale, "/") },
    { name: d.product.shop, href: localePath(locale, "/shop") },
    ...(product.category
      ? [{ name: categoryName, href: localePath(locale, `/category/${product.category.slug}`) }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: images.map((i) => i.url),
            description: description || shortDescription || product.name,
            ...(product.sku ? { sku: product.sku } : {}),
            ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
            ...(categoryName ? { category: categoryName } : {}),
            url: productUrl,
            inLanguage: locale,
            offers: {
              "@type": "Offer",
              url: productUrl,
              priceCurrency: "TZS",
              price: product.current_price,
              availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: { "@type": "Organization", name: settings.storeName },
              ...(settings.returnPolicyDays > 0
                ? {
                    hasMerchantReturnPolicy: {
                      "@type": "MerchantReturnPolicy",
                      applicableCountry: "TZ",
                      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
                      merchantReturnDays: settings.returnPolicyDays,
                    },
                  }
                : {}),
            },
            // Only real, approved reviews that are also shown on this page.
            ...(reviews.length > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)),
                    reviewCount: reviews.length,
                    bestRating: 5,
                    worstRating: 1,
                  },
                  review: reviews.map((r) => ({
                    "@type": "Review",
                    author: { "@type": "Person", name: r.reviewer_name },
                    datePublished: r.created_at.slice(0, 10),
                    reviewBody: r.body,
                    reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
                  })),
                }
              : {}),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              ...crumbs.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: c.name,
                item: `${absoluteUrl(locale, "/").replace(/\/en$|\/$/, "")}${c.href}`,
              })),
              { "@type": "ListItem", position: crumbs.length + 1, name: product.name, item: productUrl },
            ],
          },
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {crumbs.map((c) => (
            <li key={c.href} className="flex items-center gap-2">
              <Link href={c.href} className="hover:text-foreground hover:underline">
                {c.name}
              </Link>
              <span aria-hidden="true">/</span>
            </li>
          ))}
          <li aria-current="page" className="text-foreground">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery
          images={images}
          name={product.name}
          labels={{ gallery: d.product.gallery, imageOf: d.product.imageOf, zoomHint: d.product.zoomHint }}
        />

        <div className="space-y-6 lg:pt-2">
          <div>
            {categoryName && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700 dark:text-gold-400">
                {categoryName}
              </p>
            )}
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{product.name}</h1>
            {product.brand && <p className="mt-1 text-muted-foreground">{product.brand}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Price current={product.current_price} regular={product.regular_price} wasLabel={d.card.was} size="lg" />
            {product.discount_percent > 0 && (
              <Badge className="bg-danger text-white">{d.product.save.replace("{n}", String(product.discount_percent))}</Badge>
            )}
            {product.is_new && <Badge tone="gold">{d.card.new}</Badge>}
          </div>

          {shortDescription && <p className="text-lg leading-relaxed text-muted-foreground">{shortDescription}</p>}

          <ProductPurchase
            locale={locale}
            dict={d.product}
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              sku: product.sku,
              currentPrice: product.current_price,
              imagePath: product.images[0]?.storage_path ?? null,
            }}
            variants={product.variants.map(({ id, size, color, stock_quantity }) => ({ id, size, color, stock_quantity }))}
            whatsappNumber={settings.whatsappNumber}
            lowStockThreshold={settings.lowStockThreshold}
          />

          <div className="divide-y divide-border border-y border-border text-sm">
            {description && (
              <section className="py-5">
                <h2 className="mb-2 font-semibold">{d.product.description}</h2>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{description}</p>
              </section>
            )}
            {(specs.length > 0 || product.sku || product.brand) && (
              <section className="py-5">
                <h2 className="mb-3 font-semibold">{d.product.specifications}</h2>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                  {product.brand && (
                    <>
                      <dt className="text-muted-foreground">{d.product.brand}</dt>
                      <dd>{product.brand}</dd>
                    </>
                  )}
                  {categoryName && (
                    <>
                      <dt className="text-muted-foreground">{d.product.category}</dt>
                      <dd>{categoryName}</dd>
                    </>
                  )}
                  {product.sku && (
                    <>
                      <dt className="text-muted-foreground">{d.product.sku}</dt>
                      <dd>{product.sku}</dd>
                    </>
                  )}
                  {specs.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd>{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            {delivery && (
              <section className="py-5">
                <h2 className="mb-2 font-semibold">{d.product.delivery}</h2>
                <p className="leading-relaxed text-muted-foreground">{delivery}</p>
              </section>
            )}
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="mt-20" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className="font-display text-3xl font-semibold">{d.product.reviews}</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{r.reviewer_name}</span>
                  <span className="text-gold-600" role="img" aria-label={`${r.rating} / 5`}>{"\u2605".repeat(r.rating)}{"\u2606".repeat(5 - r.rating)}</span>
                  {r.is_verified_purchase && <Badge tone="success">{d.product.verified}</Badge>}
                </p>
                <p className="mt-2 text-muted-foreground">{r.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedItems.length > 0 && (
        <section className="mt-24">
          <SectionHeading title={d.product.related} />
          <ProductGrid products={relatedItems} locale={locale} dict={d} />
        </section>
      )}
    </div>
  );
}
