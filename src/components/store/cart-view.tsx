"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, FormMessage } from "@/components/ui/input";
import { MinusIcon, PlusIcon, TrashIcon, WhatsAppIcon } from "@/components/ui/icons";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";
import { MAX_LINE_QUANTITY, type CartLine } from "@/lib/cart";
import { logOrderEnquiry, openWhatsApp } from "@/lib/enquiry";
import { formatTZS } from "@/lib/format";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buildOrderMessage, generateOrderReference } from "@/lib/whatsapp-messages";

interface FreshVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
  is_active: boolean;
}

interface Fresh {
  status: "idle" | "loading" | "done" | "error";
  variants: Map<string, FreshVariant>;
  optionsByProduct: Map<string, FreshVariant[]>;
  prices: Map<string, number>;
}

const emptyFresh: Fresh = { status: "idle", variants: new Map(), optionsByProduct: new Map(), prices: new Map() };

type LineState = "ok" | "unavailable" | "out" | "limited";

const optionLabel = (v: { size: string | null; color: string | null }) =>
  [v.size, v.color].filter(Boolean).join(" / ");

export function CartView({
  locale,
  dict,
  whatsappNumber,
}: {
  locale: Locale;
  dict: Dictionary;
  whatsappNumber: string;
}) {
  const { lines, ready, setQuantity, remove, replaceVariant, clear } = useCart();
  const t = dict.cart;
  const [fresh, setFresh] = useState<Fresh>(emptyFresh);
  const [customerName, setCustomerName] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [sentRef, setSentRef] = useState<string | null>(null);

  const variantKey = lines.map((l) => l.variantId).sort().join(",");

  // Re-check prices and stock with the database whenever the set of items changes.
  useEffect(() => {
    if (!ready || lines.length === 0) {
      setFresh(emptyFresh);
      return;
    }
    let cancelled = false;
    setFresh((f) => ({ ...f, status: "loading" }));

    const supabase = createClient();
    const variantIds = lines.map((l) => l.variantId);
    const productIds = [...new Set(lines.map((l) => l.productId))];

    Promise.all([
      supabase
        .from("product_variants")
        .select("id, product_id, size, color, stock_quantity, is_active")
        .in("id", variantIds),
      supabase
        .from("product_variants")
        .select("id, product_id, size, color, stock_quantity, is_active")
        .in("product_id", productIds)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("product_listing").select("id, current_price").in("id", productIds),
    ])
      .then(([own, options, listing]) => {
        if (cancelled) return;
        if (own.error || options.error || listing.error) {
          setFresh({ ...emptyFresh, status: "error" });
          return;
        }
        const variants = new Map((own.data ?? []).map((v) => [v.id, v as FreshVariant]));
        const optionsByProduct = new Map<string, FreshVariant[]>();
        for (const v of (options.data ?? []) as FreshVariant[]) {
          const list = optionsByProduct.get(v.product_id) ?? [];
          list.push(v);
          optionsByProduct.set(v.product_id, list);
        }
        const prices = new Map((listing.data ?? []).map((p) => [p.id, p.current_price as number]));
        setFresh({ status: "done", variants, optionsByProduct, prices });
      })
      .catch(() => {
        if (!cancelled) setFresh({ ...emptyFresh, status: "error" });
      });

    return () => {
      cancelled = true;
    };
    // `lines` content is captured by variantKey; quantities do not need a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, variantKey]);

  const rows = useMemo(
    () =>
      lines.map((line) => {
        let state: LineState = "ok";
        let stock: number | null = null;
        if (fresh.status === "done") {
          const v = fresh.variants.get(line.variantId);
          if (!v || !v.is_active || !fresh.prices.has(line.productId)) state = "unavailable";
          else if (v.stock_quantity <= 0) state = "out";
          else if (line.quantity > v.stock_quantity) {
            state = "limited";
            stock = v.stock_quantity;
          }
        }
        const unitPrice = fresh.prices.get(line.productId) ?? line.unitPrice;
        return { line, state, stock, unitPrice };
      }),
    [lines, fresh],
  );

  const total = rows.reduce((sum, r) => sum + r.unitPrice * r.line.quantity, 0);
  const hasBlocking = rows.some((r) => r.state === "unavailable" || r.state === "out");
  const priceChanged = rows.some((r) => r.unitPrice !== r.line.unitPrice);

  function handleOrder() {
    if (hasBlocking) {
      setBlocked(true);
      return;
    }
    setBlocked(false);
    const reference = generateOrderReference();
    const message = buildOrderMessage({
      locale,
      reference,
      customerName,
      deliveryLocation,
      items: rows.map(({ line, unitPrice }) => ({
        name: line.name,
        size: line.size,
        color: line.color,
        quantity: line.quantity,
        unitPrice,
        url: `${window.location.origin}${localePath(locale, `/product/${line.slug}`)}`,
      })),
    });
    const url = buildWhatsAppUrl(whatsappNumber, message);
    if (!url) return;
    logOrderEnquiry(
      "cart",
      lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
      reference,
    );
    openWhatsApp(url);
    setSentRef(reference);
  }

  function changeOption(line: CartLine, nextVariantId: string) {
    const next = fresh.optionsByProduct.get(line.productId)?.find((v) => v.id === nextVariantId);
    if (!next || next.id === line.variantId) return;
    replaceVariant(line.variantId, {
      ...line,
      variantId: next.id,
      size: next.size,
      color: next.color,
      unitPrice: fresh.prices.get(line.productId) ?? line.unitPrice,
    });
  }

  if (!ready) {
    return <p className="py-16 text-center text-muted-foreground">{t.checking}</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h2 className="font-display text-3xl font-semibold">{t.empty}</h2>
        <p className="mt-3 text-muted-foreground">{t.emptyBody}</p>
        <Link href={localePath(locale, "/shop")} className={buttonVariants({ size: "lg", className: "mt-8" })}>
          {t.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <div>
        {fresh.status === "loading" && <p className="mb-3 text-sm text-muted-foreground">{t.checking}</p>}
        {fresh.status === "error" && <div className="mb-4"><FormMessage>{t.refreshFailed}</FormMessage></div>}
        {priceChanged && <div className="mb-4"><FormMessage variant="success">{t.priceUpdated}</FormMessage></div>}

        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {rows.map(({ line, state, stock, unitPrice }) => {
            const options = fresh.optionsByProduct.get(line.productId) ?? [];
            const bad = state === "unavailable" || state === "out";
            return (
              <li key={line.variantId} className="flex gap-4 p-4">
                <Link
                  href={localePath(locale, `/product/${line.slug}`)}
                  className="relative block size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <ProductImage path={line.imagePath} alt="" sizes="112px" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={localePath(locale, `/product/${line.slug}`)}
                        className="line-clamp-2 font-medium leading-snug hover:underline"
                      >
                        {line.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                        {formatTZS(unitPrice)} {t.each}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(line.variantId)}
                      aria-label={`${t.remove}: ${line.name}`}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-danger"
                    >
                      <TrashIcon width={18} height={18} />
                    </button>
                  </div>

                  {options.length > 1 ? (
                    <div>
                      <label htmlFor={`opt-${line.variantId}`} className="sr-only">
                        {t.option}
                      </label>
                      <select
                        id={`opt-${line.variantId}`}
                        value={line.variantId}
                        onChange={(e) => changeOption(line, e.target.value)}
                        className="h-9 rounded-lg border border-border bg-card px-2 text-sm"
                      >
                        {options.map((o) => (
                          <option key={o.id} value={o.id} disabled={o.stock_quantity <= 0}>
                            {optionLabel(o)}
                            {o.stock_quantity <= 0 ? ` - ${t.outOfStock}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    optionLabel(line) && <p className="text-sm text-muted-foreground">{optionLabel(line)}</p>
                  )}

                  {state === "unavailable" && <p className="text-sm font-medium text-danger">{t.unavailable}</p>}
                  {state === "out" && <p className="text-sm font-medium text-danger">{t.outOfStock}</p>}
                  {state === "limited" && stock !== null && (
                    <p className="text-sm font-medium text-gold-700 dark:text-gold-400">
                      {t.limited.replace("{n}", String(stock))}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div
                      role="group"
                      aria-label={`${t.quantity}: ${line.name}`}
                      className="inline-flex items-center rounded-full border border-border"
                    >
                      <button
                        type="button"
                        aria-label={dict.product.decrease}
                        disabled={bad || line.quantity <= 1}
                        onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                        className="flex size-9 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40"
                      >
                        <MinusIcon width={16} height={16} />
                      </button>
                      <output className="w-8 text-center text-sm font-semibold tabular-nums">{line.quantity}</output>
                      <button
                        type="button"
                        aria-label={dict.product.increase}
                        disabled={bad || line.quantity >= MAX_LINE_QUANTITY}
                        onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                        className="flex size-9 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40"
                      >
                        <PlusIcon width={16} height={16} />
                      </button>
                    </div>
                    <p className="font-semibold tabular-nums">{formatTZS(unitPrice * line.quantity)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link href={localePath(locale, "/shop")} className="text-sm font-semibold underline underline-offset-4">
            {t.continueShopping}
          </Link>
          <button
            type="button"
            onClick={() => {
              clear();
              setSentRef(null);
            }}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-danger"
          >
            {t.clear}
          </button>
        </div>
      </div>

      <aside aria-label={t.summary} className="lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardBody className="space-y-5 p-5">
            <h2 className="font-display text-2xl font-semibold">{t.summary}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.items.replace("{n}", String(lines.reduce((s, l) => s + l.quantity, 0)))}</dt>
                <dd className="tabular-nums">{formatTZS(total)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>{t.estimatedTotal}</dt>
                <dd className="tabular-nums">{formatTZS(total)}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">{t.estimatedNote}</p>

            <div className="space-y-3">
              <div>
                <Label htmlFor="customer-name">{t.yourName}</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  maxLength={80}
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="delivery-location">{t.location}</Label>
                <Input
                  id="delivery-location"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  maxLength={120}
                  autoComplete="street-address"
                />
              </div>
            </div>

            {blocked && hasBlocking && <FormMessage>{t.removeUnavailable}</FormMessage>}

            <Button variant="whatsapp" size="lg" className="w-full" onClick={handleOrder}>
              <WhatsAppIcon width={20} height={20} />
              {t.orderWhatsApp}
            </Button>

            {sentRef && (
              <div role="status" className="rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm">
                <p>{t.sent.replace("{ref}", sentRef)}</p>
                <p className="mt-1 text-muted-foreground">{t.sentFallback}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">{t.noPayment}</p>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}
