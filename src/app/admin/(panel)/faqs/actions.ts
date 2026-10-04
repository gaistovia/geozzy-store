"use server";

import { adminContext, guard, runAndReturn, uuidOrThrow, type ActionResult } from "@/lib/admin/server-utils";
import { parseFaqForm } from "@/lib/admin/schemas";
import { createFaq, deleteFaq, updateFaq } from "@/lib/admin/mutations/content";

export async function createFaqAction(formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(() => createFaq(sb, parseFaqForm(formData)), "Question added.");
}

export async function updateFaqAction(id: string, formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(() => updateFaq(sb, uuidOrThrow(id), parseFaqForm(formData)), "Question saved.");
}

export async function deleteFaqAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  await runAndReturn("/admin/faqs", () => deleteFaq(sb, uuidOrThrow(formData.get("id"))), "Question deleted.");
}
