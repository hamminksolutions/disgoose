import type { SupabaseClient } from "@supabase/supabase-js";

/** Declines a pending request or ends an accepted friendship — same operation either way: a plain, silent delete. */
export async function removeFriendship(
  friendshipId: string,
  currentUserId: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<void> {
  const { data, error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Could not remove friendship: ${error.message}`);
  }
  if (!data) {
    throw new Error("Friendship not found");
  }
}
