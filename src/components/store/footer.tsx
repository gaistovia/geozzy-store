import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { WhatsAppIcon } from "@/components/ui/icons";
import { buttonVariants } from "@/components/ui/button";
import { pick, type StoreSettings } from "@/lib/data/settings";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function Footer({
  locale,
  dict,
  settings,
}: {
  locale: Locale;
  dict: Dictionary;
  settings: StoreSettings;
}) {
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber);
  const hours = pick(settings.businessHours, locale);
  const footerText = pick(settings.footerText, locale);
  const socials = [
    { label: "Instagram", url: settings.instagram },
    { label: "Facebook", url: settings.facebook },
    { label: "TikTok", url: settings.tiktok },
    { label: "YouTube", url: settings.youtube },
  ].filter((s) => /^https?:\/\//.test(s.url));

  const shopLinks = [
    { href: localePath(locale, "/shop"), label: dict.nav.shop },
    { href: localePath(locale, "/new-arrivals"), label: dict.nav.newArrivals },
    { href: localePath(locale, "/cart"), label: dict.nav.cart },
  ];
  const helpLinks = [
    { href: localePath(locale, "/about"), label: dict.nav.about },
    { href: localePath(locale, "/faq"), label: dict.nav.faq },
    { href: localePath(locale, "/contact"), label: dict.nav.contact },
  ];

  return (
    <footer data-theme="dark" className="mt-24 border-t border-border bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo variant="full" height={170} />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">{pick(settings.tagline, locale)}</p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{footerText || dict.footer.orderNote}</p>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "whatsapp", size: "sm", className: "mt-5" })}
            >
              <WhatsAppIcon width={18} height={18} />
              {dict.footer.whatsappLabel}
            </a>
          )}
        </div>

        <FooterColumn title={dict.footer.shop} links={shopLinks} />
        <FooterColumn title={dict.footer.help} links={helpLinks} />

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider">{dict.footer.contact}</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {settings.email && (
              <li>
                <a className="hover:text-foreground" href={`mailto:${settings.email}`}>
                  {settings.email}
                </a>
              </li>
            )}
            {settings.address && <li>{settings.address}</li>}
            {hours && <li className="whitespace-pre-line">{hours}</li>}
            {socials.map((s) => (
              <li key={s.label}>
                <a className="hover:text-foreground" href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} {settings.storeName}. {dict.footer.rights}
          </p>
          <p>
            {dict.footer.designedBy}{" "}
            <a className="font-medium text-foreground hover:underline" href="mailto:gaistovia@gmail.com">
              GA Istovia
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.href}>
            <Link className="hover:text-foreground" href={l.href}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
