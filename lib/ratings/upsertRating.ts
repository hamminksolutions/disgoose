import type { SupabaseClient } from "@supabase/supabase-js";

export type ListenMethod = "spotify" | "cd" | "vinyl" | "streaming_other" | "other";

/** Owned is only meaningful for these — matches the prototype's isPhysical gating and the ratings_owned_requires_physical check constraint. */
export function isPhysicalListenMethod(listenMethod: ListenMethod): boolean {
  return listenMethod === "vinyl" || listenMethod === "cd";
}

export type UpsertRatingInput = {
  userId: string;
  albumId: string;
  score: number; // tenths, e.g. 85 = 8.5
  listenMethod: ListenMethod;
  reviewText?: string | null;
  owned?: boolean;
};

export type Rating = {
  id: string;
  userId: string;
  albumId: string;
  score: number;
  listenMethod: ListenMethod;
  reviewText: string | null;
  owned: boolean;
};

export async function upsertRating(
  { userId, albumId, score, listenMethod, reviewText = null, owned = false }: UpsertRatingInput,
  { supabase }: { supabase: SupabaseClient }
): Promise<Rating> {
  if (score < 10 || score > 100) {
    throw new Error("Score must be between 1.0 and 10.0");
  }
  if (reviewText && reviewText.length > 2000) {
    throw new Error("Review must be 2000 characters or fewer");
  }
  // Drop owned rather than let the DB constraint fail an otherwise-valid save.
  const effectiveOwned = owned && isPhysicalListenMethod(listenMethod);

  const { data, error } = await supabase
    .from("ratings")
    .upsert(
      {
        user_id: userId,
        album_id: albumId,
        score,
        listen_method: listenMethod,
        review_text: reviewText,
        owned: effectiveOwned,
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
    owned: data.owned,
  };
}
