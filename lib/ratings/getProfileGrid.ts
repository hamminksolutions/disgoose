import type { SupabaseClient } from "@supabase/supabase-js";

export type GridEntry = {
  ratingId: string;
  score: number;
  mbReleaseGroupId: string;
  title: string;
  artist: string;
  coverUrl: string | null;
};

type RatingRow = {
  id: string;
  score: number;
  albums: {
    mb_release_group_id: string;
    title: string;
    artist: string;
    cover_url: string | null;
  };
};

export async function getProfileGrid(
  userId: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<GridEntry[]> {
  const { data, error } = await supabase
    .from("ratings")
    .select(
      "id, score, albums ( mb_release_group_id, title, artist, cover_url )"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw new Error(`Could not load profile grid: ${error.message}`);
  }

  return (data as unknown as RatingRow[]).map((row) => ({
    ratingId: row.id,
    score: row.score,
    mbReleaseGroupId: row.albums.mb_release_group_id,
    title: row.albums.title,
    artist: row.albums.artist,
    coverUrl: row.albums.cover_url,
  }));
}
