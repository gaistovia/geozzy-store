import { AdminError, dbError } from "../errors";
import type { CategoryInput } from "../schemas";
import type { RemoveFiles, Sb } from "./types";

export async function createCategory(sb: Sb, input: CategoryInput): Promise<{ id: string }> {
  const { data, error } = await sb.from("categories").insert(input).select("id").single();
  if (error || !data) throw dbError(error ?? {});
  return { id: data.id as string };
}

export async function updateCategory(sb: Sb, id: string, input: CategoryInput, removeFiles: RemoveFiles): Promise<void> {
  const { data: old } = await sb.from("categories").select("image_path").eq("id", id).maybeSingle();
  const { error } = await sb.from("categories").update(input).eq("id", id);
  if (error) throw dbError(error);
  if (old?.image_path && old.image_path !== input.image_path) await removeFiles([old.image_path as string]);
}

/**
 * Deletes a category. If it still has products, they must be moved to another
 * category first (pass `moveToId`), otherwise the delete is refused.
 */
export async function deleteCategory(sb: Sb, id: string, moveToId: string | null, removeFiles: RemoveFiles): Promise<void> {
  // Check permission first so a refused delete never moves products around.
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (isAdmin !== true) throw new AdminError("Only an administrator can delete categories.");

  const { count } = await sb.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if ((count ?? 0) > 0) {
    if (!moveToId) {
      throw new AdminError(`This category still has ${count} product(s). Choose another category to move them to, then delete.`);
    }
    if (moveToId === id) throw new AdminError("Choose a different category to move the products to.");
    const { error: moveError } = await sb.from("products").update({ category_id: moveToId }).eq("category_id", id);
    if (moveError) throw dbError(moveError);
  }
  const { data: cat } = await sb.from("categories").select("image_path").eq("id", id).maybeSingle();
  const { data, error } = await sb.from("categories").delete().eq("id", id).select("id");
  if (error) throw dbError(error);
  if (!data || data.length === 0) throw new AdminError("Only an administrator can delete categories.");
  if (cat?.image_path) await removeFiles([cat.image_path as string]);
}
