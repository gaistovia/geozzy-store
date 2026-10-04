import type { ListParams, SortKey } from "@/types/catalog";

export const PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 && n <= 100_000_000 ? n : undefined;
}

/** Strips everything except letters, digits and spaces so it is safe inside a PostgREST filter. */
export function sanitizeSearch(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** Reads and validates shop filters from the URL. Anything invalid is ignored. */
export function parseListParams(sp: SearchParams, fixed: Partial<ListParams> = {}): ListParams {
  const sortRaw = first(sp.sort);
  const sort: SortKey = sortRaw === "price_asc" || sortRaw === "price_desc" ? sortRaw : "newest";
  const page = Math.max(1, toInt(first(sp.page)) ?? 1);
  const q = sanitizeSearch(first(sp.q) ?? "");
  const category = first(sp.category);

  return {
    q: q || undefined,
    category: category && /^[a-z0-9-]{1,80}$/.test(category) ? category : undefined,
    sort,
    inStock: first(sp.stock) === "1" || undefined,
    minPrice: toInt(first(sp.min)),
    maxPrice: toInt(first(sp.max)),
    page: Math.min(page, 500),
    pageSize: PAGE_SIZE,
    ...fixed,
  };
}
