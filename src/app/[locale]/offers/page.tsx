import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/store/product-grid";
import { SectionHeading } from "@/components/store/section-heading";
import { getLivePromotions, listProducts } from "@/lib/data/catalog";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/text";
import { mediaUrl } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  return pageMetadata({ locale, path: "/offers", title: d.offers.title, description: d.offers.description });
}

export default async function OffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDictionary(locale);
  const promotions = await getLivePromotions();
  const withProducts = await Promise.all(
    promotions.map(async (promo) => ({
      promo,
      products: promo.product_ids.length
        ? (await listProducts({ ids: promo.product_ids, sort: "newest", page: 1, pageSize: 24 })).items
        : [],
    })),
  );
  const dateFormat = new Intl.DateTimeFormat(locale === "sw" ? "sw-TZ" : "en-GB", { dateStyle: "long", timeZone: "Africa/Dar_es_Salaam" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <SectionHeading as="h1" title={d.offers.title} />
      {withProducts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">{d.offers.empty}</p>
      ) : (
        <div className="space-y-20">
          {withProducts.map(({ promo, products }) => {
            const banner = mediaUrl(promo.banner_image_path);
            const description = t(locale, promo.description_sw, promo.description_en);
            return (
              <section key={promo.id} aria-labelledby={`promo-${promo.id}`}>
                {banner && (
                  <div className="relative mb-6 aspect-[21/9] overflow-hidden rounded-3xl bg-muted">
                    <Image src={banner} alt="" fill sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
                  </div>
                )}
                <h2 id={`promo-${promo.id}`} className="font-display text-3xl font-semibold">{promo.name}</h2>
                {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
                {promo.ends_at && <p className="mt-2 text-sm font-medium text-gold-700 dark:text-gold-400">{d.offers.ends.replace("{date}", dateFormat.format(new Date(promo.ends_at)))}</p>}
                <div className="mt-8">
                  {products.length > 0 ? <ProductGrid products={products} locale={locale} dict={d} /> : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
