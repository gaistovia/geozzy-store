"use server";

import { adminContext, guard, storageHelpers, type ActionResult } from "@/lib/admin/server-utils";
import { parseHomepageForm } from "@/lib/admin/schemas";
import { saveHomepage } from "@/lib/admin/mutations/content";

export async function saveHomepageAction(formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(() => saveHomepage(sb, parseHomepageForm(formData), storageHelpers(sb).removeFiles), "Homepage saved.");
}
