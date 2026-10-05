"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localePath, stripLocale, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const labels: Record<Locale, string> = { sw: "SW", en: "EN" };
const names: Record<Locale, string> = { sw: "Kiswahili", en: "English" };

/** Switches language while staying on the same page. */
export function LanguageToggle({
  locale,
  label,
  inverted = false,
}: {
  locale: Locale;
  label: string;
  inverted?: boolean;
}) {
  const pathname = usePathname();
  const { path } = stripLocale(pathname);

  return (
    <nav aria-label={label} className="flex items-center gap-1 rounded-full border border-current/20 p-0.5">
      {locales.map((target) => {
        const active = target === locale;
        return (
          <Link
            key={target}
            href={localePath(target, path)}
            hrefLang={target}
            lang={target}
            aria-label={names[target]}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors max-[359px]:px-2 sm:px-3",
              active
                ? "bg-gold-500 text-[#1c1708]"
                : inverted
                  ? "text-white/70 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            {labels[target]}
          </Link>
        );
      })}
    </nav>
  );
}
