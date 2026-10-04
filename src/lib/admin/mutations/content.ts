import { AdminError, dbError } from "../errors";
import type { PromotionInput, SettingsInput } from "../schemas";
import type { RemoveFiles, Sb } from "./types";

/* ------------------------------------------------------------------ promotions */

export async function createPromotion(sb: Sb, input: PromotionInput): Promise<{ id: string }> {
  const { data, error } = await sb.from("promotions").insert(input).select("id").single();
  if (error || !data) throw dbError(error ?? {});
  return { id: data.id as string };
}

export async function updatePromotion(sb: Sb, id: string, input: PromotionInput, removeFiles: RemoveFiles): Promise<void> {
  const { data: old } = await sb.from("promotions").select("banner_image_path").eq("id", id).maybeSingle();
  const { error } = await sb.from("promotions").update(input).eq("id", id);
  if (error) throw dbError(error);
  if (old?.banner_image_path && old.banner_image_path !== input.banner_image_path) {
    await removeFiles([old.banner_image_path as string]);
  }
}

export async function deletePromotion(sb: Sb, id: string, removeFiles: RemoveFiles): Promise<void> {
  const { data: old } = await sb.from("promotions").select("banner_image_path").eq("id", id).maybeSingle();
  const { error } = await sb.from("promotions").delete().eq("id", id);
  if (error) throw dbError(error);
  if (old?.banner_image_path) await removeFiles([old.banner_image_path as string]);
}

export async function setPromotionProduct(sb: Sb, promotionId: string, productId: string, promoPrice: number | null): Promise<void> {
  const { error } = await sb
    .from("promotion_products")
    .upsert({ promotion_id: promotionId, product_id: productId, promo_price: promoPrice }, { onConflict: "promotion_id,product_id" });
  if (error) throw dbError(error);
}

export async function removePromotionProduct(sb: Sb, promotionId: string, productId: string): Promise<void> {
  const { error } = await sb.from("promotion_products").delete().eq("promotion_id", promotionId).eq("product_id", productId);
  if (error) throw dbError(error);
}

/* --------------------------------------------------------------------- reviews */

export async function setReviewStatus(sb: Sb, id: string, status: "pending" | "approved" | "rejected" | "hidden"): Promise<void> {
  const { error } = await sb.from("reviews").update({ status }).eq("id", id);
  if (error) throw dbError(error);
}

export async function createReview(
  sb: Sb,
  input: { reviewer_name: string; rating: number; body: string; product_id: string | null; is_verified_purchase: boolean },
): Promise<void> {
  // Reviews entered by staff are added as "pending" so they are checked before they appear.
  const { error } = await sb.from("reviews").insert({ ...input, status: "pending" });
  if (error) throw dbError(error);
}

export async function deleteReview(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("reviews").delete().eq("id", id);
  if (error) throw dbError(error);
}

/* ------------------------------------------------------------------------ faqs */

export interface FaqInput {
  question_sw: string;
  question_en: string;
  answer_sw: string;
  answer_en: string;
  sort_order: number;
  is_published: boolean;
}

export async function createFaq(sb: Sb, input: FaqInput): Promise<void> {
  const { error } = await sb.from("faqs").insert(input);
  if (error) throw dbError(error);
}

export async function updateFaq(sb: Sb, id: string, input: FaqInput): Promise<void> {
  const { error } = await sb.from("faqs").update(input).eq("id", id);
  if (error) throw dbError(error);
}

export async function deleteFaq(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("faqs").delete().eq("id", id);
  if (error) throw dbError(error);
}

/* -------------------------------------------------------------------- settings */

export async function saveSettings(sb: Sb, userId: string, s: SettingsInput): Promise<void> {
  const rows = Object.entries(s).map(([key, value]) => ({ key, value, is_public: true, updated_by: userId }));
  const { data, error } = await sb.from("store_settings").upsert(rows, { onConflict: "key" }).select("key");
  if (error) throw dbError(error);
  if (!data || data.length === 0) throw new AdminError("Only an administrator can change store settings.");
}

/* -------------------------------------------------------------------- homepage */

export interface HomepageSectionInput {
  content: Record<string, unknown>;
  image_path: string | null;
  is_active: boolean;
}

export async function saveHomepage(
  sb: Sb,
  sections: Record<"hero" | "why_shop" | "whatsapp_cta", HomepageSectionInput>,
  removeFiles: RemoveFiles,
): Promise<void> {
  const { data: oldHero } = await sb.from("homepage_sections").select("image_path").eq("section_key", "hero").maybeSingle();
  const order = { hero: 10, why_shop: 20, whatsapp_cta: 30 } as const;
  const rows = (Object.keys(sections) as (keyof typeof sections)[]).map((key) => ({
    section_key: key,
    sort_order: order[key],
    ...sections[key],
  }));
  const { error } = await sb.from("homepage_sections").upsert(rows, { onConflict: "section_key" });
  if (error) throw dbError(error);
  if (oldHero?.image_path && oldHero.image_path !== sections.hero.image_path) await removeFiles([oldHero.image_path as string]);
}
