"use server";

import { adminContext, guard, type ActionResult } from "@/lib/admin/server-utils";
import { parseSettingsForm } from "@/lib/admin/schemas";
import { saveSettings } from "@/lib/admin/mutations/content";

export async function saveSettingsAction(formData: FormData): Promise<ActionResult> {
  const { sb, staff } = await adminContext("admin");
  return guard(() => saveSettings(sb, staff.user.id, parseSettingsForm(formData)), "Settings saved. WhatsApp buttons across the website now use the new details.");
}
