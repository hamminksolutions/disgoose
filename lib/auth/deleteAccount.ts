import type { SupabaseClient } from "@supabase/supabase-js";

// users.id -> auth.users.id, ratings.user_id and friendships.*_id -> users.id
// all cascade on delete, so removing the auth user is the whole operation.
export async function deleteAccount(
  userId: string,
  { supabaseAdmin }: { supabaseAdmin: SupabaseClient }
): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`Could not delete account: ${error.message}`);
  }
}
