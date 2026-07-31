import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListenMethod } from "./upsertRating";
import { areFriends } from "../friendships/areFriends";

export type RatingDetail = {
  id: string;
  score: number;
  listenMethod: ListenMethod;
  reviewText: string | null;
  album: {
    mbReleaseGroupId: string;
    title: string;
    artist: string;
    coverUrl: string | null;
  };
};

type RatingRow = {
  id: string;
  user_id: string;
  score: number;
  listen_method: ListenMethod;
  review_text: string | null;
  albums: {
    mb_release_group_id: string;
    title: string;
    artist: string;
    cover_url: string | null;
  };
};

/**
 * Score, listen method, and album info are visible to any viewer; review
 * text only to the rating's owner or an accepted Friend (see CONTEXT.md).
 * `viewerId` is null for a logged-out visitor, who can never see it.
 */
export async function getRatingDetail(
  ratingId: string,
  viewerId: string | null,
  { supabase }: { supabase: SupabaseClient }
): Promise<RatingDetail | null> {
  const { data } = await supabase
    .from("ratings")
    .select(
      "id, user_id, score, listen_method, review_text, albums ( mb_release_group_id, title, artist, cover_url )"
    )
    .eq("id", ratingId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const row = data as unknown as RatingRow;
  const isOwner = viewerId === row.user_id;
  const canSeeReview =
    isOwner || (viewerId !== null && (await areFriends(viewerId, row.user_id, { supabase })));

  return {
    id: row.id,
    score: row.score,
    listenMethod: row.listen_method,
    reviewText: canSeeReview ? row.review_text : null,
    album: {
      mbReleaseGroupId: row.albums.mb_release_group_id,
      title: row.albums.title,
      artist: row.albums.artist,
      coverUrl: row.albums.cover_url,
    },
  };
}
