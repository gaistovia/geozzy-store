import { AdminError, dbError } from "../errors";
import type { OrderStatus } from "../schemas";
import type { Sb } from "./types";

export async function updateOrder(sb: Sb, id: string, input: { status: OrderStatus; notes: string | null }): Promise<void> {
  const { data, error } = await sb.from("orders").update(input).eq("id", id).select("id");
  if (error) throw dbError(error);
  if (!data || data.length === 0) throw new AdminError("The enquiry was not found.");
}
