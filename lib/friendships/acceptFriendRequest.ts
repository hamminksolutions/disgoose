import type { SupabaseClient } from "@supabase/supabase-js";
import { toFriendship, type Friendship } from "./sendFriendRequest";

export async function acceptFriendRequest(
  requestId: string,
  currentUserId: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<Friendship> {
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", requestId)
    .eq("addressee_id", currentUserId)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Could not accept friend request: ${error.message}`);
  }
  if (!data) {
    throw new Error("Friend request not found");
  }

  return toFriendship(data);
}
