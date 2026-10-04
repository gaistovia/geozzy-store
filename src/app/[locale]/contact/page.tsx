import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getStoreSettings, pick } from "@/lib/data/settings";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  return pageMetadata({ locale, path: "/contact", title: d.contact.title, description: d.contact.description });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDictionary(locale);
  const settings = await getStoreSettings();
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber);
  const hours = pick(settings.businessHours, locale);
  const socials = [
    { label: "Instagram", url: settings.instagram },
    { label: "Facebook", url: settings.facebook },
    { label: "TikTok", url: settings.tiktok },
    { label: "YouTube", url: settings.youtube },
  ].filter((s) => /^https?:\/\//.test(s.url));

  const details: { label: string; content: React.ReactNode }[] = [];
  if (settings.email) {
    details.push({
      label: d.contact.email,
      content: (
        <a className="underline underline-offset-4" href={`mailto:${settings.email}`}>
          {settings.email}
        </a>
      ),
    });
  }
  if (settings.address) details.push({ label: d.contact.address, content: settings.address });
  if (hours) details.push({ label: d.contact.hours, content: <span className="whitespace-pre-line">{hours}</span> });
  if (socials.length > 0) {
    details.push({
      label: d.contact.social,
      content: (
        <span className="flex flex-wrap gap-x-4">
          {socials.map((s) => (
            <a key={s.label} className="underline underline-offset-4" href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
        </span>
      ),
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700 dark:text-gold-400">{d.contact.title}</p>
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{d.contact.heading}</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{d.contact.body}</p>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "whatsapp", size: "lg", className: "mt-8" })}
        >
          <WhatsAppIcon width={20} height={20} />
          {d.contact.whatsapp}
        </a>
      )}

      {details.length > 0 && (
        <dl className="mt-12 divide-y divide-border border-y border-border">
          {details.map((item) => (
            <div key={item.label} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
              <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
              <dd>{item.content}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
