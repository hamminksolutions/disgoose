import { describe, it, expect, vi } from "vitest";
import { createCoverArtClient } from "./coverArtClient";

describe("createCoverArtClient", () => {
  it("returns the front image URL for a release-group with art", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        images: [
          { front: false, image: "https://coverartarchive.org/release-group/x/back.jpg" },
          { front: true, image: "https://coverartarchive.org/release-group/x/front.jpg" },
        ],
      }),
    });
    const client = createCoverArtClient(fetchImpl);

    const url = await client.getCoverUrl("b84ee12a-09a5-4fd9-a02a-8cf1dcf88898");

    expect(url).toBe("https://coverartarchive.org/release-group/x/front.jpg");
    expect(String(fetchImpl.mock.calls[0][0])).toBe(
      "https://coverartarchive.org/release-group/b84ee12a-09a5-4fd9-a02a-8cf1dcf88898"
    );
  });

  it("returns null when the release-group has no cover art (404)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const client = createCoverArtClient(fetchImpl);

    const url = await client.getCoverUrl("some-obscure-release-group");

    expect(url).toBeNull();
  });

  it("returns null (not a thrown error) when the request fails unexpectedly", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));
    const client = createCoverArtClient(fetchImpl);

    const url = await client.getCoverUrl("some-release-group");

    expect(url).toBeNull();
  });
});
