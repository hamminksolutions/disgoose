import type { SupabaseClient } from "@supabase/supabase-js";

export type CheckRateLimitInput = {
  key: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  limited: boolean;
  count: number;
};

export async function checkRateLimit(
  { key, limit, windowSeconds }: CheckRateLimitInput,
  { supabase }: { supabase: SupabaseClient }
): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc("increment_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    throw new Error(`Could not check rate limit: ${error.message}`);
  }

  const count = data as number;
  return { limited: count > limit, count };
}
