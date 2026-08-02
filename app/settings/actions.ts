"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { updateAvatarUrl } from "@/lib/users/updateAvatarUrl";

export async function updateAvatarUrlAction(avatarUrl: string): Promise<{ error: string | null }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    await updateAvatarUrl(user.id, avatarUrl, { supabase: createAdminSupabaseClient() });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update avatar" };
  }

  return { error: null };
}
