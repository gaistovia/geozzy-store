import { AdminError, dbError } from "../errors";
import { slugify } from "@/lib/format";
import type { ProductInput } from "../schemas";
import type { CopyFile, RemoveFiles, Sb } from "./types";

export async function createProduct(
  sb: Sb,
  input: ProductInput,
  sizes: string[],
  initialStock: number,
): Promise<{ id: string }> {
  const { data, error } = await sb.from("products").insert(input).select("id").single();
  if (error || !data) throw dbError(error ?? {});

  const { error: vError } = await sb.from("product_variants").insert(
    sizes.map((size, i) => ({ product_id: data.id, size, stock_quantity: initialStock, sort_order: i })),
  );
  if (vError) {
    // Do not leave a product without options behind.
    await sb.from("products").delete().eq("id", data.id);
    throw dbError(vError);
  }
  return { id: data.id as string };
}

export async function updateProduct(sb: Sb, id: string, input: ProductInput): Promise<void> {
  const { error } = await sb.from("products").update(input).eq("id", id);
  if (error) throw dbError(error);
}

export async function setProductStatus(sb: Sb, id: string, status: "draft" | "published" | "archived"): Promise<void> {
  const { error } = await sb.from("products").update({ status }).eq("id", id);
  if (error) throw dbError(error);
}

export async function setProductFlag(
  sb: Sb,
  id: string,
  flag: "is_featured" | "is_new" | "is_promotional",
  value: boolean,
): Promise<void> {
  const { error } = await sb.from("products").update({ [flag]: value }).eq("id", id);
  if (error) throw dbError(error);
}

/** Finds a free slug like "name-copy", "name-copy-2". */
async function freeSlug(sb: Sb, base: string): Promise<string> {
  for (let i = 1; i <= 50; i++) {
    const candidate = (i === 1 ? base : `${base}-${i}`).slice(0, 120);
    const { data } = await sb.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  throw new AdminError("Could not find a free web address for the copy.");
}

/** Copies a product (as a draft) with its options and images. */
export async function duplicateProduct(sb: Sb, id: string, copyFile: CopyFile): Promise<{ id: string }> {
  const { data: p, error } = await sb.from("products").select("*").eq("id", id).single();
  if (error || !p) throw new AdminError("The product was not found.");

  const slug = await freeSlug(sb, slugify(`${p.slug}-copy`));
  const { id: _id, created_at: _c, updated_at: _u, published_at: _p, sku: _s, legacy_url: _l, slug: _slug, name, ...rest } = p;
  void [_id, _c, _u, _p, _s, _l, _slug];

  const { data: copy, error: cError } = await sb
    .from("products")
    .insert({ ...rest, name: `${name} (copy)`.slice(0, 200), slug, sku: null, status: "draft", is_featured: false })
    .select("id")
    .single();
  if (cError || !copy) throw dbError(cError ?? {});

  const { data: variants } = await sb.from("product_variants").select("size, color, stock_quantity, is_active, sort_order").eq("product_id", id);
  if (variants?.length) {
    const { error: vError } = await sb.from("product_variants").insert(variants.map((v) => ({ ...v, product_id: copy.id })));
    if (vError) throw dbError(vError);
  }

  const { data: images } = await sb.from("product_images").select("storage_path, alt, position, is_primary").eq("product_id", id).order("position");
  for (const img of images ?? []) {
    const file = img.storage_path.split("/").pop() ?? `${img.position}.webp`;
    const target = `products/${copy.id}/${file}`;
    if (await copyFile(img.storage_path, target)) {
      await sb.from("product_images").insert({
        product_id: copy.id,
        storage_path: target,
        alt: img.alt,
        position: img.position,
        is_primary: img.is_primary,
      });
    }
  }
  return { id: copy.id as string };
}

/** Deletes a product and its image files. Only admins can delete (enforced by the database). */
export async function deleteProduct(sb: Sb, id: string, removeFiles: RemoveFiles): Promise<void> {
  const { data: images } = await sb.from("product_images").select("storage_path").eq("product_id", id);
  const { data, error } = await sb.from("products").delete().eq("id", id).select("id");
  if (error) throw dbError(error);
  if (!data || data.length === 0) throw new AdminError("Only an administrator can delete products.");
  await removeFiles((images ?? []).map((i) => i.storage_path as string));
}

/* ------------------------------------------------------------------ variants */

export interface VariantInput {
  size: string | null;
  color: string | null;
  stock_quantity: number;
  is_active: boolean;
}

export async function addVariant(sb: Sb, productId: string, v: VariantInput): Promise<void> {
  if (!v.size && !v.color) throw new AdminError("Enter a size or a color.");
  const { count } = await sb.from("product_variants").select("id", { count: "exact", head: true }).eq("product_id", productId);
  const { error } = await sb.from("product_variants").insert({ ...v, product_id: productId, sort_order: count ?? 0 });
  if (error) throw dbError(error);
}

export async function updateVariant(sb: Sb, id: string, v: VariantInput): Promise<void> {
  if (!v.size && !v.color) throw new AdminError("Enter a size or a color.");
  const { error } = await sb.from("product_variants").update(v).eq("id", id);
  if (error) throw dbError(error);
}

export async function deleteVariant(sb: Sb, id: string): Promise<void> {
  const { error } = await sb.from("product_variants").delete().eq("id", id);
  if (error) throw dbError(error);
}

/* -------------------------------------------------------------------- images */

export async function addProductImage(sb: Sb, productId: string, path: string, alt: string | null): Promise<void> {
  if (!path.startsWith(`products/${productId}/`) || path.includes("..")) {
    throw new AdminError("That image location is not allowed.");
  }
  const { data: existing } = await sb.from("product_images").select("position").eq("product_id", productId).order("position", { ascending: false }).limit(1);
  const { count } = await sb.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
  const position = existing?.[0] ? (existing[0].position as number) + 1 : 0;
  const { error } = await sb.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    alt,
    position,
    is_primary: (count ?? 0) === 0,
  });
  if (error) throw dbError(error);
}

export async function removeProductImage(sb: Sb, imageId: string, removeFiles: RemoveFiles): Promise<void> {
  const { data: img } = await sb.from("product_images").select("id, product_id, storage_path, is_primary").eq("id", imageId).maybeSingle();
  if (!img) throw new AdminError("The image was not found.");
  const { error } = await sb.from("product_images").delete().eq("id", imageId);
  if (error) throw dbError(error);
  await removeFiles([img.storage_path as string]);
  if (img.is_primary) {
    // Promote the next image so the product always shows a photo.
    const { data: next } = await sb.from("product_images").select("id").eq("product_id", img.product_id).order("position").limit(1);
    if (next?.[0]) await sb.rpc("set_primary_image", { p_image_id: next[0].id });
  }
}

export async function setPrimaryImage(sb: Sb, imageId: string): Promise<void> {
  const { error } = await sb.rpc("set_primary_image", { p_image_id: imageId });
  if (error) throw dbError(error);
}

export async function updateImageAlt(sb: Sb, imageId: string, alt: string | null): Promise<void> {
  const { error } = await sb.from("product_images").update({ alt: alt?.slice(0, 200) ?? null }).eq("id", imageId);
  if (error) throw dbError(error);
}

/** Moves an image one step earlier ("up") or later ("down") in the gallery. */
export async function moveProductImage(sb: Sb, imageId: string, direction: "up" | "down"): Promise<void> {
  const { data: img } = await sb.from("product_images").select("id, product_id").eq("id", imageId).maybeSingle();
  if (!img) throw new AdminError("The image was not found.");
  const { data: all } = await sb.from("product_images").select("id").eq("product_id", img.product_id).order("position").order("created_at");
  const ids = (all ?? []).map((r) => r.id as string);
  const i = ids.indexOf(imageId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  for (const [position, id] of ids.entries()) {
    const { error } = await sb.from("product_images").update({ position }).eq("id", id);
    if (error) throw dbError(error);
  }
}
