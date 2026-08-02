import { NextRequest, NextResponse } from "next/server";
import { upsertRating, type ListenMethod } from "@/lib/ratings/upsertRating";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ratingsRateLimitResponse } from "./rateLimitGuard";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const rateLimitResponse = await ratingsRateLimitResponse(user.id, { supabase: admin });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await request.json();
  const { mbReleaseGroupId, score, listenMethod, reviewText, owned } = body as {
    mbReleaseGroupId: string;
    score: number;
    listenMethod: ListenMethod;
    reviewText?: string | null;
    owned?: boolean;
  };

  // Search (ticket #3) already caches every result into `albums`, so the
  // row exists by the time a user picks it from search results — this
  // just resolves the client-facing mb_release_group_id to the internal id.
  const { data: album, error: albumError } = await admin
    .from("albums")
    .select("id")
    .eq("mb_release_group_id", mbReleaseGroupId)
    .single();
  if (albumError || !album) {
    return NextResponse.json({ error: "album_not_found" }, { status: 404 });
  }

  try {
    const rating = await upsertRating(
      { userId: user.id, albumId: album.id, score, listenMethod, reviewText, owned },
      { supabase: admin }
    );
    return NextResponse.json({ rating });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save rating" },
      { status: 400 }
    );
  }
}
