import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListenMethod, Rating } from "./upsertRating";

export type UpdateRatingInput = {
  score?: number;
  listenMethod?: ListenMethod;
  reviewText?: string | null;
};

export async function updateRating(
  ratingId: string,
  userId: string,
  { score, listenMethod, reviewText }: UpdateRatingInput,
  { supabase }: { supabase: SupabaseClient }
): Promise<Rating> {
  if (score !== undefined && (score < 10 || score > 100)) {
    throw new Error("Score must be between 1.0 and 10.0");
  }
  if (reviewText && reviewText.length > 2000) {
    throw new Error("Review must be 2000 characters or fewer");
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (score !== undefined) patch.score = score;
  if (listenMethod !== undefined) patch.listen_method = listenMethod;
  if (reviewText !== undefined) patch.review_text = reviewText;

  const { data, error } = await supabase
    .from("ratings")
    .update(patch)
    .eq("id", ratingId)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Could not update rating: ${error.message}`);
  }
  if (!data) {
    throw new Error("Rating not found");
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
