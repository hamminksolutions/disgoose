import type { SupabaseClient } from "@supabase/supabase-js";

export type UpdatePasswordInput = { password: string };

export async function updatePassword(
  { password }: UpdatePasswordInput,
  { supabase }: { supabase: SupabaseClient }
): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw error;
  }
}
