import type { SupabaseClient } from "@supabase/supabase-js";

/** Any Supabase client (server action client, or one signed in as staff in tests). */
export type Sb = SupabaseClient;

/** Removes files from Storage. Provided by the caller so database logic stays testable. */
export type RemoveFiles = (paths: string[]) => Promise<void>;
export type CopyFile = (from: string, to: string) => Promise<boolean>;
