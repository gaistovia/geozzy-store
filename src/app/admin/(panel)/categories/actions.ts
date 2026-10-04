"use server";

import { redirect } from "next/navigation";
import { adminContext, guard, runAndReturn, storageHelpers, uuidOrThrow, type ActionResult } from "@/lib/admin/server-utils";
import { parseCategoryForm, optStr } from "@/lib/admin/schemas";
import * as C from "@/lib/admin/mutations/categories";

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  let id = "";
  const result = await guard(async () => {
    id = (await C.createCategory(sb, parseCategoryForm(formData))).id;
  });
  if (result && result.error) return result;
  redirect(`/admin/categories/${id}?saved=${encodeURIComponent("Category created.")}`);
}

export async function updateCategoryAction(id: string, formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(
    () => C.updateCategory(sb, uuidOrThrow(id), parseCategoryForm(formData), storageHelpers(sb).removeFiles),
    "Category saved.",
  );
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext("admin");
  const id = uuidOrThrow(formData.get("id"));
  const moveTo = optStr(formData, "move_to");
  await runAndReturn(
    `/admin/categories/${id}`,
    () => C.deleteCategory(sb, id, moveTo ? uuidOrThrow(moveTo) : null, storageHelpers(sb).removeFiles),
    "Category deleted.",
    "/admin/categories",
  );
}
