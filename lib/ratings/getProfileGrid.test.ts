import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { getProfileGrid } from "./getProfileGrid";
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

async function createTestAlbum(
  supabase: ReturnType<typeof createTestSupabaseClient>,
  overrides: { title?: string; coverUrl?: string | null } = {}
) {
  const { data } = await supabase
    .from("albums")
    .insert({
      mb_release_group_id: randomUUID(),
      title: overrides.title ?? "Test Album",
      artist: "Test Artist",
      cover_url: overrides.coverUrl ?? null,
    })
    .select()
    .single();
  return data!.id as string;
}

describe("getProfileGrid", () => {
  it("returns an empty array for a user with no ratings", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);

    const grid = await getProfileGrid(userId, { supabase });

    expect(grid).toEqual([]);
  });

  it("returns the user's ratings with album cover, title, and score", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase, {
      title: "OK Computer",
      coverUrl: "https://coverartarchive.example/ok-computer.jpg",
    });
    await upsertRating(
      { userId, albumId, score: 92, listenMethod: "vinyl", reviewText: "Secret review text" },
      { supabase }
    );

    const grid = await getProfileGrid(userId, { supabase });

    expect(grid).toEqual([
      expect.objectContaining({
        score: 92,
        title: "OK Computer",
        coverUrl: "https://coverartarchive.example/ok-computer.jpg",
      }),
    ]);
  });

  it("never includes review text", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);
    await upsertRating(
      { userId, albumId, score: 70, listenMethod: "cd", reviewText: "Secret review text" },
      { supabase }
    );

    const grid = await getProfileGrid(userId, { supabase });

    expect(JSON.stringify(grid)).not.toContain("Secret review text");
  });

  it("orders by first-rated date (created_at), most recent first", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumA = await createTestAlbum(supabase, { title: "First Rated" });
    const albumB = await createTestAlbum(supabase, { title: "Second Rated" });

    await upsertRating(
      { userId, albumId: albumA, score: 50, listenMethod: "cd" },
      { supabase }
    );
    await upsertRating(
      { userId, albumId: albumB, score: 60, listenMethod: "cd" },
      { supabase }
    );

    const grid = await getProfileGrid(userId, { supabase });

    expect(grid.map((r) => r.title)).toEqual(["Second Rated", "First Rated"]);
  });

  it("editing an older rating does not move it to the front", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumA = await createTestAlbum(supabase, { title: "First Rated" });
    const albumB = await createTestAlbum(supabase, { title: "Second Rated" });

    await upsertRating({ userId, albumId: albumA, score: 50, listenMethod: "cd" }, { supabase });
    await upsertRating({ userId, albumId: albumB, score: 60, listenMethod: "cd" }, { supabase });

    // Re-rate the older album (an edit, not a first-time rating).
    await upsertRating({ userId, albumId: albumA, score: 55, listenMethod: "vinyl" }, { supabase });

    const grid = await getProfileGrid(userId, { supabase });

    expect(grid.map((r) => r.title)).toEqual(["Second Rated", "First Rated"]);
  });

  it("limits the grid to the 40 most recently first-rated albums", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);

    for (let i = 0; i < 41; i++) {
      const albumId = await createTestAlbum(supabase, { title: `Album ${i}` });
      await upsertRating({ userId, albumId, score: 50, listenMethod: "cd" }, { supabase });
    }

    const grid = await getProfileGrid(userId, { supabase });

    expect(grid).toHaveLength(40);
    expect(grid.map((r) => r.title)).not.toContain("Album 0");
    expect(grid.map((r) => r.title)).toContain("Album 40");
  });
});
