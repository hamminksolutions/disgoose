"use server";

import { redirect } from "next/navigation";
import { loginUser } from "@/lib/auth/loginUser";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function loginAction(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await loginUser({ email, password }, { supabase: await createServerSupabaseClient() });
  } catch {
    return { error: "Incorrect email or password" };
  }

  redirect("/");
}
