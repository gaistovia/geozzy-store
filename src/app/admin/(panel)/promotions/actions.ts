"use server";

import { redirect } from "next/navigation";
import { adminContext, guard, runAndReturn, safeReturnTo, storageHelpers, uuidOrThrow, type ActionResult } from "@/lib/admin/server-utils";
import { parsePromoPrice, parsePromotionForm } from "@/lib/admin/schemas";
import { eatInputToIso } from "@/lib/admin/time";
import * as X from "@/lib/admin/mutations/content";

export async function createPromotionAction(formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  let id = "";
  const result = await guard(async () => {
    id = (await X.createPromotion(sb, parsePromotionForm(formData, eatInputToIso))).id;
  });
  if (result && result.error) return result;
  redirect(`/admin/promotions/${id}?saved=${encodeURIComponent("Promotion created. Now add products to it.")}`);
}

export async function updatePromotionAction(id: string, formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(
    () => X.updatePromotion(sb, uuidOrThrow(id), parsePromotionForm(formData, eatInputToIso), storageHelpers(sb).removeFiles),
    "Promotion saved.",
  );
}

export async function deletePromotionAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  const id = uuidOrThrow(formData.get("id"));
  await runAndReturn(`/admin/promotions/${id}`, () => X.deletePromotion(sb, id, storageHelpers(sb).removeFiles), "Promotion deleted.", "/admin/promotions");
}

export async function setPromotionProductAction(promotionId: string, formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(async () => {
    await X.setPromotionProduct(sb, uuidOrThrow(promotionId), uuidOrThrow(formData.get("product_id")), parsePromoPrice(formData));
  }, "Saved.");
}

export async function removePromotionProductAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  const returnTo = safeReturnTo(formData.get("returnTo"), "/admin/promotions");
  await runAndReturn(returnTo, () => X.removePromotionProduct(sb, uuidOrThrow(formData.get("promotion_id")), uuidOrThrow(formData.get("product_id"))), "Product removed from the promotion.");
}
