export interface Category {
  id: string;
  slug: string;
  name_sw: string;
  name_en: string;
  description_sw: string | null;
  description_en: string | null;
  image_path: string | null;
  is_featured: boolean;
  sort_order: number;
}

export interface VariantLite {
  id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
}

/** One product as shown on cards and grids (from the product_listing view). */
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category_slug: string | null;
  category_name_sw: string | null;
  category_name_en: string | null;
  regular_price: number;
  sale_price: number | null;
  current_price: number;
  discount_percent: number;
  is_new: boolean;
  is_featured: boolean;
  primary_image_path: string | null;
  primary_image_alt: string | null;
  in_stock: boolean;
  total_stock: number;
  variants: VariantLite[];
}

export interface ProductImage {
  id: string;
  storage_path: string;
  alt: string | null;
  position: number;
  is_primary: boolean;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  sku: string | null;
  short_description_sw: string | null;
  short_description_en: string | null;
  description_sw: string | null;
  description_en: string | null;
  specifications: Record<string, unknown>;
  regular_price: number;
  current_price: number;
  discount_percent: number;
  is_new: boolean;
  in_stock: boolean;
  total_stock: number;
  updated_at: string;
  category: { slug: string; name_sw: string; name_en: string } | null;
  images: ProductImage[];
  variants: (VariantLite & { sort_order: number })[];
}

export interface FaqItem {
  id: string;
  question_sw: string;
  question_en: string;
  answer_sw: string;
  answer_en: string;
}

export interface HomepageSection {
  section_key: string;
  content: Record<string, unknown>;
  image_path: string | null;
}

export type SortKey = "newest" | "price_asc" | "price_desc";

export interface ListParams {
  q?: string;
  category?: string;
  sort: SortKey;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  ids?: string[];
  page: number;
  pageSize: number;
}

export interface Promotion {
  id: string;
  slug: string;
  name: string;
  description_sw: string | null;
  description_en: string | null;
  banner_image_path: string | null;
  starts_at: string | null;
  ends_at: string | null;
  product_ids: string[];
}

export interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  body: string;
  is_verified_purchase: boolean;
  created_at: string;
}
