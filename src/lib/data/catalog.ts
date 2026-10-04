import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Category,
  FaqItem,
  HomepageSection,
  ListParams,
  ProductDetail,
  ProductImage,
  ProductSummary,
  Promotion,
  Review,
  VariantLite,
} from "@/types/catalog";

/**
 * Public catalog reads. All of them use the anonymous client, so Row Level Security
 * guarantees visitors only ever receive published / visible data.
 * Results are cached; the admin calls revalidateTag(...) after edits (Phase 4).
 */
const REVALIDATE = 300;

const LISTING_COLUMNS =
  "id, slug, name, brand, category_slug, category_name_sw, category_name_en, regular_price, sale_price, " +
  "current_price, discount_percent, is_new, is_featured, primary_image_path, primary_image_alt, in_stock, total_stock";

async function safe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch {
    return fallback;
  }
}

/* ---------------------------------------------------------------- categories */

const fetchCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, name_sw, name_en, description_sw, description_en, image_path, is_featured, sort_order")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Category[];
  },
  ["catalog-categories"],
  { tags: ["categories"], revalidate: REVALIDATE },
);

export const getCategories = () => safe(fetchCategories, [] as Category[]);

/* ------------------------------------------------------------------ products */

const fetchProducts = unstable_cache(
  async (params: ListParams): Promise<{ items: ProductSummary[]; total: number }> => {
    const supabase = createPublicClient();
    let query = supabase
      .from("product_listing")
      .select(LISTING_COLUMNS, { count: "exact" })
      .eq("status", "published");

    if (params.category) query = query.eq("category_slug", params.category);
    if (params.q) query = query.or(`name.ilike.%${params.q}%,brand.ilike.%${params.q}%`);
    if (params.inStock) query = query.eq("in_stock", true);
    if (params.minPrice !== undefined) query = query.gte("current_price", params.minPrice);
    if (params.maxPrice !== undefined) query = query.lte("current_price", params.maxPrice);
    if (params.isNew) query = query.eq("is_new", true);
    if (params.isFeatured) query = query.eq("is_featured", true);
    if (params.ids) query = query.in("id", params.ids);

    if (params.sort === "price_asc") query = query.order("current_price", { ascending: true });
    else if (params.sort === "price_desc") query = query.order("current_price", { ascending: false });
    else query = query.order("published_at", { ascending: false, nullsFirst: false });
    query = query.order("id", { ascending: true });

    const from = (params.page - 1) * params.pageSize;
    const { data, error, count } = await query.range(from, from + params.pageSize - 1);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as unknown as Omit<ProductSummary, "variants">[];
    const ids = rows.map((r) => r.id);
    const byProduct = new Map<string, VariantLite[]>();

    if (ids.length > 0) {
      const { data: variants, error: vError } = await supabase
        .from("product_variants")
        .select("id, product_id, size, color, stock_quantity")
        .in("product_id", ids)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (vError) throw new Error(vError.message);
      for (const v of variants ?? []) {
        const list = byProduct.get(v.product_id) ?? [];
        list.push({ id: v.id, size: v.size, color: v.color, stock_quantity: v.stock_quantity });
        byProduct.set(v.product_id, list);
      }
    }

    return {
      items: rows.map((row) => ({ ...row, variants: byProduct.get(row.id) ?? [] })),
      total: count ?? 0,
    };
  },
  ["catalog-products"],
  { tags: ["products"], revalidate: REVALIDATE },
);

export const listProducts = (params: ListParams) =>
  safe(() => fetchProducts(params), { items: [] as ProductSummary[], total: 0 });

const fetchProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductDetail | null> => {
    const supabase = createPublicClient();
    const [productRes, listingRes] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, slug, name, brand, sku, short_description_sw, short_description_en, description_sw, description_en, " +
            "specifications, regular_price, is_new, updated_at, " +
            "category:categories(slug, name_sw, name_en), " +
            "product_images(id, storage_path, alt, position, is_primary), " +
            "product_variants(id, size, color, stock_quantity, is_active, sort_order)",
        )
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle(),
      supabase
        .from("product_listing")
        .select("current_price, discount_percent, in_stock, total_stock")
        .eq("slug", slug)
        .maybeSingle(),
    ]);
    if (productRes.error) throw new Error(productRes.error.message);
    if (listingRes.error) throw new Error(listingRes.error.message);
    const p = productRes.data as unknown as
      | (Omit<ProductDetail, "images" | "variants" | "current_price" | "discount_percent" | "in_stock" | "total_stock"> & {
          product_images: ProductImage[];
          product_variants: (VariantLite & { is_active: boolean; sort_order: number })[];
        })
      | null;
    const l = listingRes.data;
    if (!p || !l) return null;

    const images = [...(p.product_images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
    );
    const variants = (p.product_variants ?? [])
      .filter((v) => v.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ id, size, color, stock_quantity, sort_order }) => ({ id, size, color, stock_quantity, sort_order }));

    const { product_images: _i, product_variants: _v, ...rest } = p;
    void _i;
    void _v;
    return {
      ...rest,
      current_price: l.current_price,
      discount_percent: l.discount_percent,
      in_stock: l.in_stock,
      total_stock: l.total_stock,
      images,
      variants,
    };
  },
  ["catalog-product"],
  { tags: ["products"], revalidate: REVALIDATE },
);

export const getProductBySlug = (slug: string) => safe(() => fetchProductBySlug(slug), null);

/* ------------------------------------------------------------- home + content */

const fetchHomepageSections = unstable_cache(
  async (): Promise<HomepageSection[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("homepage_sections")
      .select("section_key, content, image_path")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as HomepageSection[];
  },
  ["catalog-homepage"],
  { tags: ["homepage"], revalidate: REVALIDATE },
);

export const getHomepageSections = () => safe(fetchHomepageSections, [] as HomepageSection[]);

const fetchFaqs = unstable_cache(
  async (): Promise<FaqItem[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("faqs")
      .select("id, question_sw, question_en, answer_sw, answer_en")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as FaqItem[];
  },
  ["catalog-faqs"],
  { tags: ["faqs"], revalidate: REVALIDATE },
);

export const getFaqs = () => safe(fetchFaqs, [] as FaqItem[]);

const fetchSitemapEntries = unstable_cache(
  async (): Promise<{
    products: { slug: string; updated_at: string; primary_image_path: string | null }[];
    categories: { slug: string }[];
  }> => {
    const supabase = createPublicClient();
    const [p, c] = await Promise.all([
      supabase.from("product_listing").select("slug, updated_at, primary_image_path").eq("status", "published"),
      supabase.from("categories").select("slug").eq("is_visible", true),
    ]);
    if (p.error) throw new Error(p.error.message);
    if (c.error) throw new Error(c.error.message);
    return { products: (p.data ?? []) as { slug: string; updated_at: string; primary_image_path: string | null }[], categories: c.data ?? [] };
  },
  ["catalog-sitemap"],
  { tags: ["products", "categories"], revalidate: 3600 },
);

export const getSitemapEntries = () =>
  safe(fetchSitemapEntries, {
    products: [] as { slug: string; updated_at: string; primary_image_path: string | null }[],
    categories: [] as { slug: string }[],
  });

/* ----------------------------------------------------------- promotions + reviews */

const fetchPromotions = unstable_cache(
  async (): Promise<Promotion[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("promotions")
      .select(
        "id, slug, name, description_sw, description_en, banner_image_path, starts_at, ends_at, promotion_products(product_id)",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as (Omit<Promotion, "product_ids"> & { promotion_products: { product_id: string }[] })[]).map(
      ({ promotion_products, ...rest }) => ({ ...rest, product_ids: (promotion_products ?? []).map((p) => p.product_id) }),
    );
  },
  ["catalog-promotions"],
  { tags: ["promotions"], revalidate: REVALIDATE },
);

/** Promotions that are switched on AND inside their start/end dates right now. */
export async function getLivePromotions(): Promise<Promotion[]> {
  const all = await safe(fetchPromotions, [] as Promotion[]);
  const now = Date.now();
  return all.filter(
    (p) => (!p.starts_at || new Date(p.starts_at).getTime() <= now) && (!p.ends_at || new Date(p.ends_at).getTime() > now),
  );
}

const fetchReviews = unstable_cache(
  async (productId: string): Promise<Review[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("id, reviewer_name, rating, body, is_verified_purchase, created_at")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (data ?? []) as Review[];
  },
  ["catalog-reviews"],
  { tags: ["reviews"], revalidate: REVALIDATE },
);

export const getProductReviews = (productId: string) => safe(() => fetchReviews(productId), [] as Review[]);
