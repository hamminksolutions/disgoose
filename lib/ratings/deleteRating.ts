import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteRating(
  ratingId: string,
  userId: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<void> {
  const { data, error } = await supabase
    .from("ratings")
    .delete()
    .eq("id", ratingId)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Could not delete rating: ${error.message}`);
  }
  if (!data) {
    throw new Error("Rating not found");
  }
}
