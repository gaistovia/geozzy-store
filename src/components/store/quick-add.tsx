"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, CartIcon } from "@/components/ui/icons";
import { useCart } from "@/components/store/cart-provider";
import type { ProductSummary, VariantLite } from "@/types/catalog";

/** One-tap add to cart for products that have a single available option. */
export function QuickAdd({
  product,
  variant,
  label,
  addedLabel,
}: {
  product: ProductSummary;
  variant: VariantLite;
  label: string;
  addedLabel: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2000);
    return () => window.clearTimeout(timer);
  }, [added]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          add({
            variantId: variant.id,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            imagePath: product.primary_image_path,
            size: variant.size,
            color: variant.color,
            unitPrice: product.current_price,
            quantity: 1,
          });
          setAdded(true);
        }}
      >
        {added ? <CheckIcon width={16} height={16} /> : <CartIcon width={16} height={16} />}
        {added ? addedLabel : label}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {added ? addedLabel : ""}
      </span>
    </>
  );
}
