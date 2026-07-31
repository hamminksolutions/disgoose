"use server";

import { redirect } from "next/navigation";
import { logoutUser } from "@/lib/auth/logoutUser";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function logoutAction() {
  await logoutUser({ supabase: await createServerSupabaseClient() });
  redirect("/login");
}
