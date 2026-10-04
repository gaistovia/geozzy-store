import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/store/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getFaqs } from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { fillPlaceholders, t } from "@/lib/i18n/text";
import { pageMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  return pageMetadata({ locale, path: "/faq", title: d.faq.title, description: d.faq.description });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDictionary(locale);
  const [faqs, settings] = await Promise.all([getFaqs(), getStoreSettings()]);
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber);
  const values = { return_days: settings.returnPolicyDays };

  const items = faqs.map((f) => ({
    id: f.id,
    question: fillPlaceholders(t(locale, f.question_sw, f.question_en), values),
    answer: fillPlaceholders(t(locale, f.answer_sw, f.answer_en), values),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      {items.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((i) => ({
              "@type": "Question",
              name: i.question,
              acceptedAnswer: { "@type": "Answer", text: i.answer },
            })),
          }}
        />
      )}
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{d.faq.title}</h1>

      {items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{d.faq.empty}</p>
      ) : (
        <div className="mt-10 divide-y divide-border border-y border-border">
          {items.map((item) => (
            <details key={item.id} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <span aria-hidden="true" className="text-2xl leading-none text-gold-600 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 leading-relaxed text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      )}

      {whatsappUrl && (
        <div className="mt-12 rounded-2xl bg-muted p-6">
          <p className="font-display text-2xl font-semibold">{d.faq.stillNeedHelp}</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "whatsapp", className: "mt-4" })}
          >
            <WhatsAppIcon width={18} height={18} />
            {d.contact.whatsapp}
          </a>
        </div>
      )}
    </div>
  );
}
