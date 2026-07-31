"use server";

import { registerUser } from "@/lib/auth/registerUser";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type RegisterActionState = { error: string | null; registered: boolean };

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "");

  try {
    await registerUser(
      { email, password, username },
      {
        supabase: await createServerSupabaseClient(),
        supabaseAdmin: createAdminSupabaseClient(),
      }
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not register", registered: false };
  }

  // No session yet — registering no longer auto-confirms the email (see
  // lib/auth/registerUser.ts), so there's nowhere logged-in to redirect to.
  return { error: null, registered: true };
}
