import type { SupabaseClient } from "@supabase/supabase-js";

export type FriendshipStatus = "pending" | "accepted";

export type Friendship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
};

export type SendFriendRequestInput = {
  requesterId: string;
  addresseeUsername: string;
};

export async function sendFriendRequest(
  { requesterId, addresseeUsername }: SendFriendRequestInput,
  { supabase }: { supabase: SupabaseClient }
): Promise<Friendship> {
  const { data: addressee, error: addresseeError } = await supabase
    .from("users")
    .select("id")
    .eq("username", addresseeUsername)
    .single();
  if (addresseeError || !addressee) {
    throw new Error(`No user found with username "${addresseeUsername}"`);
  }
  const addresseeId = addressee.id as string;

  if (addresseeId === requesterId) {
    throw new Error("You can't send a friend request to yourself");
  }

  // The addressee may already have sent a request the other way — resolve
  // both into a single accepted Friendship instead of a second pending row.
  const { data: reverse } = await supabase
    .from("friendships")
    .select("id")
    .eq("requester_id", addresseeId)
    .eq("addressee_id", requesterId)
    .eq("status", "pending")
    .maybeSingle();

  if (reverse) {
    const { data, error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", reverse.id)
      .select()
      .single();
    if (error) {
      throw new Error(`Could not accept mutual friend request: ${error.message}`);
    }
    return toFriendship(data);
  }

  const { data, error } = await supabase
    .from("friendships")
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: "pending" })
    .select()
    .single();
  if (error) {
    throw new Error(`Could not send friend request: ${error.message}`);
  }
  return toFriendship(data);
}

export function toFriendship(row: {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
}): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status as FriendshipStatus,
  };
}
