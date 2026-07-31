import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createTestSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Simulates clicking the confirmation-email link, for tests that need a login-able account. */
export async function confirmTestUserEmail(supabaseAdmin: SupabaseClient, userId: string) {
  await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
}
