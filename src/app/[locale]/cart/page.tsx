import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartView } from "@/components/store/cart-view";
import { SectionHeading } from "@/components/store/section-heading";
import { getStoreSettings } from "@/lib/data/settings";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  // The cart is personal and has no search value.
  return { ...pageMetadata({ locale, path: "/cart", title: d.cart.title, description: d.cart.subtitle }), robots: { index: false, follow: false } };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDictionary(locale);
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <SectionHeading as="h1" title={d.cart.title} />
      <p className="-mt-4 mb-8 text-muted-foreground">{d.cart.subtitle}</p>
      <CartView locale={locale} dict={d} whatsappNumber={settings.whatsappNumber} />
    </div>
  );
}
