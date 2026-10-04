import { SearchIcon } from "@/components/ui/icons";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Plain GET form - works without JavaScript. */
export function SearchForm({
  locale,
  dict,
  className,
  id = "search",
}: {
  locale: Locale;
  dict: Dictionary;
  className?: string;
  id?: string;
}) {
  return (
    <form role="search" action={localePath(locale, "/shop")} method="get" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {dict.nav.searchLabel}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        maxLength={60}
        autoComplete="off"
        placeholder={dict.nav.searchPlaceholder}
        className="h-10 w-full rounded-full border border-border bg-muted pl-4 pr-11 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring"
      />
      <button
        type="submit"
        aria-label={dict.nav.search}
        className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <SearchIcon width={18} height={18} />
      </button>
    </form>
  );
}
