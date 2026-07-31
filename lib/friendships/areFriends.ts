import type { SupabaseClient } from "@supabase/supabase-js";

export async function areFriends(
  userIdA: string,
  userIdB: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<boolean> {
  const { data } = await supabase
    .from("friendships")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${userIdA},addressee_id.eq.${userIdB}),and(requester_id.eq.${userIdB},addressee_id.eq.${userIdA})`
    )
    .maybeSingle();

  return data !== null;
}
