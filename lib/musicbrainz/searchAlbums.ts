import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoverArtMirror } from "./coverArtMirror";

export type Album = {
  mbReleaseGroupId: string;
  title: string;
  artist: string;
  coverUrl: string | null;
};

type MusicBrainzClient = {
  searchReleaseGroups: (
    query: string
  ) => Promise<{ id: string; title: string; artist: string }[]>;
};

type CoverArtClient = {
  getCoverUrl: (mbReleaseGroupId: string) => Promise<string | null>;
};

type AlbumsRow = {
  mb_release_group_id: string;
  title: string;
  artist: string;
  cover_url: string | null;
};

function rowToAlbum(row: AlbumsRow): Album {
  return {
    mbReleaseGroupId: row.mb_release_group_id,
    title: row.title,
    artist: row.artist,
    coverUrl: row.cover_url,
  };
}

export async function getCachedAlbum(
  mbReleaseGroupId: string,
  { supabase }: { supabase: SupabaseClient }
): Promise<Album | null> {
  const { data } = await supabase
    .from("albums")
    .select("mb_release_group_id, title, artist, cover_url")
    .eq("mb_release_group_id", mbReleaseGroupId)
    .maybeSingle();

  return data ? rowToAlbum(data as AlbumsRow) : null;
}

// Finds cover art for a release-group not yet in our cache and, if a mirror
// is configured, replaces the Cover Art Archive URL with our own mirrored
// copy so cover_url never points at a third party once mirroring is wired up.
async function fetchCoverUrl(
  mbReleaseGroupId: string,
  {
    coverArt,
    coverMirror,
    supabase,
  }: { coverArt?: CoverArtClient; coverMirror?: CoverArtMirror; supabase: SupabaseClient }
): Promise<string | null> {
  const coverArtUrl = coverArt ? await coverArt.getCoverUrl(mbReleaseGroupId) : null;
  if (!coverArtUrl || !coverMirror) return coverArtUrl;
  return coverMirror.mirror(coverArtUrl, mbReleaseGroupId, { supabase });
}

async function resolveAlbum(
  result: { id: string; title: string; artist: string },
  {
    coverArt,
    coverMirror,
    supabase,
  }: { coverArt?: CoverArtClient; coverMirror?: CoverArtMirror; supabase?: SupabaseClient }
): Promise<Album> {
  let coverUrl: string | null = null;

  if (supabase) {
    const cached = await getCachedAlbum(result.id, { supabase });
    if (cached) {
      coverUrl = cached.coverUrl;
    } else {
      coverUrl = await fetchCoverUrl(result.id, { coverArt, coverMirror, supabase });
      // ignoreDuplicates -> INSERT ... ON CONFLICT DO NOTHING, so a
      // concurrent insert of the same new release-group never throws.
      await supabase.from("albums").upsert(
        {
          mb_release_group_id: result.id,
          title: result.title,
          artist: result.artist,
          cover_url: coverUrl,
        },
        { onConflict: "mb_release_group_id", ignoreDuplicates: true }
      );
      // Re-read so a request that lost the race reports the row that
      // actually won, not the cover it independently fetched.
      const settled = await getCachedAlbum(result.id, { supabase });
      coverUrl = settled?.coverUrl ?? coverUrl;
    }
  }

  return {
    mbReleaseGroupId: result.id,
    title: result.title,
    artist: result.artist,
    coverUrl,
  };
}

export async function searchAlbums(
  query: string,
  {
    musicbrainz,
    coverArt,
    coverMirror,
    supabase,
  }: {
    musicbrainz: MusicBrainzClient;
    coverArt?: CoverArtClient;
    coverMirror?: CoverArtMirror;
    supabase?: SupabaseClient;
  }
): Promise<Album[]> {
  const results = await musicbrainz.searchReleaseGroups(query);

  // Resolved in parallel: each result may need its own Cover Art Archive
  // round-trip, and doing those one at a time made a 25-result search take
  // 10-20+ seconds.
  return Promise.all(
    results.map((result) => resolveAlbum(result, { coverArt, coverMirror, supabase }))
  );
}
