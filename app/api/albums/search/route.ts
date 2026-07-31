import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createMusicBrainzClient } from "@/lib/musicbrainz/client";
import { createCoverArtClient } from "@/lib/musicbrainz/coverArtClient";
import { createCoverArtMirror } from "@/lib/musicbrainz/coverArtMirror";
import { searchAlbums } from "@/lib/musicbrainz/searchAlbums";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json(
      { error: "missing_query", message: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const musicbrainz = createMusicBrainzClient(fetch);
  const coverArt = createCoverArtClient(fetch);
  const coverMirror = createCoverArtMirror(fetch);
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const albums = await searchAlbums(query, { musicbrainz, coverArt, coverMirror, supabase });
    return NextResponse.json({ albums });
  } catch {
    return NextResponse.json(
      { error: "search_failed", message: "Could not search MusicBrainz right now" },
      { status: 502 }
    );
  }
}
