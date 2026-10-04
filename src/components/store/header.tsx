import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { CartButton } from "@/components/store/cart-button";
import { MobileMenu, type MenuLink } from "@/components/store/mobile-menu";
import { SearchForm } from "@/components/store/search-form";
import { ThemeToggle } from "@/components/store/theme-toggle";
import { pick, type StoreSettings } from "@/lib/data/settings";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Header({
  locale,
  dict,
  settings,
  hasOffers = false,
}: {
  locale: Locale;
  dict: Dictionary;
  settings: StoreSettings;
  hasOffers?: boolean;
}) {
  const links: MenuLink[] = [
    { href: localePath(locale, "/shop"), label: dict.nav.shop },
    { href: localePath(locale, "/new-arrivals"), label: dict.nav.newArrivals },
    ...(hasOffers ? [{ href: localePath(locale, "/offers"), label: dict.nav.offers }] : []),
    { href: localePath(locale, "/about"), label: dict.nav.about },
    { href: localePath(locale, "/faq"), label: dict.nav.faq },
    { href: localePath(locale, "/contact"), label: dict.nav.contact },
  ];
  const announcement = pick(settings.announcement, locale);

  return (
    <>
      {announcement && (
        <div className="bg-gold-900 px-4 py-2 text-center text-sm text-gold-50">{announcement}</div>
      )}
      <header data-theme="dark" className="sticky top-0 z-40 border-b border-border bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <MobileMenu
            links={links}
            openLabel={dict.nav.menu}
            closeLabel={dict.nav.closeMenu}
            navLabel={dict.nav.primary}
          >
            <SearchForm locale={locale} dict={dict} id="search-mobile" />
          </MobileMenu>

          <Link href={localePath(locale, "/")} aria-label={settings.storeName} className="shrink-0">
            <Logo variant="wordmark" height={34} priority />
          </Link>

          <nav aria-label={dict.nav.primary} className="ml-6 hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <SearchForm locale={locale} dict={dict} id="search-desktop" className="mr-2 hidden w-60 lg:block" />
            <LanguageToggle locale={locale} label={dict.common.language} />
            <ThemeToggle label={dict.nav.theme} />
            <CartButton href={localePath(locale, "/cart")} label={dict.nav.openCart} />
          </div>
        </div>
      </header>
    </>
  );
}
