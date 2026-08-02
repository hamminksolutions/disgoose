import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { upsertRating } from "./upsertRating";
import { registerUser } from "../auth/registerUser";
import { createTestSupabaseClient } from "../supabase/testClient";

async function createTestUser(supabase: ReturnType<typeof createTestSupabaseClient>) {
  const { userId } = await registerUser(
    {
      email: `${randomUUID()}@example.test`,
      password: "correct-horse-battery-staple",
      username: `user_${randomUUID().slice(0, 8)}`,
    },
    { supabase: createTestSupabaseClient(), supabaseAdmin: supabase }
  );
  return userId;
}

async function createTestAlbum(supabase: ReturnType<typeof createTestSupabaseClient>) {
  const mbReleaseGroupId = randomUUID();
  const { data } = await supabase
    .from("albums")
    .insert({
      mb_release_group_id: mbReleaseGroupId,
      title: "Test Album",
      artist: "Test Artist",
      cover_url: null,
    })
    .select()
    .single();
  return data!.id as string;
}

describe("upsertRating", () => {
  it("creates a new rating for a (user, album) pair", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);

    const rating = await upsertRating(
      { userId, albumId, score: 85, listenMethod: "spotify", reviewText: "Great album" },
      { supabase }
    );

    expect(rating).toMatchObject({
      userId,
      albumId,
      score: 85,
      listenMethod: "spotify",
      reviewText: "Great album",
    });
  });

  it("overwrites the existing rating instead of creating a duplicate when the same album is rated again", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);

    const first = await upsertRating(
      { userId, albumId, score: 70, listenMethod: "cd", reviewText: "First impression" },
      { supabase }
    );
    const second = await upsertRating(
      { userId, albumId, score: 95, listenMethod: "vinyl", reviewText: "Grew on me" },
      { supabase }
    );

    expect(second.id).toBe(first.id);
    expect(second).toMatchObject({ score: 95, listenMethod: "vinyl", reviewText: "Grew on me" });
  });

  it("rejects a review longer than 2000 characters with a clear message", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);

    await expect(
      upsertRating(
        { userId, albumId, score: 80, listenMethod: "cd", reviewText: "x".repeat(2001) },
        { supabase }
      )
    ).rejects.toThrow(/2000 characters/);
  });

  it("rejects a score outside the 1.0-10.0 range", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);

    await expect(
      upsertRating({ userId, albumId, score: 105, listenMethod: "cd" }, { supabase })
    ).rejects.toThrow(/1\.0.*10\.0/);
  });

  it("saves owned for a physical listen method", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);

    const rating = await upsertRating(
      { userId, albumId, score: 85, listenMethod: "vinyl", owned: true },
      { supabase }
    );

    expect(rating.owned).toBe(true);
  });

  it("drops owned instead of saving it for a non-physical listen method", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);

    const rating = await upsertRating(
      { userId, albumId, score: 85, listenMethod: "spotify", owned: true },
      { supabase }
    );

    expect(rating.owned).toBe(false);
  });
});
