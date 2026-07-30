import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function searchAlbums(
  query: string,
  {
    musicbrainz,
    coverArt,
    supabase,
  }: {
    musicbrainz: MusicBrainzClient;
    coverArt?: CoverArtClient;
    supabase?: SupabaseClient;
  }
): Promise<Album[]> {
  const results = await musicbrainz.searchReleaseGroups(query);

  const albums: Album[] = [];
  for (const result of results) {
    let coverUrl: string | null = null;

    if (supabase) {
      const cached = await getCachedAlbum(result.id, { supabase });
      if (cached) {
        coverUrl = cached.coverUrl;
      } else {
        coverUrl = coverArt ? await coverArt.getCoverUrl(result.id) : null;
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

    albums.push({
      mbReleaseGroupId: result.id,
      title: result.title,
      artist: result.artist,
      coverUrl,
    });
  }

  return albums;
}
