import type { SupabaseClient } from "@supabase/supabase-js";

export type ListenMethod = "spotify" | "cd" | "vinyl" | "streaming_other" | "other";

export type UpsertRatingInput = {
  userId: string;
  albumId: string;
  score: number; // tenths, e.g. 85 = 8.5
  listenMethod: ListenMethod;
  reviewText?: string | null;
};

export type Rating = {
  id: string;
  userId: string;
  albumId: string;
  score: number;
  listenMethod: ListenMethod;
  reviewText: string | null;
};

export async function upsertRating(
  { userId, albumId, score, listenMethod, reviewText = null }: UpsertRatingInput,
  { supabase }: { supabase: SupabaseClient }
): Promise<Rating> {
  if (score < 10 || score > 100) {
    throw new Error("Score must be between 1.0 and 10.0");
  }
  if (reviewText && reviewText.length > 2000) {
    throw new Error("Review must be 2000 characters or fewer");
  }

  const { data, error } = await supabase
    .from("ratings")
    .upsert(
      {
        user_id: userId,
        album_id: albumId,
        score,
        listen_method: listenMethod,
        review_text: reviewText,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,album_id" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Could not save rating: ${error.message}`);
  }

  return {
    id: data.id,
    userId: data.user_id,
    albumId: data.album_id,
    score: data.score,
    listenMethod: data.listen_method,
    reviewText: data.review_text,
  };
}
