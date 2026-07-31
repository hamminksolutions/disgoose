import type { SupabaseClient } from "@supabase/supabase-js";

export type PendingRequest = {
  id: string;
  requesterUsername: string;
};

export async function getPendingRequests(
  userId: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<PendingRequest[]> {
  const { data: requests, error } = await supabase
    .from("friendships")
    .select("id, requester_id")
    .eq("addressee_id", userId)
    .eq("status", "pending");
  if (error) {
    throw new Error(`Could not load pending requests: ${error.message}`);
  }
  if (requests.length === 0) {
    return [];
  }

  const requesterIds = requests.map((r) => r.requester_id);
  const { data: requesters, error: requestersError } = await supabase
    .from("users")
    .select("id, username")
    .in("id", requesterIds);
  if (requestersError) {
    throw new Error(`Could not load requester usernames: ${requestersError.message}`);
  }
  const usernameById = new Map(requesters.map((u) => [u.id, u.username]));

  return requests.map((r) => ({
    id: r.id,
    requesterUsername: usernameById.get(r.requester_id) ?? "unknown",
  }));
}
