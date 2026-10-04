"use server";

import { adminContext, guard, uuidOrThrow, type ActionResult } from "@/lib/admin/server-utils";
import { parseOrderForm } from "@/lib/admin/schemas";
import { updateOrder } from "@/lib/admin/mutations/orders";

export async function updateOrderAction(id: string, formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(() => updateOrder(sb, uuidOrThrow(id), parseOrderForm(formData)), "Enquiry updated.");
}
