import type { SupabaseClient } from "@supabase/supabase-js";
import type { GridEntry } from "./getProfileGrid";
import type { ListenMethod } from "./upsertRating";

export type SortBy = "newest" | "highest_rated";

export type GetAllRatingsOptions = {
  page: number;
  pageSize: number;
  sortBy: SortBy;
};

export type PaginatedRatings = {
  items: GridEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
};

type RatingRow = {
  id: string;
  score: number;
  listen_method: ListenMethod;
  albums: {
    mb_release_group_id: string;
    title: string;
    artist: string;
    cover_url: string | null;
  };
};

export async function getAllRatings(
  userId: string,
  { page, pageSize, sortBy }: GetAllRatingsOptions,
  { supabase }: { supabase: SupabaseClient }
): Promise<PaginatedRatings> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("ratings")
    .select(
      "id, score, listen_method, albums ( mb_release_group_id, title, artist, cover_url )",
      { count: "exact" }
    )
    .eq("user_id", userId);

  query =
    sortBy === "highest_rated"
      ? query.order("score", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(`Could not load ratings: ${error.message}`);
  }

  const items = (data as unknown as RatingRow[]).map((row) => ({
    ratingId: row.id,
    score: row.score,
    listenMethod: row.listen_method,
    mbReleaseGroupId: row.albums.mb_release_group_id,
    title: row.albums.title,
    artist: row.albums.artist,
    coverUrl: row.albums.cover_url,
  }));

  return { items, totalCount: count ?? 0, page, pageSize };
}
