import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdmin, requireStaff, type CurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { messageOf } from "./errors";
import type { Sb } from "./mutations/types";

export type ActionResult = { ok?: boolean; error?: string; message?: string } | void;

const BUCKET = "store-media";
const ALLOWED_FOLDERS = ["products/", "categories/", "homepage/", "promotions/", "branding/"];

/** Always call first in an action: confirms the person is staff/admin and gives a client that runs AS them (RLS applies). */
export async function adminContext(role: "staff" | "admin" = "staff"): Promise<{ sb: Sb; staff: CurrentStaff }> {
  const staff = role === "admin" ? await requireAdmin() : await requireStaff();
  const sb = (await createClient()) as unknown as Sb;
  return { sb, staff };
}

export function storageHelpers(sb: Sb) {
  return {
    removeFiles: async (paths: string[]) => {
      const safe = paths.filter((p) => p && !p.includes("..") && ALLOWED_FOLDERS.some((f) => p.startsWith(f)));
      if (safe.length === 0) return;
      await sb.storage.from(BUCKET).remove(safe); // best effort: a leftover file is harmless
    },
    copyFile: async (from: string, to: string) => {
      if (from.includes("..") || to.includes("..")) return false;
      const { error } = await sb.storage.from(BUCKET).copy(from, to);
      return !error;
    },
  };
}

/** Makes the public site show the change straight away. */
export function revalidateStore(): void {
  for (const tag of ["products", "categories", "homepage", "faqs", "settings", "promotions", "reviews"]) {
    revalidateTag(tag);
  }
  revalidatePath("/", "layout");
}

/** For forms handled by <ActionForm>: returns {ok} or {error} instead of throwing. */
export async function guard(fn: () => Promise<void>, message = "Saved."): Promise<ActionResult> {
  try {
    await fn();
  } catch (e) {
    unstable_rethrow(e);
    return { error: messageOf(e) };
  }
  revalidateStore();
  return { ok: true, message };
}

/** Only allow redirects back into the admin area. */
export function safeReturnTo(value: FormDataEntryValue | null, fallback = "/admin"): string {
  const v = typeof value === "string" ? value.split("?")[0]! : "";
  return v.startsWith("/admin") && !v.startsWith("//") && !v.includes("\\") ? v : fallback;
}

function withParam(path: string, key: string, value: string): string {
  return `${path}?${key}=${encodeURIComponent(value.slice(0, 300))}`;
}

/** For plain button forms: run, then redirect back with a ?saved= or ?error= message. */
export async function runAndReturn(returnTo: string, fn: () => Promise<void>, saved: string, successTo: string = returnTo): Promise<never> {
  let error: string | null = null;
  try {
    await fn();
  } catch (e) {
    unstable_rethrow(e);
    error = messageOf(e);
  }
  if (error) redirect(withParam(returnTo, "error", error));
  revalidateStore();
  redirect(withParam(successTo, "saved", saved));
}

export function uuidOrThrow(value: FormDataEntryValue | string | null): string {
  const v = typeof value === "string" ? value : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) throw new Error("Invalid id.");
  return v;
}
