import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The client already uploaded to its own uid-prefixed path (enforced by the
 * avatars bucket's RLS) — this re-checks the URL shape server-side before
 * persisting it, so a tampered request can't point avatar_url at an
 * arbitrary external image. Anchored to the start of the pathname (not a
 * substring match) so a crafted URL can't smuggle the prefix into a query
 * param on some other host.
 */
export function isOwnAvatarUrl(avatarUrl: string, userId: string): boolean {
  let pathname: string;
  try {
    pathname = new URL(avatarUrl).pathname;
  } catch {
    return false;
  }
  return pathname.startsWith(`/storage/v1/object/public/avatars/${userId}/`);
}

export async function updateAvatarUrl(
  userId: string,
  avatarUrl: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<void> {
  if (!isOwnAvatarUrl(avatarUrl, userId)) {
    throw new Error("Avatar URL does not belong to this user");
  }

  const { error } = await supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", userId);
  if (error) {
    throw new Error(`Could not update avatar: ${error.message}`);
  }
}
