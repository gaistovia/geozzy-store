import { z } from "zod";
import { AdminError } from "./errors";
import { slugify } from "@/lib/format";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

/* ---------------------------------------------------------------- form helpers */

export const str = (fd: FormData, key: string): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};
export const optStr = (fd: FormData, key: string): string | null => str(fd, key) || null;
export const bool = (fd: FormData, key: string): boolean => fd.get(key) === "on" || fd.get(key) === "true";

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new AdminError(first?.message || "Please check the form and try again.");
  }
  return result.data;
}

const money = (label: string) =>
  z
    .number({ invalid_type_error: `${label} must be a number.` })
    .int(`${label} must be a whole number.`)
    .min(0, `${label} cannot be negative.`)
    .max(100_000_000, `${label} is too large.`);

const intField = (fd: FormData, key: string): number | null => {
  const raw = str(fd, key).replace(/[,\s]/g, "");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : Number.NaN;
};

const slugSchema = z
  .string()
  .min(1, "The web address (slug) is required.")
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "The slug may only contain lowercase letters, numbers and single dashes.");

/* --------------------------------------------------------------------- product */

export interface ProductInput {
  name: string;
  slug: string;
  brand: string | null;
  sku: string | null;
  category_id: string | null;
  short_description_sw: string | null;
  short_description_en: string | null;
  description_sw: string | null;
  description_en: string | null;
  regular_price: number;
  sale_price: number | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  is_new: boolean;
  is_promotional: boolean;
  specifications: Record<string, string>;
  video_url: string | null;
}

/** "Material: Leather" lines -> {Material: "Leather"} */
export function parseSpecifications(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim().slice(0, 60);
    const value = line.slice(idx + 1).trim().slice(0, 200);
    if (key && value) out[key] = value;
    if (Object.keys(out).length >= 30) break;
  }
  return out;
}

export function specificationsToText(spec: unknown): string {
  if (!spec || typeof spec !== "object") return "";
  return Object.entries(spec as Record<string, unknown>)
    .filter(([, v]) => typeof v === "string" || typeof v === "number")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function parseProductForm(fd: FormData): ProductInput {
  const name = str(fd, "name");
  const slugRaw = str(fd, "slug") || slugify(name);
  const categoryId = str(fd, "category_id");
  const regular = intField(fd, "regular_price");
  const sale = intField(fd, "sale_price");

  const input = parseOrThrow(
    z.object({
      name: z.string().min(2, "Enter the product name (at least 2 letters).").max(200),
      slug: slugSchema,
      brand: z.string().max(80).nullable(),
      sku: z.string().max(60).nullable(),
      category_id: z.string().uuid("Choose a valid category.").nullable(),
      short_description_sw: z.string().max(400).nullable(),
      short_description_en: z.string().max(400).nullable(),
      description_sw: z.string().max(5000).nullable(),
      description_en: z.string().max(5000).nullable(),
      regular_price: money("The regular price"),
      sale_price: money("The sale price").nullable(),
      status: z.enum(["draft", "published", "archived"]),
      video_url: z
        .string()
        .max(300)
        .regex(/^https?:\/\//, "The video link must start with https://")
        .nullable(),
    }),
    {
      name,
      slug: slugRaw,
      brand: optStr(fd, "brand"),
      sku: optStr(fd, "sku"),
      category_id: categoryId || null,
      short_description_sw: optStr(fd, "short_description_sw"),
      short_description_en: optStr(fd, "short_description_en"),
      description_sw: optStr(fd, "description_sw"),
      description_en: optStr(fd, "description_en"),
      regular_price: regular ?? Number.NaN,
      sale_price: sale,
      status: str(fd, "status") || "draft",
      video_url: optStr(fd, "video_url"),
    },
  );

  if (input.sale_price !== null && input.sale_price >= input.regular_price) {
    throw new AdminError("The sale price must be lower than the regular price. Leave it empty if there is no sale.");
  }
  if (input.status === "published" && !input.category_id) {
    throw new AdminError("A published product needs a category. Choose a category first.");
  }

  return {
    ...input,
    is_featured: bool(fd, "is_featured"),
    is_new: bool(fd, "is_new"),
    is_promotional: bool(fd, "is_promotional"),
    specifications: parseSpecifications(str(fd, "specifications")),
  };
}

/** "40-45" -> ["40","41",...,"45"]; "S, M, L" -> ["S","M","L"]; empty -> ["One Size"]. */
export function parseSizeList(text: string): string[] {
  const t = text.trim();
  if (!t) return ["One Size"];
  const range = /^(\d{1,3})\s*[-–]\s*(\d{1,3})$/.exec(t);
  if (range) {
    const from = Number(range[1]);
    const to = Number(range[2]);
    if (from > to || to - from > 40) throw new AdminError("The size range is not valid. Example: 40-45");
    return Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
  }
  const list = [...new Set(t.split(/[,\n]/).map((s) => s.trim()).filter(Boolean))];
  if (list.length > 40) throw new AdminError("Too many sizes (maximum 40).");
  if (list.some((s) => s.length > 40)) throw new AdminError("A size name is too long (maximum 40 characters).");
  return list;
}

export function parseStock(fd: FormData, key: string): number {
  const n = intField(fd, key);
  if (n === null) return 0;
  if (!Number.isInteger(n) || n < 0 || n > 100_000) throw new AdminError("Stock must be a whole number from 0 to 100,000.");
  return n;
}

export function parseVariantForm(fd: FormData) {
  return {
    size: optStr(fd, "size"),
    color: optStr(fd, "color"),
    stock_quantity: parseStock(fd, "stock_quantity"),
    is_active: bool(fd, "is_active"),
  };
}

/* ------------------------------------------------------------------- category */

export interface CategoryInput {
  slug: string;
  name_sw: string;
  name_en: string;
  description_sw: string | null;
  description_en: string | null;
  image_path: string | null;
  is_visible: boolean;
  is_featured: boolean;
  sort_order: number;
}

export function parseCategoryForm(fd: FormData): CategoryInput {
  const nameEn = str(fd, "name_en");
  const nameSw = str(fd, "name_sw") || nameEn;
  const sort = intField(fd, "sort_order");
  const base = parseOrThrow(
    z.object({
      slug: slugSchema.max(80),
      name_sw: z.string().min(1, "Enter the category name in Swahili.").max(80),
      name_en: z.string().min(1, "Enter the category name in English.").max(80),
      sort_order: z.number().int().min(-1000).max(100000),
    }),
    { slug: str(fd, "slug") || slugify(nameEn || nameSw), name_sw: nameSw, name_en: nameEn || nameSw, sort_order: sort ?? 0 },
  );
  return {
    ...base,
    description_sw: optStr(fd, "description_sw"),
    description_en: optStr(fd, "description_en"),
    image_path: optStr(fd, "image_path"),
    is_visible: bool(fd, "is_visible"),
    is_featured: bool(fd, "is_featured"),
  };
}

/* ------------------------------------------------------------------ promotion */

export interface PromotionInput {
  slug: string;
  name: string;
  description_sw: string | null;
  description_en: string | null;
  banner_image_path: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export function parsePromotionForm(fd: FormData, toIso: (v: string) => string | null): PromotionInput {
  const name = str(fd, "name");
  const base = parseOrThrow(
    z.object({
      name: z.string().min(2, "Enter the promotion name.").max(120),
      slug: slugSchema.max(80),
    }),
    { name, slug: str(fd, "slug") || slugify(name) },
  );
  const startsRaw = str(fd, "starts_at");
  const endsRaw = str(fd, "ends_at");
  const starts = startsRaw ? toIso(startsRaw) : null;
  const ends = endsRaw ? toIso(endsRaw) : null;
  if (startsRaw && !starts) throw new AdminError("The start date is not valid.");
  if (endsRaw && !ends) throw new AdminError("The end date is not valid.");
  if (starts && ends && new Date(ends) <= new Date(starts)) throw new AdminError("The end date must be after the start date.");
  return {
    ...base,
    description_sw: optStr(fd, "description_sw"),
    description_en: optStr(fd, "description_en"),
    banner_image_path: optStr(fd, "banner_image_path"),
    starts_at: starts,
    ends_at: ends,
    is_active: bool(fd, "is_active"),
  };
}

export function parsePromoPrice(fd: FormData): number | null {
  const n = intField(fd, "promo_price");
  if (n === null) return null;
  if (!Number.isInteger(n) || n < 0 || n > 100_000_000) throw new AdminError("The promotion price must be a whole number.");
  return n;
}

/* ------------------------------------------------------------------------ faq */

export function parseFaqForm(fd: FormData) {
  const sort = intField(fd, "sort_order");
  const q = {
    question_sw: str(fd, "question_sw"),
    question_en: str(fd, "question_en"),
    answer_sw: str(fd, "answer_sw"),
    answer_en: str(fd, "answer_en"),
  };
  if (!q.question_sw && !q.question_en) throw new AdminError("Enter the question in at least one language.");
  if (!q.answer_sw && !q.answer_en) throw new AdminError("Enter the answer in at least one language.");
  const fill = (a: string, b: string) => a || b;
  return {
    question_sw: fill(q.question_sw, q.question_en).slice(0, 300),
    question_en: fill(q.question_en, q.question_sw).slice(0, 300),
    answer_sw: fill(q.answer_sw, q.answer_en).slice(0, 2000),
    answer_en: fill(q.answer_en, q.answer_sw).slice(0, 2000),
    sort_order: Number.isFinite(sort ?? 0) ? (sort ?? 0) : 0,
    is_published: bool(fd, "is_published"),
  };
}

/* --------------------------------------------------------------------- review */

export function parseReviewForm(fd: FormData) {
  const rating = intField(fd, "rating");
  const input = parseOrThrow(
    z.object({
      reviewer_name: z.string().min(1, "Enter the customer's name.").max(80),
      rating: z.number().int().min(1, "Choose a rating from 1 to 5.").max(5, "Choose a rating from 1 to 5."),
      body: z.string().min(1, "Enter the review text.").max(2000),
      product_id: z.string().uuid("Choose the product.").nullable(),
    }),
    { reviewer_name: str(fd, "reviewer_name"), rating: rating ?? 0, body: str(fd, "body"), product_id: optStr(fd, "product_id") },
  );
  return { ...input, is_verified_purchase: bool(fd, "is_verified_purchase") };
}

/* ------------------------------------------------------------------- settings */

export interface SettingsInput {
  store_name: string;
  tagline: { sw: string; en: string };
  whatsapp_number: string;
  email: string;
  address: string;
  business_hours: { sw: string; en: string };
  announcement: { sw: string; en: string };
  delivery_info: { sw: string; en: string };
  footer_text: { sw: string; en: string };
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
  social_youtube: string;
  return_policy_days: number;
  low_stock_threshold: number;
}

const urlOrEmpty = (label: string) =>
  z.string().max(300).refine((v) => v === "" || /^https?:\/\/.+/.test(v), `${label} must start with https://`);

export function parseSettingsForm(fd: FormData): SettingsInput {
  const whatsapp = normalizeWhatsAppNumber(str(fd, "whatsapp_number"));
  if (!whatsapp) throw new AdminError("The WhatsApp number is not valid. Example: +255 786 282 109");
  const returnDays = intField(fd, "return_policy_days");
  const lowStock = intField(fd, "low_stock_threshold");

  const base = parseOrThrow(
    z.object({
      store_name: z.string().min(1, "Enter the store name.").max(80),
      email: z.string().max(254).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "The email address is not valid."),
      address: z.string().max(300),
      social_instagram: urlOrEmpty("The Instagram link"),
      social_facebook: urlOrEmpty("The Facebook link"),
      social_tiktok: urlOrEmpty("The TikTok link"),
      social_youtube: urlOrEmpty("The YouTube link"),
      return_policy_days: z.number().int().min(0, "Return days cannot be negative.").max(365),
      low_stock_threshold: z.number().int().min(0).max(1000),
    }),
    {
      store_name: str(fd, "store_name"),
      email: str(fd, "email"),
      address: str(fd, "address"),
      social_instagram: str(fd, "social_instagram"),
      social_facebook: str(fd, "social_facebook"),
      social_tiktok: str(fd, "social_tiktok"),
      social_youtube: str(fd, "social_youtube"),
      return_policy_days: returnDays ?? 3,
      low_stock_threshold: lowStock ?? 3,
    },
  );
  const pair = (key: string, max: number) => ({
    sw: str(fd, `${key}_sw`).slice(0, max),
    en: str(fd, `${key}_en`).slice(0, max),
  });
  return {
    ...base,
    tagline: pair("tagline", 120),
    whatsapp_number: whatsapp,
    business_hours: pair("business_hours", 400),
    announcement: pair("announcement", 200),
    delivery_info: pair("delivery_info", 600),
    footer_text: pair("footer_text", 300),
  };
}

/* ------------------------------------------------------------------- homepage */

export function parseHomepageForm(fd: FormData) {
  const pair = (key: string, max: number) => ({ sw: str(fd, `${key}_sw`).slice(0, max), en: str(fd, `${key}_en`).slice(0, max) });
  const items = [1, 2, 3]
    .map((n) => ({ title: pair(`why${n}_title`, 80), text: pair(`why${n}_text`, 240) }))
    .filter((i) => i.title.sw || i.title.en);
  return {
    hero: {
      content: {
        headline: pair("hero_headline", 120),
        description: pair("hero_description", 300),
        primary_cta: pair("hero_primary_cta", 40),
        secondary_cta: pair("hero_secondary_cta", 40),
      },
      image_path: optStr(fd, "hero_image_path"),
      is_active: true,
    },
    why_shop: { content: { items }, image_path: null, is_active: bool(fd, "why_active") },
    whatsapp_cta: {
      content: { headline: pair("cta_headline", 120), text: pair("cta_text", 300) },
      image_path: null,
      is_active: bool(fd, "cta_active"),
    },
  };
}

/* ---------------------------------------------------------------------- order */

export const ORDER_STATUSES = [
  "new_enquiry",
  "contacted",
  "availability_confirmed",
  "awaiting_customer_decision",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function parseOrderForm(fd: FormData) {
  const status = str(fd, "status");
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) throw new AdminError("Choose a valid status.");
  return { status: status as OrderStatus, notes: optStr(fd, "notes")?.slice(0, 2000) ?? null };
}
