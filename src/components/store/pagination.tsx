import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

function pageWindow(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

/** Crawlable pagination: every page is a real link that keeps the active filters. */
export function Pagination({
  locale,
  dict,
  path,
  query,
  page,
  totalPages,
}: {
  locale: Locale;
  dict: Dictionary;
  /** Path without language prefix. */
  path: string;
  /** Current filters (without `page`). */
  query: Record<string, string | number | boolean | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "" && v !== false) sp.set(k, v === true ? "1" : String(v));
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `${localePath(locale, path)}${qs ? `?${qs}` : ""}`;
  };

  const linkClass =
    "flex h-10 min-w-10 items-center justify-center rounded-full border border-border px-3 text-sm font-medium hover:bg-muted";

  return (
    <nav aria-label={dict.shop.pagination} className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className={linkClass}>
          {dict.shop.previous}
        </Link>
      )}
      {pageWindow(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">
            &hellip;
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-label={dict.shop.page.replace("{n}", String(p))}
            aria-current={p === page ? "page" : undefined}
            className={cn(linkClass, p === page && "border-gold-500 bg-gold-500 text-[#1c1708] hover:bg-gold-500")}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} rel="next" className={linkClass}>
          {dict.shop.next}
        </Link>
      )}
    </nav>
  );
}
