"use server";

import { redirect } from "next/navigation";
import { registerUser } from "@/lib/auth/registerUser";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function registerAction(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
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
    return { error: error instanceof Error ? error.message : "Could not register" };
  }

  redirect("/");
}
