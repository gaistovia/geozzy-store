import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/cormorant-garamond";
import "../globals.css";
import { CartProvider } from "@/components/store/cart-provider";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";
import { getLivePromotions } from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";
import { allowIndexing, getSiteUrl } from "@/lib/env";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, locales } from "@/lib/i18n/config";
import { site } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0a05",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  const verification: NonNullable<Metadata["verification"]> = {};
  if (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION) verification.google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  if (process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION) verification.yandex = process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION;
  if (process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION) {
    verification.other = { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION };
  }

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: d.meta.homeTitle, template: `%s | ${site.name}` },
    description: d.meta.description,
    keywords: d.meta.keywords,
    applicationName: site.name,
    authors: [{ name: "GA Istovia", url: "mailto:gaistovia@gmail.com" }],
    creator: "GA Istovia",
    publisher: site.name,
    category: "shopping",
    formatDetection: { telephone: false, email: false, address: false },
    robots: allowIndexing()
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
      : { index: false, follow: false },
    verification: Object.keys(verification).length ? verification : undefined,
    openGraph: {
      siteName: site.name,
      type: "website",
      locale: locale === "sw" ? "sw_TZ" : "en_US",
      alternateLocale: locale === "sw" ? ["en_US"] : ["sw_TZ"],
      images: [{ url: "/brand/og-image.png", width: 1200, height: 630, alt: `${site.name} - Viatu • Saa Kali` }],
    },
    twitter: { card: "summary_large_image", images: ["/brand/og-image.png"] },
    manifest: "/manifest.webmanifest",
  };
}

// Light mode is the default. Dark is used only if the visitor switched to it (saved on their device).
const themeScript = `(function(){try{var t=localStorage.getItem('gz-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})()`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDictionary(locale);
  const [settings, promotions] = await Promise.all([getStoreSettings(), getLivePromotions()]);

  return (
    <html lang={locale} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && <link rel="preconnect" href={new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin} />}
      </head>
      <body>
        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#1c1708]"
          >
            {d.common.skipToContent}
          </a>
          <Header locale={locale} dict={d} settings={settings} hasOffers={promotions.length > 0} />
          <main id="main">{children}</main>
          <Footer locale={locale} dict={d} settings={settings} />
          <WhatsAppFloat number={settings.whatsappNumber} label={d.whatsappFloat} />
        </CartProvider>
      </body>
    </html>
  );
}
