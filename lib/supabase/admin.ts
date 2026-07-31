import { createClient } from "@supabase/supabase-js";

/** Privileged, session-untouched service_role client — never call auth.signUp/signInWithPassword on this. */
export function createAdminSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
