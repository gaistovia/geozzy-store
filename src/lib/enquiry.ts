"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Records that a customer tapped "Order via WhatsApp".
 * - Fire-and-forget: if it fails, WhatsApp still opens. Ordering never depends on it.
 * - Stores items, prices and a reference only. No name, phone or account.
 * - It does NOT prove the WhatsApp message was sent or read.
 */
export function logOrderEnquiry(
  source: "cart" | "product",
  items: { variant_id: string; quantity: number }[],
  reference: string,
): void {
  try {
    const supabase = createClient();
    void Promise.resolve(
      supabase.rpc("create_order_enquiry", { p_source: source, p_items: items, p_reference: reference }),
    ).then(
      () => undefined,
      () => undefined,
    );
  } catch {
    // Ignore: logging must never block ordering.
  }
}

/** Opens WhatsApp in a new tab; falls back to same-tab navigation if the popup is blocked. */
export function openWhatsApp(url: string): void {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) window.location.href = url;
}
