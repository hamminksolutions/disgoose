import { describe, it, expect, vi } from "vitest";
import { createMusicBrainzClient } from "./client";

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body };
}

describe("createMusicBrainzClient", () => {
  it("searches the release-group endpoint, never /release/", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ "release-groups": [] }));
    const client = createMusicBrainzClient(fetchImpl);

    await client.searchReleaseGroups("ok computer");

    const [url] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain("/ws/2/release-group/");
    expect(String(url)).not.toContain("/ws/2/release/");
    expect(String(url)).toContain("fmt=json");
    expect(String(url)).toContain("query=ok+computer");
  });

  it("sends an identifying User-Agent header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ "release-groups": [] }));
    const client = createMusicBrainzClient(fetchImpl);

    await client.searchReleaseGroups("ok computer");

    const [, options] = fetchImpl.mock.calls[0];
    const userAgent = options.headers["User-Agent"];
    expect(userAgent).toMatch(/^Disgoose\/[\d.]+ \(contact: .+\)$/);
  });

  it("maps release-groups to {id, title, artist}, joining multi-credit artists", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        "release-groups": [
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
      })
    );
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

  it("throws when the MusicBrainz request fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const client = createMusicBrainzClient(fetchImpl);

    await expect(client.searchReleaseGroups("anything")).rejects.toThrow();
  });

  it("ranks Album-type, non-secondary-typed results above compilations/live releases", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        "release-groups": [
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
      })
    );
    const client = createMusicBrainzClient(fetchImpl);

    const results = await client.searchReleaseGroups("ok computer");

    expect(results.map((r) => r.id)).toEqual(["studio-version", "live-version"]);
  });

  it("handles real MusicBrainz responses where secondary-types and joinphrase are simply absent", async () => {
    // MusicBrainz omits "secondary-types" entirely when it's empty, rather
    // than sending []. Two results are needed here because Array.sort()
    // never invokes its comparator for a single-element array, so a
    // one-result fixture would not have caught this.
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        "release-groups": [
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
      })
    );
    const client = createMusicBrainzClient(fetchImpl);

    const results = await client.searchReleaseGroups("ok computer");

    expect(results).toEqual([
      { id: "b1392450-e666-3926-a536-22c65f834433", title: "OK Computer", artist: "Radiohead" },
      { id: "8cf63c7f-3d59-4b97-900c-ccd78445a766", title: "OK Computer Part 2", artist: "ShitLips" },
    ]);
  });
});
