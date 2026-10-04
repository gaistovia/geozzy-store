import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getStoreSettings } from "@/lib/data/settings";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  return pageMetadata({ locale, path: "/about", title: d.about.title, description: d.about.description });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDictionary(locale);
  const settings = await getStoreSettings();
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700 dark:text-gold-400">{d.about.title}</p>
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{d.about.heading}</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{d.about.body1}</p>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{d.about.body2}</p>

      <h2 className="mt-14 font-display text-2xl font-semibold">{d.about.stepsTitle}</h2>
      <ol className="mt-5 space-y-4">
        {d.about.steps.map((step, i) => (
          <li key={step} className="flex gap-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-500 font-semibold text-[#1c1708]">
              {i + 1}
            </span>
            <p className="pt-1">{step}</p>
          </li>
        ))}
      </ol>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "whatsapp", size: "lg", className: "mt-12" })}
        >
          <WhatsAppIcon width={20} height={20} />
          {d.about.cta}
        </a>
      )}
    </div>
  );
}
