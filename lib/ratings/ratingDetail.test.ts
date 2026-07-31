import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { getRatingDetail } from "./getRatingDetail";
import { updateRating } from "./updateRating";
import { deleteRating } from "./deleteRating";
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
  const { data } = await supabase
    .from("albums")
    .insert({
      mb_release_group_id: randomUUID(),
      title: "Test Album",
      artist: "Test Artist",
      cover_url: "https://coverartarchive.example/test.jpg",
    })
    .select()
    .single();
  return data!.id as string;
}

describe("getRatingDetail", () => {
  it("returns the full rating, including review text and album info, for its owner", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId, albumId, score: 88, listenMethod: "vinyl", reviewText: "My honest thoughts" },
      { supabase }
    );

    const detail = await getRatingDetail(rating.id, userId, { supabase });

    expect(detail).toMatchObject({
      score: 88,
      listenMethod: "vinyl",
      reviewText: "My honest thoughts",
      album: { title: "Test Album", artist: "Test Artist" },
    });
  });

  it("returns null for a rating that belongs to a different user", async () => {
    const supabase = createTestSupabaseClient();
    const ownerId = await createTestUser(supabase);
    const otherUserId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId: ownerId, albumId, score: 60, listenMethod: "cd" },
      { supabase }
    );

    const detail = await getRatingDetail(rating.id, otherUserId, { supabase });

    expect(detail).toBeNull();
  });
});

describe("updateRating", () => {
  it("updates score, listen method, and review for the owner", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId, albumId, score: 60, listenMethod: "cd", reviewText: "Meh" },
      { supabase }
    );

    const updated = await updateRating(
      rating.id,
      userId,
      { score: 95, listenMethod: "vinyl", reviewText: "Actually great" },
      { supabase }
    );

    expect(updated).toMatchObject({ score: 95, listenMethod: "vinyl", reviewText: "Actually great" });
  });

  it("refuses to update a rating that belongs to a different user", async () => {
    const supabase = createTestSupabaseClient();
    const ownerId = await createTestUser(supabase);
    const otherUserId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId: ownerId, albumId, score: 60, listenMethod: "cd" },
      { supabase }
    );

    await expect(
      updateRating(rating.id, otherUserId, { score: 10 }, { supabase })
    ).rejects.toThrow();
  });
});

describe("deleteRating", () => {
  it("deletes the rating for its owner, leaving the album cache intact", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId, albumId, score: 60, listenMethod: "cd" },
      { supabase }
    );

    await deleteRating(rating.id, userId, { supabase });

    const detail = await getRatingDetail(rating.id, userId, { supabase });
    expect(detail).toBeNull();
    const { data: album } = await supabase.from("albums").select("id").eq("id", albumId).single();
    expect(album).not.toBeNull();
  });

  it("refuses to delete a rating that belongs to a different user", async () => {
    const supabase = createTestSupabaseClient();
    const ownerId = await createTestUser(supabase);
    const otherUserId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId: ownerId, albumId, score: 60, listenMethod: "cd" },
      { supabase }
    );

    await expect(deleteRating(rating.id, otherUserId, { supabase })).rejects.toThrow();

    const stillThere = await getRatingDetail(rating.id, ownerId, { supabase });
    expect(stillThere).not.toBeNull();
  });
});
