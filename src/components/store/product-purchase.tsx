"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CartIcon, CheckIcon, MinusIcon, PlusIcon, WhatsAppIcon } from "@/components/ui/icons";
import { FormMessage } from "@/components/ui/input";
import { useCart } from "@/components/store/cart-provider";
import { MAX_LINE_QUANTITY } from "@/lib/cart";
import { logOrderEnquiry, openWhatsApp } from "@/lib/enquiry";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buildAskMessage, buildOrderMessage, generateOrderReference } from "@/lib/whatsapp-messages";
import type { VariantLite } from "@/types/catalog";

export interface PurchaseProduct {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  currentPrice: number;
  imagePath: string | null;
}

const unique = (values: (string | null)[]): string[] => [
  ...new Set(values.filter((v): v is string => Boolean(v))),
];

export function ProductPurchase({
  locale,
  dict,
  product,
  variants,
  whatsappNumber,
  lowStockThreshold,
}: {
  locale: Locale;
  dict: Dictionary["product"];
  product: PurchaseProduct;
  variants: VariantLite[];
  whatsappNumber: string;
  lowStockThreshold: number;
}) {
  const sizes = useMemo(() => unique(variants.map((v) => v.size)), [variants]);
  const colors = useMemo(() => unique(variants.map((v) => v.color)), [variants]);

  const [size, setSize] = useState<string | null>(sizes.length === 1 ? (sizes[0] ?? null) : null);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? (colors[0] ?? null) : null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [sentRef, setSentRef] = useState<string | null>(null);
  const { add } = useCart();

  const selected = useMemo(() => {
    if (sizes.length > 0 && !size) return null;
    if (colors.length > 0 && !color) return null;
    return (
      variants.find(
        (v) => (sizes.length === 0 || v.size === size) && (colors.length === 0 || v.color === color),
      ) ?? null
    );
  }, [variants, sizes, colors, size, color]);

  const allOut = variants.every((v) => v.stock_quantity <= 0);
  const maxQty = selected ? Math.min(MAX_LINE_QUANTITY, Math.max(1, selected.stock_quantity)) : MAX_LINE_QUANTITY;

  useEffect(() => setQuantity((q) => Math.min(q, maxQty)), [maxQty]);

  const sizeInStock = (s: string) =>
    variants.some((v) => v.size === s && (!color || v.color === color) && v.stock_quantity > 0);
  const colorInStock = (c: string) =>
    variants.some((v) => v.color === c && (!size || v.size === size) && v.stock_quantity > 0);

  function resolveVariant(): VariantLite | null {
    if (sizes.length > 0 && !size) return fail(dict.selectSize);
    if (colors.length > 0 && !color) return fail(dict.selectColor);
    if (!selected || selected.stock_quantity <= 0) return fail(dict.selectOption);
    setError(null);
    return selected;
  }

  function fail(message: string): null {
    setError(message);
    setAdded(false);
    setSentRef(null);
    return null;
  }

  function handleAdd() {
    const variant = resolveVariant();
    if (!variant) return;
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imagePath: product.imagePath,
      size: variant.size,
      color: variant.color,
      unitPrice: product.currentPrice,
      quantity,
    });
    setSentRef(null);
    setAdded(true);
  }

  function handleOrder() {
    const variant = resolveVariant();
    if (!variant) return;
    const reference = generateOrderReference();
    const message = buildOrderMessage({
      locale,
      reference,
      items: [
        {
          name: product.name,
          size: variant.size,
          color: variant.color,
          quantity,
          unitPrice: product.currentPrice,
          sku: product.sku,
          url: `${window.location.origin}${localePath(locale, `/product/${product.slug}`)}`,
        },
      ],
    });
    const url = buildWhatsAppUrl(whatsappNumber, message);
    if (!url) return;
    logOrderEnquiry("product", [{ variant_id: variant.id, quantity }], reference);
    openWhatsApp(url);
    setAdded(false);
    setSentRef(reference);
  }

  function handleAsk() {
    const message = buildAskMessage({
      locale,
      name: product.name,
      price: product.currentPrice,
      sku: product.sku,
      url: `${window.location.origin}${localePath(locale, `/product/${product.slug}`)}`,
    });
    const url = buildWhatsAppUrl(whatsappNumber, message);
    if (url) openWhatsApp(url);
  }

  const stockText = selected
    ? selected.stock_quantity <= 0
      ? dict.outOfStock
      : selected.stock_quantity <= lowStockThreshold
        ? dict.lowStock.replace("{n}", String(selected.stock_quantity))
        : dict.inStock
    : allOut
      ? dict.outOfStock
      : dict.inStock;
  const stockTone = stockText === dict.outOfStock ? "text-danger" : stockText === dict.inStock ? "text-success" : "text-gold-700 dark:text-gold-400";

  return (
    <div className="space-y-6">
      <p className={cn("flex items-center gap-2 text-sm font-medium", stockTone)} role="status">
        <span aria-hidden="true" className="size-2 rounded-full bg-current" />
        {stockText}
      </p>

      {sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{dict.size}</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const available = sizeInStock(s);
              const active = s === size;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!available}
                  aria-pressed={active}
                  title={available ? undefined : dict.unavailableSize}
                  onClick={() => {
                    setSize(s);
                    setError(null);
                  }}
                  className={cn(
                    "h-11 min-w-12 rounded-full border px-4 text-sm font-medium transition-colors",
                    active
                      ? "border-gold-500 bg-gold-500 text-[#1c1708]"
                      : "border-border hover:border-foreground",
                    !available && "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-border",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {colors.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{dict.color}</legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const available = colorInStock(c);
              const active = c === color;
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!available}
                  aria-pressed={active}
                  onClick={() => {
                    setColor(c);
                    setError(null);
                  }}
                  className={cn(
                    "h-11 rounded-full border px-4 text-sm font-medium transition-colors",
                    active ? "border-gold-500 bg-gold-500 text-[#1c1708]" : "border-border hover:border-foreground",
                    !available && "cursor-not-allowed opacity-50 line-through",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold" id="qty-label">
          {dict.quantity}
        </p>
        <div role="group" aria-labelledby="qty-label" className="inline-flex items-center rounded-full border border-border">
          <button
            type="button"
            aria-label={dict.decrease}
            disabled={quantity <= 1 || allOut}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex size-11 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40"
          >
            <MinusIcon width={18} height={18} />
          </button>
          <output aria-live="polite" className="w-10 text-center font-semibold tabular-nums">
            {quantity}
          </output>
          <button
            type="button"
            aria-label={dict.increase}
            disabled={quantity >= maxQty || allOut}
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            className="flex size-11 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40"
          >
            <PlusIcon width={18} height={18} />
          </button>
        </div>
      </div>

      {error && <FormMessage>{error}</FormMessage>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" variant="primary" className="flex-1" onClick={handleAdd} disabled={allOut}>
          <CartIcon width={20} height={20} />
          {dict.addToCart}
        </Button>
        <Button size="lg" variant="whatsapp" className="flex-1" onClick={handleOrder} disabled={allOut}>
          <WhatsAppIcon width={20} height={20} />
          {dict.orderWhatsApp}
        </Button>
      </div>
      <Button variant="outline" className="w-full" onClick={handleAsk}>
        <WhatsAppIcon width={18} height={18} />
        {dict.askWhatsApp}
      </Button>

      <div aria-live="polite">
        {added && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckIcon width={16} height={16} /> {dict.added}
            </span>
            <Link href={localePath(locale, "/cart")} className="font-semibold underline underline-offset-4">
              {dict.viewCart}
            </Link>
          </p>
        )}
        {sentRef && (
          <p className="rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm">
            {dict.sent.replace("{ref}", sentRef)}
          </p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{dict.noPayment}</p>
    </div>
  );
}
