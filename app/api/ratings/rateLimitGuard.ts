import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rateLimiting/checkRateLimit";
import { RATINGS_RATE_LIMIT, ratingsRateLimitKey } from "@/lib/rateLimiting/ratingsRateLimit";

/** Shared between POST /api/ratings and PUT /api/ratings/:id. Returns a
 * response to send immediately (429 over limit, 500 on a check failure),
 * or null to let the caller proceed. */
export async function ratingsRateLimitResponse(
  userId: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<NextResponse | null> {
  try {
    const { limited } = await checkRateLimit(
      { key: ratingsRateLimitKey(userId), ...RATINGS_RATE_LIMIT },
      { supabase }
    );
    return limited ? NextResponse.json({ error: "rate_limited" }, { status: 429 }) : null;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not check rate limit" },
      { status: 500 }
    );
  }
}
