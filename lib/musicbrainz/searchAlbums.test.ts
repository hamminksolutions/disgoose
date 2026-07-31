import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { searchAlbums, getCachedAlbum } from "./searchAlbums";
import { createTestSupabaseClient } from "../supabase/testClient";

describe("searchAlbums", () => {
  it("maps a MusicBrainz release-group result to an Album", async () => {
    const musicbrainz = {
      searchReleaseGroups: vi.fn().mockResolvedValue([
        {
          id: "b84ee12a-09a5-4fd9-a02a-8cf1dcf88898",
          title: "OK Computer",
          artist: "Radiohead",
        },
      ]),
    };

    const albums = await searchAlbums("ok computer", { musicbrainz });

    expect(albums).toEqual([
      {
        mbReleaseGroupId: "b84ee12a-09a5-4fd9-a02a-8cf1dcf88898",
        title: "OK Computer",
        artist: "Radiohead",
        coverUrl: null,
      },
    ]);
  });

  it("fetches and persists cover art for a newly seen release-group", async () => {
    const supabase = createTestSupabaseClient();
    const releaseGroupId = randomUUID();
    const musicbrainz = {
      searchReleaseGroups: vi.fn().mockResolvedValue([
        { id: releaseGroupId, title: "In Rainbows", artist: "Radiohead" },
      ]),
    };
    const coverArt = {
      getCoverUrl: vi.fn().mockResolvedValue("https://coverartarchive.example/in-rainbows.jpg"),
    };
    const coverMirror = {
      mirror: vi.fn().mockResolvedValue("https://storage.example/covers/in-rainbows.jpg"),
    };

    const albums = await searchAlbums("in rainbows", {
      musicbrainz,
      coverArt,
      coverMirror,
      supabase,
    });

    expect(coverMirror.mirror).toHaveBeenCalledWith(
      "https://coverartarchive.example/in-rainbows.jpg",
      releaseGroupId,
      { supabase }
    );
    expect(albums[0].coverUrl).toBe("https://storage.example/covers/in-rainbows.jpg");
    const cached = await getCachedAlbum(releaseGroupId, { supabase });
    expect(cached?.coverUrl).toBe("https://storage.example/covers/in-rainbows.jpg");
  });

  it("does not re-fetch cover art for an already-cached release-group", async () => {
    const supabase = createTestSupabaseClient();
    const releaseGroupId = randomUUID();
    const firstCoverArt = {
      getCoverUrl: vi.fn().mockResolvedValue("https://coverartarchive.example/kid-a.jpg"),
    };
    const coverMirror = {
      mirror: vi.fn().mockResolvedValue("https://storage.example/covers/kid-a.jpg"),
    };
    await searchAlbums("kid a", {
      musicbrainz: {
        searchReleaseGroups: vi
          .fn()
          .mockResolvedValue([{ id: releaseGroupId, title: "Kid A", artist: "Radiohead" }]),
      },
      coverArt: firstCoverArt,
      coverMirror,
      supabase,
    });

    const secondCoverArt = { getCoverUrl: vi.fn() };
    const albums = await searchAlbums("kid a", {
      musicbrainz: {
        searchReleaseGroups: vi
          .fn()
          .mockResolvedValue([{ id: releaseGroupId, title: "Kid A", artist: "Radiohead" }]),
      },
      coverArt: secondCoverArt,
      supabase,
    });

    expect(secondCoverArt.getCoverUrl).not.toHaveBeenCalled();
    expect(albums[0].coverUrl).toBe("https://storage.example/covers/kid-a.jpg");
  });

  it("stores a missing cover as null rather than a placeholder", async () => {
    const supabase = createTestSupabaseClient();
    const releaseGroupId = randomUUID();

    const albums = await searchAlbums("obscure ep", {
      musicbrainz: {
        searchReleaseGroups: vi
          .fn()
          .mockResolvedValue([{ id: releaseGroupId, title: "Obscure EP", artist: "Nobody" }]),
      },
      coverArt: { getCoverUrl: vi.fn().mockResolvedValue(null) },
      supabase,
    });

    expect(albums[0].coverUrl).toBeNull();
    const cached = await getCachedAlbum(releaseGroupId, { supabase });
    expect(cached?.coverUrl).toBeNull();
  });

  it("caches no cover, rather than the third-party URL, when mirroring fails", async () => {
    const supabase = createTestSupabaseClient();
    const releaseGroupId = randomUUID();

    const albums = await searchAlbums("mirroring failure case", {
      musicbrainz: {
        searchReleaseGroups: vi.fn().mockResolvedValue([
          { id: releaseGroupId, title: "Flaky Mirror", artist: "Nobody" },
        ]),
      },
      coverArt: {
        getCoverUrl: vi.fn().mockResolvedValue("https://coverartarchive.example/flaky.jpg"),
      },
      coverMirror: { mirror: vi.fn().mockResolvedValue(null) },
      supabase,
    });

    expect(albums[0].coverUrl).toBeNull();
    const cached = await getCachedAlbum(releaseGroupId, { supabase });
    expect(cached?.coverUrl).toBeNull();
  });

  it("returns an empty array for a genuine no-results search", async () => {
    const albums = await searchAlbums("zzzznonexistentquery", {
      musicbrainz: { searchReleaseGroups: vi.fn().mockResolvedValue([]) },
    });

    expect(albums).toEqual([]);
  });

  it("propagates an error when the MusicBrainz call fails", async () => {
    await expect(
      searchAlbums("anything", {
        musicbrainz: {
          searchReleaseGroups: vi.fn().mockRejectedValue(new Error("MusicBrainz unreachable")),
        },
      })
    ).rejects.toThrow("MusicBrainz unreachable");
  });

  it("does not error when two concurrent searches cache the same new release-group", async () => {
    const supabase = createTestSupabaseClient();
    const releaseGroupId = randomUUID();
    const buildDeps = () => ({
      musicbrainz: {
        searchReleaseGroups: vi
          .fn()
          .mockResolvedValue([{ id: releaseGroupId, title: "Amnesiac", artist: "Radiohead" }]),
      },
      coverArt: { getCoverUrl: vi.fn().mockResolvedValue(null) },
      supabase,
    });

    const [first, second] = await Promise.all([
      searchAlbums("amnesiac", buildDeps()),
      searchAlbums("amnesiac", buildDeps()),
    ]);

    expect(first[0].mbReleaseGroupId).toBe(releaseGroupId);
    expect(second[0].mbReleaseGroupId).toBe(releaseGroupId);
  });

  it("resolves every result's cover independently and keeps them in order", async () => {
    const supabase = createTestSupabaseClient();
    const idA = randomUUID();
    const idB = randomUUID();
    const idC = randomUUID();
    const coverArt = {
      getCoverUrl: vi.fn(async (id: string) => `https://coverartarchive.example/${id}.jpg`),
    };
    const coverMirror = {
      mirror: vi.fn(async (_url: string, id: string) => `https://storage.example/covers/${id}.jpg`),
    };

    const albums = await searchAlbums("radiohead", {
      musicbrainz: {
        searchReleaseGroups: vi.fn().mockResolvedValue([
          { id: idA, title: "Album A", artist: "Radiohead" },
          { id: idB, title: "Album B", artist: "Radiohead" },
          { id: idC, title: "Album C", artist: "Radiohead" },
        ]),
      },
      coverArt,
      coverMirror,
      supabase,
    });

    expect(albums.map((a) => a.mbReleaseGroupId)).toEqual([idA, idB, idC]);
    expect(albums.map((a) => a.coverUrl)).toEqual([
      `https://storage.example/covers/${idA}.jpg`,
      `https://storage.example/covers/${idB}.jpg`,
      `https://storage.example/covers/${idC}.jpg`,
    ]);
  });
});
