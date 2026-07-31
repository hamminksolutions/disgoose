import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { getRatingDetail } from "./getRatingDetail";
import { updateRating } from "./updateRating";
import { deleteRating } from "./deleteRating";
import { upsertRating } from "./upsertRating";
import { sendFriendRequest } from "../friendships/sendFriendRequest";
import { acceptFriendRequest } from "../friendships/acceptFriendRequest";
import { createTestSupabaseClient } from "../supabase/testClient";
import { createTestUser } from "../auth/testHelpers";

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
  it("returns the full rating, including review text, for its owner", async () => {
    const supabase = createTestSupabaseClient();
    const owner = await createTestUser();
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId: owner.userId, albumId, score: 88, listenMethod: "vinyl", reviewText: "My honest thoughts" },
      { supabase }
    );

    const detail = await getRatingDetail(rating.id, owner.userId, { supabase });

    expect(detail).toMatchObject({
      score: 88,
      listenMethod: "vinyl",
      reviewText: "My honest thoughts",
      album: { title: "Test Album", artist: "Test Artist" },
    });
  });

  it("returns score and listen method, but not review text, for a stranger", async () => {
    const supabase = createTestSupabaseClient();
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId: owner.userId, albumId, score: 60, listenMethod: "cd", reviewText: "Secret thoughts" },
      { supabase }
    );

    const detail = await getRatingDetail(rating.id, stranger.userId, { supabase });

    expect(detail).toMatchObject({ score: 60, listenMethod: "cd", reviewText: null });
  });

  it("returns score and listen method, but not review text, for a logged-out viewer", async () => {
    const supabase = createTestSupabaseClient();
    const owner = await createTestUser();
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId: owner.userId, albumId, score: 60, listenMethod: "cd", reviewText: "Secret thoughts" },
      { supabase }
    );

    const detail = await getRatingDetail(rating.id, null, { supabase });

    expect(detail).toMatchObject({ score: 60, listenMethod: "cd", reviewText: null });
  });

  it("includes review text for an accepted friend", async () => {
    const supabase = createTestSupabaseClient();
    const owner = await createTestUser();
    const friend = await createTestUser();
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId: owner.userId, albumId, score: 60, listenMethod: "cd", reviewText: "Shared with friends" },
      { supabase }
    );
    const request = await sendFriendRequest(
      { requesterId: friend.userId, addresseeUsername: owner.username },
      { supabase }
    );
    await acceptFriendRequest(request.id, owner.userId, { supabase });

    const detail = await getRatingDetail(rating.id, friend.userId, { supabase });

    expect(detail?.reviewText).toBe("Shared with friends");
  });

  it("returns null for a rating that doesn't exist", async () => {
    const supabase = createTestSupabaseClient();
    const viewer = await createTestUser();

    const detail = await getRatingDetail(randomUUID(), viewer.userId, { supabase });

    expect(detail).toBeNull();
  });
});

describe("updateRating", () => {
  it("updates score, listen method, and review for the owner", async () => {
    const supabase = createTestSupabaseClient();
    const owner = await createTestUser();
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId: owner.userId, albumId, score: 60, listenMethod: "cd", reviewText: "Meh" },
      { supabase }
    );

    const updated = await updateRating(
      rating.id,
      owner.userId,
      { score: 95, listenMethod: "vinyl", reviewText: "Actually great" },
      { supabase }
    );

    expect(updated).toMatchObject({ score: 95, listenMethod: "vinyl", reviewText: "Actually great" });
  });

  it("refuses to update a rating that belongs to a different user", async () => {
    const supabase = createTestSupabaseClient();
    const owner = await createTestUser();
    const other = await createTestUser();
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId: owner.userId, albumId, score: 60, listenMethod: "cd" },
      { supabase }
    );

    await expect(
      updateRating(rating.id, other.userId, { score: 10 }, { supabase })
    ).rejects.toThrow();
  });
});

describe("deleteRating", () => {
  it("deletes the rating for its owner, leaving the album cache intact", async () => {
    const supabase = createTestSupabaseClient();
    const owner = await createTestUser();
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId: owner.userId, albumId, score: 60, listenMethod: "cd" },
      { supabase }
    );

    await deleteRating(rating.id, owner.userId, { supabase });

    const detail = await getRatingDetail(rating.id, owner.userId, { supabase });
    expect(detail).toBeNull();
    const { data: album } = await supabase.from("albums").select("id").eq("id", albumId).single();
    expect(album).not.toBeNull();
  });

  it("refuses to delete a rating that belongs to a different user", async () => {
    const supabase = createTestSupabaseClient();
    const owner = await createTestUser();
    const other = await createTestUser();
    const albumId = await createTestAlbum(supabase);
    const rating = await upsertRating(
      { userId: owner.userId, albumId, score: 60, listenMethod: "cd" },
      { supabase }
    );

    await expect(deleteRating(rating.id, other.userId, { supabase })).rejects.toThrow();

    const stillThere = await getRatingDetail(rating.id, owner.userId, { supabase });
    expect(stillThere).not.toBeNull();
  });
});
