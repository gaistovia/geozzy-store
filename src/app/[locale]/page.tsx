import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/store/json-ld";
import { ProductGrid } from "@/components/store/product-grid";
import { ProductImage } from "@/components/store/product-image";
import { SectionHeading } from "@/components/store/section-heading";
import { WhatsAppIcon } from "@/components/ui/icons";
import { buttonVariants } from "@/components/ui/button";
import { asArray, asObject, localizedField } from "@/lib/content";
import { getCategories, getHomepageSections, getLivePromotions, listProducts } from "@/lib/data/catalog";
import { getStoreSettings, pick } from "@/lib/data/settings";
import { getSiteUrl } from "@/lib/env";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, localePath } from "@/lib/i18n/config";
import { fillPlaceholders, t } from "@/lib/i18n/text";
import { mediaUrl } from "@/lib/media";
import { absoluteUrl, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  const settings = await getStoreSettings();
  void settings;
  return pageMetadata({
    locale,
    path: "/",
    title: d.meta.homeTitle,
    description: d.meta.description,
    absoluteTitle: true,
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const d = getDictionary(locale);
  const [settings, sections, categories, newest, featured, promotions] = await Promise.all([
    getStoreSettings(),
    getHomepageSections(),
    getCategories(),
    listProducts({ sort: "newest", isNew: true, page: 1, pageSize: 8 }),
    listProducts({ sort: "newest", isFeatured: true, page: 1, pageSize: 8 }),
    getLivePromotions(),
  ]);
  const promo = promotions.find((p) => p.banner_image_path) ?? promotions[0];
  const promoBanner = mediaUrl(promo?.banner_image_path);

  const section = (key: string) => sections.find((s) => s.section_key === key);
  const hero = asObject(section("hero")?.content);
  const why = asObject(section("why_shop")?.content);
  const cta = asObject(section("whatsapp_cta")?.content);

  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber);
  const heroImage = mediaUrl(section("hero")?.image_path);
  const tagline = pick(settings.tagline, locale);
  const headline = localizedField(hero.headline, locale) || tagline;
  const description = localizedField(hero.description, locale) || d.meta.description;
  const primaryCta = localizedField(hero.primary_cta, locale) || d.nav.shop;
  const secondaryCta = localizedField(hero.secondary_cta, locale) || d.common.viewAll;

  const showcase = [...newest.items, ...featured.items].filter((p) => p.primary_image_path);
  const heroProducts = showcase.filter((p, i) => showcase.findIndex((x) => x.id === p.id) === i).slice(0, 2);

  const featuredCategories = categories.some((c) => c.is_featured)
    ? categories.filter((c) => c.is_featured)
    : categories;
  const hasProducts = newest.items.length > 0 || featured.items.length > 0;
  const whyItems = asArray(why.items)
    .map((item) => asObject(item))
    .map((item) => ({
      title: localizedField(item.title, locale),
      text: fillPlaceholders(localizedField(item.text, locale), { return_days: settings.returnPolicyDays }),
    }))
    .filter((item) => item.title);

  const siteUrl = getSiteUrl();

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "OnlineStore",
            "@id": `${siteUrl}/#organization`,
            name: settings.storeName,
            url: siteUrl,
            description: d.meta.description,
            slogan: tagline,
            logo: { "@type": "ImageObject", url: `${siteUrl}/brand/logo-full.png`, width: 1024, height: 1024 },
            image: `${siteUrl}/brand/og-image.png`,
            ...(settings.email ? { email: settings.email } : {}),
            ...(settings.address ? { address: { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "TZ" } } : {}),
            currenciesAccepted: "TZS",
            knowsLanguage: ["sw", "en"],
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "customer service",
                telephone: `+${settings.whatsappNumber.replace(/\D/g, "")}`,
                availableLanguage: ["Swahili", "English"],
                url: whatsappUrl ?? undefined,
              },
            ],
            sameAs: [settings.instagram, settings.facebook, settings.tiktok, settings.youtube].filter((u) =>
              /^https?:\/\//.test(u),
            ),
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            name: settings.storeName,
            url: absoluteUrl(locale, "/"),
            inLanguage: locale,
            publisher: { "@id": `${siteUrl}/#organization` },
            potentialAction: {
              "@type": "SearchAction",
              target: `${absoluteUrl(locale, "/shop")}?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          ...(newest.items.length > 0 || featured.items.length > 0
            ? [itemListJsonLd(locale, [...newest.items, ...featured.items].filter((p, i, all) => all.findIndex((x) => x.id === p.id) === i))]
            : []),
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-[#100d06] text-[#f5f0e1]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">{tagline}</p>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">{headline}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#cfc7b0]">{description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={localePath(locale, "/shop")} className={buttonVariants({ size: "lg" })}>
                {primaryCta}
              </Link>
              <Link
                href={categories.length > 0 ? "#categories" : localePath(locale, "/new-arrivals")}
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "border-white/25 text-white hover:bg-white/10",
                })}
              >
                {secondaryCta}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {heroImage ? (
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
                <Image src={heroImage} alt={d.home.heroImageAlt} fill priority sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
              </div>
            ) : heroProducts.length > 0 ? (
              <div className="relative aspect-[4/5]">
                <div className="absolute inset-0 right-10 overflow-hidden rounded-3xl bg-white/5">
                  <ProductImage
                    path={heroProducts[0]?.primary_image_path}
                    alt={heroProducts[0]?.name ?? ""}
                    sizes="(min-width: 1024px) 35vw, 80vw"
                    priority
                  />
                </div>
                {heroProducts[1] && (
                  <div className="absolute bottom-0 right-0 aspect-square w-2/5 overflow-hidden rounded-2xl border-4 border-[#100d06] bg-white/5">
                    <ProductImage path={heroProducts[1].primary_image_path} alt={heroProducts[1].name} sizes="20vw" />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black">
                <Image src="/brand/logo-mark.png" alt="" width={661} height={604} priority className="w-4/5" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Plain-language summary: what this site is (read by people, search engines and AI answer engines) */}
      <section className="mx-auto max-w-3xl px-4 pt-14 text-center sm:px-6" aria-label={settings.storeName}>
        <p className="text-lg leading-relaxed text-muted-foreground">{d.home.intro}</p>
      </section>

      {/* Live promotion banner */}
      {promo && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6" aria-label={d.offers.title}>
          <Link
            href={localePath(locale, "/offers")}
            className="group relative flex min-h-40 items-end overflow-hidden rounded-3xl bg-gradient-to-br from-gold-300 to-gold-500 p-6 text-[#1c1708] sm:min-h-52 sm:p-8"
          >
            {promoBanner && (
              <>
                <Image src={promoBanner} alt="" fill sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
              </>
            )}
            <span className={"relative " + (promoBanner ? "text-white" : "")}>
              <span className="block font-display text-3xl font-semibold sm:text-4xl">{promo.name}</span>
              {t(locale, promo.description_sw, promo.description_en) && (
                <span className="mt-1 block max-w-xl text-sm sm:text-base">{t(locale, promo.description_sw, promo.description_en)}</span>
              )}
              <span className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">{d.offers.view}</span>
            </span>
          </Link>
        </section>
      )}

      {/* Categories */}
      {featuredCategories.length > 0 && (
        <section id="categories" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-20 sm:px-6">
          <SectionHeading eyebrow={d.home.categoriesSub} title={d.home.categoriesTitle} />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {featuredCategories.map((c) => (
              <li key={c.id}>
                <Link
                  href={localePath(locale, `/category/${c.slug}`)}
                  className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl bg-gradient-to-br from-gold-100 to-gold-300 p-4 dark:from-[#2a2310] dark:to-[#1b170c]"
                >
                  {c.image_path && (
                    <ProductImage
                      path={c.image_path}
                      alt=""
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  {c.image_path && <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />}
                  <span
                    className={
                      "relative font-display text-2xl font-semibold leading-tight " +
                      (c.image_path ? "text-white" : "text-gold-900 dark:text-gold-300")
                    }
                  >
                    {t(locale, c.name_sw, c.name_en)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {newest.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <SectionHeading
            eyebrow={d.home.newSub}
            title={d.home.newTitle}
            href={localePath(locale, "/new-arrivals")}
            linkLabel={d.common.viewAll}
          />
          <ProductGrid products={newest.items} locale={locale} dict={d} />
        </section>
      )}

      {featured.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <SectionHeading
            eyebrow={d.home.featuredSub}
            title={d.home.featuredTitle}
            href={localePath(locale, "/shop")}
            linkLabel={d.common.viewAll}
          />
          <ProductGrid products={featured.items} locale={locale} dict={d} />
        </section>
      )}

      {!hasProducts && (
        <section className="mx-auto max-w-3xl px-4 pt-20 text-center sm:px-6">
          <h2 className="font-display text-3xl font-semibold">{d.home.emptyTitle}</h2>
          <p className="mt-3 text-muted-foreground">{d.home.emptyBody}</p>
        </section>
      )}

      {whyItems.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
          <SectionHeading title={d.home.whyTitle} />
          <ol className="grid gap-4 md:grid-cols-3">
            {whyItems.map((item, i) => (
              <li key={item.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="font-display text-4xl font-semibold text-gold-600">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-muted-foreground">{item.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {whatsappUrl && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#100d06] p-8 text-[#f5f0e1] sm:p-12 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                {localizedField(cta.headline, locale) || d.contact.heading}
              </h2>
              <p className="mt-3 text-[#cfc7b0]">{localizedField(cta.text, locale) || d.contact.body}</p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "whatsapp", size: "lg", className: "shrink-0" })}
            >
              <WhatsAppIcon width={20} height={20} />
              {d.contact.whatsapp}
            </a>
          </div>
        </section>
      )}
    </>
  );
}
