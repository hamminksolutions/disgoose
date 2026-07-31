import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createCoverArtMirror } from "./coverArtMirror";
import { createTestSupabaseClient } from "../supabase/testClient";

describe("createCoverArtMirror", () => {
  it("downloads the cover image and stores it in the covers bucket, returning its public URL", async () => {
    const supabase = createTestSupabaseClient();
    const mbReleaseGroupId = randomUUID();
    const imageBytes = new Uint8Array([1, 2, 3, 4]);
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob([imageBytes], { type: "image/png" }),
    });
    const mirror = createCoverArtMirror(fetchImpl);

    const url = await mirror.mirror(
      "https://coverartarchive.example/front.png",
      mbReleaseGroupId,
      { supabase }
    );

    expect(url).toContain(`/covers/${mbReleaseGroupId}`);
    // Re-download independently rather than trusting the returned URL alone.
    const { data, error } = await supabase.storage
      .from("covers")
      .download(mbReleaseGroupId);
    expect(error).toBeNull();
    const stored = new Uint8Array(await data!.arrayBuffer());
    expect(Array.from(stored)).toEqual(Array.from(imageBytes));
  });

  it("returns null without touching storage when the source fetch fails", async () => {
    const supabase = createTestSupabaseClient();
    const mbReleaseGroupId = randomUUID();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const mirror = createCoverArtMirror(fetchImpl);

    const url = await mirror.mirror(
      "https://coverartarchive.example/missing.png",
      mbReleaseGroupId,
      { supabase }
    );

    expect(url).toBeNull();
    const { data } = await supabase.storage.from("covers").download(mbReleaseGroupId);
    expect(data).toBeNull();
  });

  it("returns null (not a thrown error) when the source fetch throws", async () => {
    const supabase = createTestSupabaseClient();
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));
    const mirror = createCoverArtMirror(fetchImpl);

    const url = await mirror.mirror(
      "https://coverartarchive.example/front.png",
      randomUUID(),
      { supabase }
    );

    expect(url).toBeNull();
  });
});
