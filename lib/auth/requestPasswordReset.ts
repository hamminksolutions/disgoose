import type { SupabaseClient } from "@supabase/supabase-js";

export type RequestPasswordResetInput = { email: string };

export async function requestPasswordReset(
  { email }: RequestPasswordResetInput,
  { supabase, redirectTo }: { supabase: SupabaseClient; redirectTo: string }
): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    throw error;
  }
}
