const USER_AGENT = "Disgoose/0.1 (contact: nielshammink24@gmail.com)";

type RawReleaseGroup = {
  id: string;
  score?: number; // absent on browse responses (only search computes relevance)
  title: string;
  "primary-type": string;
  "secondary-types"?: string[];
  "first-release-date"?: string;
  "artist-credit": { name: string; joinphrase?: string }[];
};

type RawArtist = {
  id: string;
  score: number;
  name: string;
  "sort-name": string;
  disambiguation?: string;
};

export type ReleaseGroupResult = {
  id: string;
  title: string;
  artist: string;
};

function joinArtistCredits(credits: RawReleaseGroup["artist-credit"]): string {
  return credits.map((credit) => credit.name + (credit.joinphrase ?? "")).join("");
}

function toReleaseGroupResult(releaseGroup: RawReleaseGroup): ReleaseGroupResult {
  return {
    id: releaseGroup.id,
    title: releaseGroup.title,
    artist: joinArtistCredits(releaseGroup["artist-credit"]),
  };
}

const RATABLE_PRIMARY_TYPES = new Set(["Album", "EP"]);

// Fail closed: a release-group with a missing/unrecognized primary-type
// (bad MusicBrainz data) is excluded rather than risking a Single slipping
// through under a blank or unexpected type.
function isRatable(releaseGroup: RawReleaseGroup): boolean {
  return RATABLE_PRIMARY_TYPES.has(releaseGroup["primary-type"]);
}

function editionRank(releaseGroup: RawReleaseGroup): number {
  // Lower ranks first: a plain Album with no secondary types (Compilation,
  // Live, Remix, Soundtrack, ...) is the closest thing to "the" edition we
  // can detect without full release-group merging (see ADR-0001).
  const secondaryTypes = releaseGroup["secondary-types"] ?? [];
  if (releaseGroup["primary-type"] === "Album" && secondaryTypes.length === 0) {
    return 0;
  }
  return 1;
}

// Free-text search conflates artist-name matches and title-text matches in a
// single relevance score, so a plain search alone can't be trusted to rank
// "the artist's albums" above "an unrelated release whose title contains the
// query". editionRank + score is still a reasonable ranking for this
// unfiltered pool, but see searchReleaseGroups for the artist-first pass
// that actually addresses the ranking problem.
function rankSearchResults(raw: RawReleaseGroup[]): ReleaseGroupResult[] {
  return raw
    .filter(isRatable)
    .sort((a, b) => {
      const rankDiff = editionRank(a) - editionRank(b);
      return rankDiff !== 0 ? rankDiff : (b.score ?? 0) - (a.score ?? 0);
    })
    .map(toReleaseGroupResult);
}

// Undated release-groups sort last rather than being dropped or defaulting
// to "oldest" — MusicBrainz data is community-edited and a missing date is
// far more common than a genuinely ancient release.
function releaseDateSortKey(releaseGroup: RawReleaseGroup): string {
  return releaseGroup["first-release-date"] || "9999-99-99";
}

function rankDiscography(raw: RawReleaseGroup[]): ReleaseGroupResult[] {
  return raw
    .filter(isRatable)
    .sort((a, b) => {
      const dateDiff = releaseDateSortKey(a).localeCompare(releaseDateSortKey(b));
      return dateDiff !== 0 ? dateDiff : editionRank(a) - editionRank(b);
    })
    .map(toReleaseGroupResult);
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

// MusicBrainz has no popularity signal, so same-named artists (e.g. several
// bands called "Muse") can't be told apart by fame. The one real signal
// available: editors add a `disambiguation` comment to the less-prominent
// entity to distinguish it from the default one, so among exact-name
// matches we prefer whichever lacks that comment. Ties beyond that keep
// MusicBrainz's own result order (Array.sort is stable).
function findExactArtistMatch(artists: RawArtist[], query: string): RawArtist | null {
  const normalizedQuery = normalize(query);
  const candidates = artists.filter(
    (artist) => normalize(artist.name) === normalizedQuery || normalize(artist["sort-name"]) === normalizedQuery
  );
  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    const aHasDisambiguation = Boolean(a.disambiguation);
    const bHasDisambiguation = Boolean(b.disambiguation);
    if (aHasDisambiguation !== bHasDisambiguation) {
      return aHasDisambiguation ? 1 : -1;
    }
    return 0;
  })[0];
}

export function createMusicBrainzClient(fetchImpl: typeof fetch) {
  async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetchImpl(url, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async function searchGeneral(query: string): Promise<RawReleaseGroup[]> {
    const params = new URLSearchParams({ query, fmt: "json" });
    const body = await fetchJson<{ "release-groups": RawReleaseGroup[] }>(
      `https://musicbrainz.org/ws/2/release-group/?${params.toString()}`
    );
    return body["release-groups"];
  }

  async function searchArtists(query: string): Promise<RawArtist[]> {
    const params = new URLSearchParams({ query, fmt: "json" });
    const body = await fetchJson<{ artists: RawArtist[] }>(
      `https://musicbrainz.org/ws/2/artist/?${params.toString()}`
    );
    return body.artists;
  }

  async function browseArtistReleaseGroups(artistId: string): Promise<RawReleaseGroup[]> {
    const params = new URLSearchParams({ artist: artistId, fmt: "json", limit: "100" });
    const body = await fetchJson<{ "release-groups": RawReleaseGroup[] }>(
      `https://musicbrainz.org/ws/2/release-group/?${params.toString()}`
    );
    return body["release-groups"];
  }

  return {
    async searchReleaseGroups(query: string): Promise<ReleaseGroupResult[]> {
      // Artist lookup is a best-effort enhancement: if it fails, the search
      // as a whole should still succeed with today's plain text-search
      // results rather than taking down a working general search.
      const [generalRaw, artists] = await Promise.all([
        searchGeneral(query),
        searchArtists(query).catch(() => [] as RawArtist[]),
      ]);

      const generalResults = rankSearchResults(generalRaw);

      const matchedArtist = findExactArtistMatch(artists, query);
      if (!matchedArtist) {
        return generalResults;
      }

      const discography = await browseArtistReleaseGroups(matchedArtist.id)
        .then(rankDiscography)
        .catch(() => [] as ReleaseGroupResult[]);

      if (discography.length === 0) {
        return generalResults;
      }

      const seen = new Set(discography.map((result) => result.id));
      const tail = generalResults.filter((result) => !seen.has(result.id));
      return [...discography, ...tail];
    },
  };
}
