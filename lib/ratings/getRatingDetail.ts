import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListenMethod } from "./upsertRating";

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

export async function getRatingDetail(
  ratingId: string,
  userId: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<RatingDetail | null> {
  const { data } = await supabase
    .from("ratings")
    .select(
      "id, score, listen_method, review_text, albums ( mb_release_group_id, title, artist, cover_url )"
    )
    .eq("id", ratingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const row = data as unknown as RatingRow;
  return {
    id: row.id,
    score: row.score,
    listenMethod: row.listen_method,
    reviewText: row.review_text,
    album: {
      mbReleaseGroupId: row.albums.mb_release_group_id,
      title: row.albums.title,
      artist: row.albums.artist,
      coverUrl: row.albums.cover_url,
    },
  };
}
