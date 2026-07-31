import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { backfillCoverArt } from "./backfillCoverArt";
import { createTestSupabaseClient } from "../supabase/testClient";

async function insertAlbum(
  supabase: ReturnType<typeof createTestSupabaseClient>,
  coverUrl: string | null
) {
  const mbReleaseGroupId = randomUUID();
  await supabase.from("albums").insert({
    mb_release_group_id: mbReleaseGroupId,
    title: "Test Album",
    artist: "Test Artist",
    cover_url: coverUrl,
  });
  return mbReleaseGroupId;
}

describe("backfillCoverArt", () => {
  it("mirrors an album still pointing directly at Cover Art Archive", async () => {
    const supabase = createTestSupabaseClient();
    const mbReleaseGroupId = await insertAlbum(
      supabase,
      "https://coverartarchive.org/release-group/x/front.jpg"
    );
    const coverMirror = {
      mirror: vi.fn().mockResolvedValue("https://storage.example/covers/x.jpg"),
    };

    const summary = await backfillCoverArt({ supabase, coverMirror });

    expect(summary).toEqual({ migrated: 1, skipped: 0 });
    expect(coverMirror.mirror).toHaveBeenCalledWith(
      "https://coverartarchive.org/release-group/x/front.jpg",
      mbReleaseGroupId,
      { supabase }
    );
    const { data } = await supabase
      .from("albums")
      .select("cover_url")
      .eq("mb_release_group_id", mbReleaseGroupId)
      .single();
    expect(data?.cover_url).toBe("https://storage.example/covers/x.jpg");
  });

  it("leaves an already-mirrored album alone", async () => {
    const supabase = createTestSupabaseClient();
    const mbReleaseGroupId = await insertAlbum(
      supabase,
      "https://storage.example/covers/already-mirrored.jpg"
    );
    const coverMirror = { mirror: vi.fn() };

    await backfillCoverArt({ supabase, coverMirror });

    expect(coverMirror.mirror).not.toHaveBeenCalled();
    const { data } = await supabase
      .from("albums")
      .select("cover_url")
      .eq("mb_release_group_id", mbReleaseGroupId)
      .single();
    expect(data?.cover_url).toBe("https://storage.example/covers/already-mirrored.jpg");
  });

  it("skips an album with no cover art available, without error", async () => {
    const supabase = createTestSupabaseClient();
    const mbReleaseGroupId = await insertAlbum(supabase, null);
    const coverMirror = { mirror: vi.fn() };

    await expect(backfillCoverArt({ supabase, coverMirror })).resolves.toBeTruthy();

    expect(coverMirror.mirror).not.toHaveBeenCalled();
    const { data } = await supabase
      .from("albums")
      .select("cover_url")
      .eq("mb_release_group_id", mbReleaseGroupId)
      .single();
    expect(data?.cover_url).toBeNull();
  });

  it("leaves a failed mirror's direct link in place, so it's retried on the next run", async () => {
    const supabase = createTestSupabaseClient();
    const mbReleaseGroupId = await insertAlbum(
      supabase,
      "https://coverartarchive.org/release-group/flaky/front.jpg"
    );
    const failingMirror = { mirror: vi.fn().mockResolvedValue(null) };

    const failedAttempt = await backfillCoverArt({ supabase, coverMirror: failingMirror });

    expect(failedAttempt).toEqual({ migrated: 0, skipped: 1 });
    const { data: afterFailure } = await supabase
      .from("albums")
      .select("cover_url")
      .eq("mb_release_group_id", mbReleaseGroupId)
      .single();
    expect(afterFailure?.cover_url).toBe(
      "https://coverartarchive.org/release-group/flaky/front.jpg"
    );

    // albums has no delete grant (it's a shared cache, never deleted by the
    // app) — so instead of cleaning up by deleting, prove the retry actually
    // works: a later run with a healthy mirror picks the row back up and
    // migrates it, which also leaves the table clean for other tests.
    const succeedingMirror = {
      mirror: vi.fn().mockResolvedValue("https://storage.example/covers/flaky.jpg"),
    };
    const retryAttempt = await backfillCoverArt({ supabase, coverMirror: succeedingMirror });

    expect(retryAttempt).toEqual({ migrated: 1, skipped: 0 });
    const { data: afterRetry } = await supabase
      .from("albums")
      .select("cover_url")
      .eq("mb_release_group_id", mbReleaseGroupId)
      .single();
    expect(afterRetry?.cover_url).toBe("https://storage.example/covers/flaky.jpg");
  });

  it("is safe to run twice: the second run leaves the newly-migrated row alone", async () => {
    const supabase = createTestSupabaseClient();
    const mbReleaseGroupId = await insertAlbum(
      supabase,
      "https://coverartarchive.org/release-group/y/front.jpg"
    );
    const coverMirror = {
      mirror: vi.fn().mockResolvedValue("https://storage.example/covers/y.jpg"),
    };

    const first = await backfillCoverArt({ supabase, coverMirror });
    expect(first).toEqual({ migrated: 1, skipped: 0 });

    const second = await backfillCoverArt({ supabase, coverMirror });

    expect(coverMirror.mirror).toHaveBeenCalledTimes(1);
    const { data } = await supabase
      .from("albums")
      .select("cover_url")
      .eq("mb_release_group_id", mbReleaseGroupId)
      .single();
    expect(data?.cover_url).toBe("https://storage.example/covers/y.jpg");
    expect(second.migrated).toBe(0);
  });

  it("doesn't double-count a permanently-stuck row across pagination passes", async () => {
    const supabase = createTestSupabaseClient();
    const migratingId = await insertAlbum(
      supabase,
      "https://coverartarchive.org/release-group/migrates/front.jpg"
    );
    const stuckId = await insertAlbum(
      supabase,
      "https://coverartarchive.org/release-group/stuck/front.jpg"
    );
    // Once `migratingId` is mirrored away, `stuckId` is the only row left
    // matching the filter — forcing a second internal pagination pass over
    // the same still-failing row, which is exactly what could double-count it.
    const coverMirror = {
      mirror: vi.fn(async (_url: string, id: string) =>
        id === migratingId ? "https://storage.example/covers/migrates.jpg" : null
      ),
    };

    const summary = await backfillCoverArt({ supabase, coverMirror });

    expect(summary).toEqual({ migrated: 1, skipped: 1 });
    const { data } = await supabase
      .from("albums")
      .select("cover_url")
      .eq("mb_release_group_id", stuckId)
      .single();
    expect(data?.cover_url).toBe("https://coverartarchive.org/release-group/stuck/front.jpg");

    // No delete grant on albums — clean up by migrating stuckId for real,
    // same as the single-row flaky-mirror test above.
    await backfillCoverArt({
      supabase,
      coverMirror: { mirror: vi.fn().mockResolvedValue("https://storage.example/covers/stuck.jpg") },
    });
  });
});
