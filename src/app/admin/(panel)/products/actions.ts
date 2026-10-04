"use server";

import { redirect } from "next/navigation";
import { adminContext, guard, runAndReturn, safeReturnTo, storageHelpers, uuidOrThrow, type ActionResult } from "@/lib/admin/server-utils";
import { AdminError } from "@/lib/admin/errors";
import { optStr, parseProductForm, parseSizeList, parseStock, parseVariantForm, str } from "@/lib/admin/schemas";
import * as P from "@/lib/admin/mutations/products";

export async function createProductAction(formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  let newId = "";
  const result = await guard(async () => {
    const input = parseProductForm(formData);
    const sizes = parseSizeList(str(formData, "sizes"));
    const stock = parseStock(formData, "initial_stock");
    newId = (await P.createProduct(sb, input, sizes, stock)).id;
  }, "Product created.");
  if (result && result.error) return result;
  redirect(`/admin/products/${newId}?saved=${encodeURIComponent("Product created. Now add photos below.")}`);
}

export async function updateProductAction(id: string, formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(async () => {
    await P.updateProduct(sb, uuidOrThrow(id), parseProductForm(formData));
  }, "Product saved. The website will show the change within a moment.");
}

export async function setStatusAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  const returnTo = safeReturnTo(formData.get("returnTo"), "/admin/products");
  const status = str(formData, "status");
  await runAndReturn(
    returnTo,
    async () => {
      if (status !== "draft" && status !== "published" && status !== "archived") throw new AdminError("Invalid status.");
      await P.setProductStatus(sb, uuidOrThrow(formData.get("id")), status);
    },
    status === "published" ? "Product published." : status === "archived" ? "Product archived." : "Product unpublished (now a draft).",
  );
}

export async function toggleFlagAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  const returnTo = safeReturnTo(formData.get("returnTo"), "/admin/products");
  const flag = str(formData, "flag");
  await runAndReturn(
    returnTo,
    async () => {
      if (flag !== "is_featured" && flag !== "is_new" && flag !== "is_promotional") throw new AdminError("Invalid option.");
      await P.setProductFlag(sb, uuidOrThrow(formData.get("id")), flag, str(formData, "value") === "true");
    },
    "Updated.",
  );
}

export async function duplicateProductAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  const returnTo = safeReturnTo(formData.get("returnTo"), "/admin/products");
  let newId = "";
  try {
    newId = (await P.duplicateProduct(sb, uuidOrThrow(formData.get("id")), storageHelpers(sb).copyFile)).id;
  } catch (e) {
    const message = e instanceof AdminError ? e.message : "Could not duplicate the product.";
    redirect(`${returnTo}?error=${encodeURIComponent(message)}`);
  }
  redirect(`/admin/products/${newId}?saved=${encodeURIComponent("Copy created as a draft. Review it, then publish.")}`);
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext("admin");
  const id = uuidOrThrow(formData.get("id"));
  await runAndReturn("/admin/products", () => P.deleteProduct(sb, id, storageHelpers(sb).removeFiles), "Product deleted.");
}

/* ------------------------------------------------------------------ variants */

export async function addVariantAction(productId: string, formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(() => P.addVariant(sb, uuidOrThrow(productId), parseVariantForm(formData)), "Option added.");
}

export async function updateVariantAction(variantId: string, formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(() => P.updateVariant(sb, uuidOrThrow(variantId), parseVariantForm(formData)), "Option saved.");
}

export async function deleteVariantAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  const returnTo = safeReturnTo(formData.get("returnTo"), "/admin/products");
  await runAndReturn(returnTo, () => P.deleteVariant(sb, uuidOrThrow(formData.get("id"))), "Option deleted.");
}

/* -------------------------------------------------------------------- images */

/** Called by the browser uploader after a file reached Storage. */
export async function recordImageAction(productId: string, path: string): Promise<{ error?: string } | void> {
  const { sb } = await adminContext();
  const result = await guard(() => P.addProductImage(sb, uuidOrThrow(productId), path, null));
  if (result && result.error) {
    // The file is useless without a record: remove it so Storage stays tidy.
    await storageHelpers(sb).removeFiles([path]);
    return { error: result.error };
  }
}

export async function setPrimaryImageAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  const returnTo = safeReturnTo(formData.get("returnTo"), "/admin/products");
  await runAndReturn(returnTo, () => P.setPrimaryImage(sb, uuidOrThrow(formData.get("id"))), "Main photo changed.");
}

export async function moveImageAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  const returnTo = safeReturnTo(formData.get("returnTo"), "/admin/products");
  const direction = str(formData, "direction") === "up" ? "up" : "down";
  await runAndReturn(returnTo, () => P.moveProductImage(sb, uuidOrThrow(formData.get("id")), direction), "Order changed.");
}

export async function removeImageAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  const returnTo = safeReturnTo(formData.get("returnTo"), "/admin/products");
  await runAndReturn(returnTo, () => P.removeProductImage(sb, uuidOrThrow(formData.get("id")), storageHelpers(sb).removeFiles), "Photo deleted.");
}

export async function updateImageAltAction(imageId: string, formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(() => P.updateImageAlt(sb, uuidOrThrow(imageId), optStr(formData, "alt")), "Description saved.");
}
