import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "admin" | "staff";

export interface StaffProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: StaffRole;
}

export interface CurrentStaff {
  user: User;
  profile: StaffProfile;
}

/**
 * Returns the signed-in staff member, or null.
 * Uses auth.getUser() (verified with Supabase) - never trust getSession() on the server.
 */
export const getCurrentStaff = cache(async (): Promise<CurrentStaff | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) return null;
  return { user, profile: profile as StaffProfile };
});

/** Use at the top of every protected admin page/layout/action. */
export async function requireStaff(): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

/** Same as requireStaff but only for administrators. */
export async function requireAdmin(): Promise<CurrentStaff> {
  const staff = await requireStaff();
  if (staff.profile.role !== "admin") redirect("/admin");
  return staff;
}
