import type { SupabaseClient } from "@supabase/supabase-js";

export type RatingStats = {
  count: number;
  avgScore: number | null;
};

/** Stats across ALL of a user's ratings — not capped to the 40 shown in the Grid. */
export async function getRatingStats(
  userId: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<RatingStats> {
  const { data, error } = await supabase.from("ratings").select("score").eq("user_id", userId);

  if (error) {
    throw new Error(`Could not load rating stats: ${error.message}`);
  }

  const scores = (data as { score: number }[]).map((row) => row.score);
  if (scores.length === 0) {
    return { count: 0, avgScore: null };
  }

  return {
    count: scores.length,
    avgScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
  };
}
