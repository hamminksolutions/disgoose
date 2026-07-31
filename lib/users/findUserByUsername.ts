import type { SupabaseClient } from "@supabase/supabase-js";

export type FoundUser = {
  id: string;
  username: string;
};

export async function findUserByUsername(
  username: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<FoundUser | null> {
  const { data } = await supabase
    .from("users")
    .select("id, username")
    .eq("username_lower", username.toLowerCase())
    .maybeSingle();

  return data;
}
