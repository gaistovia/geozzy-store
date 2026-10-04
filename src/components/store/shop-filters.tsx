import Link from "next/link";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { t } from "@/lib/i18n/text";
import type { Category, ListParams } from "@/types/catalog";

/** Filter form: a plain GET form, so it works without JavaScript and every result has a shareable URL. */
export function ShopFilters({
  locale,
  dict,
  action,
  categories,
  params,
  showCategory = true,
}: {
  locale: Locale;
  dict: Dictionary;
  /** Path without language prefix, e.g. "/shop" or "/category/sandals". */
  action: string;
  categories: Category[];
  params: ListParams;
  showCategory?: boolean;
}) {
  const s = dict.shop;
  const selectClass =
    "h-11 w-full rounded-lg border border-border bg-card px-3 text-base focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring";

  return (
    <form
      action={localePath(locale, action)}
      method="get"
      className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <div className="sm:col-span-2 lg:col-span-2">
        <Label htmlFor="f-q">{s.searchLabel}</Label>
        <Input id="f-q" name="q" type="search" defaultValue={params.q ?? ""} maxLength={60} />
      </div>

      {showCategory && (
        <div>
          <Label htmlFor="f-category">{s.category}</Label>
          <select id="f-category" name="category" defaultValue={params.category ?? ""} className={selectClass}>
            <option value="">{s.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {t(locale, c.name_sw, c.name_en)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <Label htmlFor="f-sort">{s.sortBy}</Label>
        <select id="f-sort" name="sort" defaultValue={params.sort} className={selectClass}>
          <option value="newest">{s.sortNewest}</option>
          <option value="price_asc">{s.sortPriceAsc}</option>
          <option value="price_desc">{s.sortPriceDesc}</option>
        </select>
      </div>

      <div>
        <Label htmlFor="f-min">{s.minPrice}</Label>
        <Input id="f-min" name="min" type="number" inputMode="numeric" min={0} step={1000} defaultValue={params.minPrice ?? ""} />
      </div>
      <div>
        <Label htmlFor="f-max">{s.maxPrice}</Label>
        <Input id="f-max" name="max" type="number" inputMode="numeric" min={0} step={1000} defaultValue={params.maxPrice ?? ""} />
      </div>

      <label className="flex items-center gap-2.5 text-sm font-medium sm:col-span-2 lg:col-span-2">
        <input
          type="checkbox"
          name="stock"
          value="1"
          defaultChecked={params.inStock}
          className="size-5 accent-[var(--color-gold-600)]"
        />
        {s.inStockOnly}
      </label>

      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4 lg:justify-end">
        <Link
          href={localePath(locale, action)}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {s.clear}
        </Link>
        <Button type="submit">{s.apply}</Button>
      </div>
    </form>
  );
}
