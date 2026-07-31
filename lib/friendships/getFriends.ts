import type { SupabaseClient } from "@supabase/supabase-js";

export type Friend = {
  friendshipId: string;
  userId: string;
  username: string;
};

export async function getFriends(
  userId: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<Friend[]> {
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) {
    throw new Error(`Could not load friends: ${error.message}`);
  }
  if (friendships.length === 0) {
    return [];
  }

  const friendIds = friendships.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, username")
    .in("id", friendIds);
  if (usersError) {
    throw new Error(`Could not load friend usernames: ${usersError.message}`);
  }
  const usernameById = new Map(users.map((u) => [u.id, u.username]));

  return friendships.map((f) => {
    const friendId = f.requester_id === userId ? f.addressee_id : f.requester_id;
    return {
      friendshipId: f.id,
      userId: friendId,
      username: usernameById.get(friendId) ?? "unknown",
    };
  });
}
