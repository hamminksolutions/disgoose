import type { SupabaseClient } from "@supabase/supabase-js";
import { isPhysicalListenMethod, type ListenMethod, type Rating } from "./upsertRating";

export type UpdateRatingInput = {
  score?: number;
  listenMethod?: ListenMethod;
  reviewText?: string | null;
  owned?: boolean;
};

export async function updateRating(
  ratingId: string,
  userId: string,
  { score, listenMethod, reviewText, owned }: UpdateRatingInput,
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
  if (owned !== undefined) {
    // Only pre-drop owned when this same call also changes listenMethod —
    // otherwise we can't know the row's current method, so let the DB check
    // constraint (ratings_owned_requires_physical) be the source of truth.
    patch.owned = listenMethod !== undefined ? owned && isPhysicalListenMethod(listenMethod) : owned;
  }

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
    owned: data.owned,
  };
}
