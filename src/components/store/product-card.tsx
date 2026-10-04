import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/store/price";
import { ProductImage } from "@/components/store/product-image";
import { QuickAdd } from "@/components/store/quick-add";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { t } from "@/lib/i18n/text";
import type { ProductSummary } from "@/types/catalog";

export function ProductCard({
  product,
  locale,
  dict,
  priority = false,
}: {
  product: ProductSummary;
  locale: Locale;
  dict: Dictionary;
  priority?: boolean;
}) {
  const href = localePath(locale, `/product/${product.slug}`);
  const category = t(locale, product.category_name_sw, product.category_name_en);
  const available = product.variants.filter((v) => v.stock_quantity > 0);
  const singleOption = product.variants.length === 1 && available.length === 1 ? available[0] : null;

  return (
    <article className="group relative flex flex-col">
      <Link href={href} className="block" aria-label={product.name}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          <ProductImage
            path={product.primary_image_path}
            alt={product.primary_image_alt || product.name}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className="transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {!product.in_stock && <Badge className="bg-foreground text-background">{dict.card.outOfStock}</Badge>}
            {product.in_stock && product.is_new && <Badge tone="gold">{dict.card.new}</Badge>}
            {product.in_stock && product.discount_percent > 0 && (
              <Badge className="bg-danger text-white">-{product.discount_percent}%</Badge>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        {category && <p className="text-xs uppercase tracking-wider text-muted-foreground">{category}</p>}
        <h3 className="line-clamp-2 text-[0.95rem] font-medium leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        <Price
          current={product.current_price}
          regular={product.regular_price}
          wasLabel={dict.card.was}
          className="mt-auto pt-1"
        />
      </div>

      <div className="relative z-10 mt-3">
        {singleOption ? (
          <QuickAdd
            product={product}
            variant={singleOption}
            label={dict.card.addToCart}
            addedLabel={dict.card.addedToCart}
          />
        ) : (
          <Link
            href={href}
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-border text-sm font-medium transition-colors hover:bg-muted"
          >
            {product.in_stock ? dict.card.chooseSize : dict.card.viewProduct}
          </Link>
        )}
      </div>
    </article>
  );
}
