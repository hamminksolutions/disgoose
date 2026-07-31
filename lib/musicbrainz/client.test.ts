import { describe, it, expect, vi } from "vitest";
import { createMusicBrainzClient } from "./client";

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body };
}

function errorResponse(status: number) {
  return { ok: false, status };
}

type MockResult = ReturnType<typeof jsonResponse> | ReturnType<typeof errorResponse>;

// Every searchReleaseGroups() call can now fan out to up to three
// MusicBrainz requests (general text search, artist search, and — only on a
// confident artist match — a release-group browse by artist). This routes
// each fetch call to the right canned response by inspecting the URL, the
// same way the real MusicBrainz server would route them by path/params.
function mockMusicBrainz(options: {
  releaseGroups?: unknown[] | MockResult;
  artists?: unknown[] | MockResult;
  discography?: unknown[] | MockResult;
}) {
  const { releaseGroups = [], artists = [], discography = [] } = options;

  return vi.fn().mockImplementation((url) => {
    const parsed = new URL(String(url));

    if (parsed.pathname === "/ws/2/artist/") {
      return Promise.resolve(Array.isArray(artists) ? jsonResponse({ artists }) : artists);
    }
    if (parsed.searchParams.has("artist")) {
      return Promise.resolve(
        Array.isArray(discography) ? jsonResponse({ "release-groups": discography }) : discography
      );
    }
    return Promise.resolve(
      Array.isArray(releaseGroups) ? jsonResponse({ "release-groups": releaseGroups }) : releaseGroups
    );
  });
}

const radioheadArtist = {
  id: "a74b1b7f-71a5-4011-9441-d0b5e4122711",
  score: 100,
  name: "Radiohead",
  "sort-name": "Radiohead",
};

describe("createMusicBrainzClient", () => {
  it("searches the release-group endpoint, never /release/", async () => {
    const fetchImpl = mockMusicBrainz({});
    const client = createMusicBrainzClient(fetchImpl);

    await client.searchReleaseGroups("ok computer");

    const generalSearchUrl = fetchImpl.mock.calls
      .map(([url]) => String(url))
      .find((url) => !url.includes("/ws/2/artist/"));
    expect(generalSearchUrl).toContain("/ws/2/release-group/");
    expect(generalSearchUrl).not.toContain("/ws/2/release/");
    expect(generalSearchUrl).toContain("fmt=json");
    expect(generalSearchUrl).toContain("query=ok+computer");
  });

  it("sends an identifying User-Agent header on every request", async () => {
    const fetchImpl = mockMusicBrainz({ artists: [radioheadArtist], discography: [] });
    const client = createMusicBrainzClient(fetchImpl);

    await client.searchReleaseGroups("radiohead");

    expect(fetchImpl.mock.calls.length).toBeGreaterThan(0);
    for (const [, options] of fetchImpl.mock.calls) {
      const userAgent = (options as { headers: Record<string, string> }).headers["User-Agent"];
      expect(userAgent).toMatch(/^Disgoose\/[\d.]+ \(contact: .+\)$/);
    }
  });

  it("maps release-groups to {id, title, artist}, joining multi-credit artists", async () => {
    const fetchImpl = mockMusicBrainz({
      releaseGroups: [
        {
          id: "b84ee12a-09a5-4fd9-a02a-8cf1dcf88898",
          score: 100,
          title: "OK Computer",
          "primary-type": "Album",
          "secondary-types": [],
          "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
        },
        {
          id: "b6903b95-1c07-4b18-9be4-a0ba4b9a4b0a",
          score: 90,
          title: "Watch the Throne",
          "primary-type": "Album",
          "secondary-types": [],
          "artist-credit": [
            { name: "Jay-Z", joinphrase: " & " },
            { name: "Kanye West", joinphrase: "" },
          ],
        },
      ],
    });
    const client = createMusicBrainzClient(fetchImpl);

    const results = await client.searchReleaseGroups("anything");

    expect(results).toEqual([
      {
        id: "b84ee12a-09a5-4fd9-a02a-8cf1dcf88898",
        title: "OK Computer",
        artist: "Radiohead",
      },
      {
        id: "b6903b95-1c07-4b18-9be4-a0ba4b9a4b0a",
        title: "Watch the Throne",
        artist: "Jay-Z & Kanye West",
      },
    ]);
  });

  it("throws when the general MusicBrainz search fails", async () => {
    const fetchImpl = mockMusicBrainz({ releaseGroups: errorResponse(503) });
    const client = createMusicBrainzClient(fetchImpl);

    await expect(client.searchReleaseGroups("anything")).rejects.toThrow();
  });

  it("ranks Album-type, non-secondary-typed results above compilations/live releases", async () => {
    const fetchImpl = mockMusicBrainz({
      releaseGroups: [
        {
          id: "live-version",
          score: 100,
          title: "OK Computer (Live)",
          "primary-type": "Album",
          "secondary-types": ["Live"],
          "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
        },
        {
          id: "studio-version",
          score: 95,
          title: "OK Computer",
          "primary-type": "Album",
          "secondary-types": [],
          "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
        },
      ],
    });
    const client = createMusicBrainzClient(fetchImpl);

    const results = await client.searchReleaseGroups("ok computer");

    expect(results.map((r) => r.id)).toEqual(["studio-version", "live-version"]);
  });

  it("excludes Singles from results", async () => {
    const fetchImpl = mockMusicBrainz({
      releaseGroups: [
        {
          id: "the-single",
          score: 100,
          title: "Creep",
          "primary-type": "Single",
          "secondary-types": [],
          "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
        },
        {
          id: "the-album",
          score: 90,
          title: "Pablo Honey",
          "primary-type": "Album",
          "secondary-types": [],
          "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
        },
      ],
    });
    const client = createMusicBrainzClient(fetchImpl);

    const results = await client.searchReleaseGroups("creep");

    expect(results.map((r) => r.id)).toEqual(["the-album"]);
  });

  it("includes EPs alongside Albums", async () => {
    const fetchImpl = mockMusicBrainz({
      releaseGroups: [
        {
          id: "the-ep",
          score: 100,
          title: "Drive",
          "primary-type": "EP",
          "secondary-types": [],
          "artist-credit": [{ name: "R.E.M.", joinphrase: "" }],
        },
        {
          id: "the-album",
          score: 90,
          title: "Automatic for the People",
          "primary-type": "Album",
          "secondary-types": [],
          "artist-credit": [{ name: "R.E.M.", joinphrase: "" }],
        },
      ],
    });
    const client = createMusicBrainzClient(fetchImpl);

    const results = await client.searchReleaseGroups("r.e.m.");

    expect(results.map((r) => r.id).sort()).toEqual(["the-album", "the-ep"]);
  });

  it("excludes release-groups with a missing or unrecognized primary-type", async () => {
    const fetchImpl = mockMusicBrainz({
      releaseGroups: [
        {
          id: "no-type",
          score: 100,
          title: "Untyped Release",
          "primary-type": "",
          "artist-credit": [{ name: "Someone", joinphrase: "" }],
        },
        {
          id: "broadcast",
          score: 99,
          title: "A Radio Session",
          "primary-type": "Broadcast",
          "artist-credit": [{ name: "Someone", joinphrase: "" }],
        },
        {
          id: "the-album",
          score: 90,
          title: "A Real Album",
          "primary-type": "Album",
          "secondary-types": [],
          "artist-credit": [{ name: "Someone", joinphrase: "" }],
        },
      ],
    });
    const client = createMusicBrainzClient(fetchImpl);

    const results = await client.searchReleaseGroups("something");

    expect(results.map((r) => r.id)).toEqual(["the-album"]);
  });

  it("handles real MusicBrainz responses where secondary-types and joinphrase are simply absent", async () => {
    // MusicBrainz omits "secondary-types" entirely when it's empty, rather
    // than sending []. Two results are needed here because Array.sort()
    // never invokes its comparator for a single-element array, so a
    // one-result fixture would not have caught this.
    const fetchImpl = mockMusicBrainz({
      releaseGroups: [
        {
          id: "b1392450-e666-3926-a536-22c65f834433",
          score: 100,
          title: "OK Computer",
          "primary-type": "Album",
          "artist-credit": [{ name: "Radiohead" }],
        },
        {
          id: "8cf63c7f-3d59-4b97-900c-ccd78445a766",
          score: 90,
          title: "OK Computer Part 2",
          "primary-type": "Album",
          "artist-credit": [{ name: "ShitLips" }],
        },
      ],
    });
    const client = createMusicBrainzClient(fetchImpl);

    const results = await client.searchReleaseGroups("ok computer");

    expect(results).toEqual([
      { id: "b1392450-e666-3926-a536-22c65f834433", title: "OK Computer", artist: "Radiohead" },
      { id: "8cf63c7f-3d59-4b97-900c-ccd78445a766", title: "OK Computer Part 2", artist: "ShitLips" },
    ]);
  });

  describe("artist-first ranking", () => {
    it("puts a confidently-matched artist's discography ahead of unrelated text matches", async () => {
      const fetchImpl = mockMusicBrainz({
        releaseGroups: [
          {
            id: "tribute-compilation",
            score: 100,
            title: "A Tribute to Radiohead",
            "primary-type": "Album",
            "secondary-types": ["Compilation"],
            "artist-credit": [{ name: "Various Artists", joinphrase: "" }],
          },
        ],
        artists: [radioheadArtist],
        discography: [
          {
            id: "ok-computer",
            title: "OK Computer",
            "primary-type": "Album",
            "secondary-types": [],
            "first-release-date": "1997-05-21",
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
        ],
      });
      const client = createMusicBrainzClient(fetchImpl);

      const results = await client.searchReleaseGroups("radiohead");

      expect(results.map((r) => r.id)).toEqual(["ok-computer", "tribute-compilation"]);
    });

    it("orders the matched artist's discography chronologically, undated releases last", async () => {
      const fetchImpl = mockMusicBrainz({
        artists: [radioheadArtist],
        discography: [
          {
            id: "kid-a",
            title: "Kid A",
            "primary-type": "Album",
            "secondary-types": [],
            "first-release-date": "2000-10-02",
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
          {
            id: "undated-reissue",
            title: "Undated Reissue",
            "primary-type": "Album",
            "secondary-types": [],
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
          {
            id: "pablo-honey",
            title: "Pablo Honey",
            "primary-type": "Album",
            "secondary-types": [],
            "first-release-date": "1993-02-22",
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
          {
            id: "ok-computer",
            title: "OK Computer",
            "primary-type": "Album",
            "secondary-types": [],
            "first-release-date": "1997-05-21",
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
        ],
      });
      const client = createMusicBrainzClient(fetchImpl);

      const results = await client.searchReleaseGroups("radiohead");

      expect(results.map((r) => r.id)).toEqual(["pablo-honey", "ok-computer", "kid-a", "undated-reissue"]);
    });

    it("does not trigger artist-first for a query that isn't an exact artist name", async () => {
      const fetchImpl = mockMusicBrainz({
        releaseGroups: [
          {
            id: "some-live-album",
            score: 80,
            title: "Radiohead Live in Prague",
            "primary-type": "Album",
            "secondary-types": ["Live"],
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
        ],
        artists: [radioheadArtist], // "Radiohead" exists but query below isn't an exact match
      });
      const client = createMusicBrainzClient(fetchImpl);

      const results = await client.searchReleaseGroups("radiohead live");

      expect(results.map((r) => r.id)).toEqual(["some-live-album"]);
      // No browse-by-artist call should have been made.
      const browseCalls = fetchImpl.mock.calls.filter(([url]) => new URL(String(url)).searchParams.has("artist"));
      expect(browseCalls).toHaveLength(0);
    });

    it("matches the artist name case- and whitespace-insensitively", async () => {
      const fetchImpl = mockMusicBrainz({
        artists: [radioheadArtist],
        discography: [
          {
            id: "ok-computer",
            title: "OK Computer",
            "primary-type": "Album",
            "secondary-types": [],
            "first-release-date": "1997-05-21",
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
        ],
      });
      const client = createMusicBrainzClient(fetchImpl);

      const results = await client.searchReleaseGroups("  RADIOHEAD  ");

      expect(results.map((r) => r.id)).toEqual(["ok-computer"]);
    });

    it("breaks ties between same-named artists by preferring no disambiguation", async () => {
      const wellKnown = { id: "well-known-id", score: 100, name: "Muse", "sort-name": "Muse" };
      const obscure = {
        id: "obscure-id",
        score: 100,
        name: "Muse",
        "sort-name": "Muse",
        disambiguation: "Chinese pop group",
      };
      const fetchImpl = mockMusicBrainz({
        artists: [obscure, wellKnown], // obscure listed first in the raw MB response
        discography: [
          {
            id: "well-known-album",
            title: "Absolution",
            "primary-type": "Album",
            "secondary-types": [],
            "first-release-date": "2003-09-15",
            "artist-credit": [{ name: "Muse", joinphrase: "" }],
          },
        ],
      });
      const client = createMusicBrainzClient(fetchImpl);

      await client.searchReleaseGroups("muse");

      const browseCall = fetchImpl.mock.calls.find(([url]) => new URL(String(url)).searchParams.has("artist"));
      expect(browseCall).toBeDefined();
      const [browseUrl] = browseCall!;
      expect(new URL(String(browseUrl)).searchParams.get("artist")).toBe("well-known-id");
    });

    it("does not duplicate a release-group present in both the discography and the general search", async () => {
      const fetchImpl = mockMusicBrainz({
        releaseGroups: [
          {
            id: "ok-computer",
            score: 100,
            title: "OK Computer",
            "primary-type": "Album",
            "secondary-types": [],
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
        ],
        artists: [radioheadArtist],
        discography: [
          {
            id: "ok-computer",
            title: "OK Computer",
            "primary-type": "Album",
            "secondary-types": [],
            "first-release-date": "1997-05-21",
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
        ],
      });
      const client = createMusicBrainzClient(fetchImpl);

      const results = await client.searchReleaseGroups("radiohead");

      expect(results.map((r) => r.id)).toEqual(["ok-computer"]);
    });

    it("falls back to general search results when the artist search request fails", async () => {
      const fetchImpl = mockMusicBrainz({
        releaseGroups: [
          {
            id: "the-album",
            score: 90,
            title: "OK Computer",
            "primary-type": "Album",
            "secondary-types": [],
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
        ],
        artists: errorResponse(503),
      });
      const client = createMusicBrainzClient(fetchImpl);

      const results = await client.searchReleaseGroups("radiohead");

      expect(results.map((r) => r.id)).toEqual(["the-album"]);
    });

    it("falls back to general search results when the discography browse request fails", async () => {
      const fetchImpl = mockMusicBrainz({
        releaseGroups: [
          {
            id: "the-album",
            score: 90,
            title: "OK Computer",
            "primary-type": "Album",
            "secondary-types": [],
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
        ],
        artists: [radioheadArtist],
        discography: errorResponse(503),
      });
      const client = createMusicBrainzClient(fetchImpl);

      const results = await client.searchReleaseGroups("radiohead");

      expect(results.map((r) => r.id)).toEqual(["the-album"]);
    });

    it("falls back to general search results when the matched artist has no ratable discography", async () => {
      const fetchImpl = mockMusicBrainz({
        releaseGroups: [
          {
            id: "the-album",
            score: 90,
            title: "OK Computer",
            "primary-type": "Album",
            "secondary-types": [],
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
        ],
        artists: [radioheadArtist],
        discography: [
          {
            id: "single-only",
            title: "Creep",
            "primary-type": "Single",
            "secondary-types": [],
            "first-release-date": "1992-09-21",
            "artist-credit": [{ name: "Radiohead", joinphrase: "" }],
          },
        ],
      });
      const client = createMusicBrainzClient(fetchImpl);

      const results = await client.searchReleaseGroups("radiohead");

      expect(results.map((r) => r.id)).toEqual(["the-album"]);
    });
  });
});
