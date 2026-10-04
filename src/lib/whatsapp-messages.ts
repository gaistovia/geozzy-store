import { formatTZS } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";

/**
 * Builds the pre-filled WhatsApp messages. Orders are arranged on WhatsApp only;
 * nothing here collects or implies payment.
 */

export interface OrderMessageItem {
  name: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  url?: string;
  sku?: string | null;
}

export interface OrderMessageInput {
  locale: Locale;
  reference: string;
  items: OrderMessageItem[];
  customerName?: string;
  deliveryLocation?: string;
}

const copy = {
  en: {
    greeting: "Hello GEOZZY STORE,",
    intro: "I would like to place an order:",
    reference: "Order Reference",
    products: "Products",
    size: "Size",
    color: "Color",
    quantity: "Quantity",
    price: "Price",
    subtotal: "Subtotal",
    link: "Link",
    sku: "SKU",
    total: "Estimated Product Total",
    name: "Customer Name",
    location: "Delivery Location",
    closing: "Please confirm product availability and guide me through the next steps.",
    thanks: "Thank you.",
    askGreeting: "Hello GEOZZY STORE,",
    askIntro: "I would like to ask about this product:",
    askProduct: "Product",
    askClosing: "Is it available? Please advise on sizes and next steps.",
  },
  sw: {
    greeting: "Habari GEOZZY STORE,",
    intro: "Ningependa kuagiza:",
    reference: "Namba ya Oda",
    products: "Bidhaa",
    size: "Size",
    color: "Rangi",
    quantity: "Idadi",
    price: "Bei",
    subtotal: "Jumla ndogo",
    link: "Link",
    sku: "SKU",
    total: "Jumla ya Bidhaa (makadirio)",
    name: "Jina",
    location: "Mahali pa Delivery",
    closing: "Tafadhali thibitisha upatikanaji wa bidhaa na uniongoze hatua zinazofuata.",
    thanks: "Asante.",
    askGreeting: "Habari GEOZZY STORE,",
    askIntro: "Ningependa kuuliza kuhusu bidhaa hii:",
    askProduct: "Bidhaa",
    askClosing: "Je, inapatikana? Tafadhali nishauri kuhusu size na hatua zinazofuata.",
  },
} as const;

/** Removes control characters and trims user-typed text so it cannot break the message layout. */
export function cleanText(input: string | undefined, max = 120): string {
  return (input ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function buildOrderMessage(input: OrderMessageInput): string {
  const c = copy[input.locale];
  const lines: string[] = [c.greeting, "", c.intro, "", `${c.reference}: ${input.reference}`, "", `${c.products}:`, ""];

  let total = 0;
  input.items.forEach((item, index) => {
    const subtotal = item.unitPrice * item.quantity;
    total += subtotal;
    lines.push(`${index + 1}. ${item.name}`);
    if (item.size) lines.push(`   ${c.size}: ${item.size}`);
    if (item.color) lines.push(`   ${c.color}: ${item.color}`);
    lines.push(`   ${c.quantity}: ${item.quantity}`);
    lines.push(`   ${c.price}: ${formatTZS(item.unitPrice)}`);
    lines.push(`   ${c.subtotal}: ${formatTZS(subtotal)}`);
    if (item.sku) lines.push(`   ${c.sku}: ${item.sku}`);
    if (item.url) lines.push(`   ${c.link}: ${item.url}`);
    lines.push("");
  });

  lines.push(`${c.total}: ${formatTZS(total)}`, "");
  const name = cleanText(input.customerName, 80);
  const place = cleanText(input.deliveryLocation, 120);
  if (name) lines.push(`${c.name}: ${name}`);
  if (place) lines.push(`${c.location}: ${place}`);
  if (name || place) lines.push("");
  lines.push(c.closing, "", c.thanks);
  return lines.join("\n");
}

/** "Ask about this product" - no size required, no order reference. */
export function buildAskMessage(input: {
  locale: Locale;
  name: string;
  url: string;
  price: number;
  sku?: string | null;
}): string {
  const c = copy[input.locale];
  const lines = [
    c.askGreeting,
    "",
    c.askIntro,
    "",
    `${c.askProduct}: ${input.name}`,
    `${c.price}: ${formatTZS(input.price)}`,
  ];
  if (input.sku) lines.push(`${c.sku}: ${input.sku}`);
  lines.push(`${c.link}: ${input.url}`, "", c.askClosing, "", c.thanks);
  return lines.join("\n");
}

/** GZ-YYMMDD-XXXXX (Dar es Salaam date + 5 random characters). Matches the database check. */
export function generateOrderReference(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Dar_es_Salaam",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `GZ-${get("year")}${get("month")}${get("day")}-${suffix}`;
}
