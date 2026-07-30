import type { SupabaseClient } from "@supabase/supabase-js";

export async function logoutUser({ supabase }: { supabase: SupabaseClient }): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}
