"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { deleteAccount } from "@/lib/auth/deleteAccount";
import { logoutUser } from "@/lib/auth/logoutUser";

export async function deleteAccountAction() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  await deleteAccount(user.id, { supabaseAdmin: createAdminSupabaseClient() });
  await logoutUser({ supabase });
  redirect("/login");
}
