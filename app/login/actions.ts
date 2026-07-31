"use server";

import { redirect } from "next/navigation";
import { loginUser } from "@/lib/auth/loginUser";
import { requestPasswordReset } from "@/lib/auth/requestPasswordReset";
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

export type RequestPasswordResetState = { sent: boolean };

export async function requestPasswordResetAction(
  _prevState: RequestPasswordResetState,
  formData: FormData
): Promise<RequestPasswordResetState> {
  const email = String(formData.get("email") ?? "");

  // Always report success, whether or not the email exists — resetPasswordForEmail
  // itself behaves this way by design, to avoid leaking which emails are registered.
  try {
    await requestPasswordReset(
      { email },
      {
        supabase: await createServerSupabaseClient(),
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL!}/reset-password`,
      }
    );
  } catch {
    // swallow — see comment above
  }

  return { sent: true };
}
