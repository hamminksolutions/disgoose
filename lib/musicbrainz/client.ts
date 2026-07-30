const USER_AGENT = "Disgoose/0.1 (contact: nielshammink24@gmail.com)";

type RawReleaseGroup = {
  id: string;
  score: number;
  title: string;
  "primary-type": string;
  "secondary-types"?: string[];
  "artist-credit": { name: string; joinphrase?: string }[];
};

export type ReleaseGroupResult = {
  id: string;
  title: string;
  artist: string;
};

function joinArtistCredits(credits: RawReleaseGroup["artist-credit"]): string {
  return credits.map((credit) => credit.name + (credit.joinphrase ?? "")).join("");
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

export function createMusicBrainzClient(fetchImpl: typeof fetch) {
  return {
    async searchReleaseGroups(query: string): Promise<ReleaseGroupResult[]> {
      const params = new URLSearchParams({ query, fmt: "json" });
      const url = `https://musicbrainz.org/ws/2/release-group/?${params.toString()}`;

      const response = await fetchImpl(url, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!response.ok) {
        throw new Error(`MusicBrainz search failed with status ${response.status}`);
      }

      const body = (await response.json()) as { "release-groups": RawReleaseGroup[] };

      return [...body["release-groups"]]
        .sort((a, b) => {
          const rankDiff = editionRank(a) - editionRank(b);
          return rankDiff !== 0 ? rankDiff : b.score - a.score;
        })
        .map((releaseGroup) => ({
          id: releaseGroup.id,
          title: releaseGroup.title,
          artist: joinArtistCredits(releaseGroup["artist-credit"]),
        }));
    },
  };
}
