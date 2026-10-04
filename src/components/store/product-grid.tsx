import { ProductCard } from "@/components/store/product-card";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { ProductSummary } from "@/types/catalog";

export function ProductGrid({
  products,
  locale,
  dict,
  priorityCount = 0,
}: {
  products: ProductSummary[];
  locale: Locale;
  dict: Dictionary;
  priorityCount?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} locale={locale} dict={dict} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
