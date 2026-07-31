import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { getAllRatings } from "./getAllRatings";
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
  title = "Test Album"
) {
  const { data } = await supabase
    .from("albums")
    .insert({
      mb_release_group_id: randomUUID(),
      title,
      artist: "Test Artist",
      cover_url: null,
    })
    .select()
    .single();
  return data!.id as string;
}

describe("getAllRatings", () => {
  it("returns all of a user's ratings, including ones beyond the 40-item grid cutoff", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    for (let i = 0; i < 45; i++) {
      const albumId = await createTestAlbum(supabase, `Album ${i}`);
      await upsertRating({ userId, albumId, score: 50, listenMethod: "cd" }, { supabase });
    }

    const page1 = await getAllRatings(userId, { page: 1, pageSize: 20, sortBy: "newest" }, { supabase });
    const page2 = await getAllRatings(userId, { page: 2, pageSize: 20, sortBy: "newest" }, { supabase });
    const page3 = await getAllRatings(userId, { page: 3, pageSize: 20, sortBy: "newest" }, { supabase });

    expect(page1.totalCount).toBe(45);
    expect(page1.items).toHaveLength(20);
    expect(page2.items).toHaveLength(20);
    expect(page3.items).toHaveLength(5);
  });

  it("sorts by newest first using created_at, and an edit never moves a rating", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumA = await createTestAlbum(supabase, "First Rated");
    const albumB = await createTestAlbum(supabase, "Second Rated");
    await upsertRating({ userId, albumId: albumA, score: 50, listenMethod: "cd" }, { supabase });
    await upsertRating({ userId, albumId: albumB, score: 60, listenMethod: "cd" }, { supabase });
    // Editing the older one must not bump it to the front.
    await upsertRating({ userId, albumId: albumA, score: 55, listenMethod: "vinyl" }, { supabase });

    const { items } = await getAllRatings(
      userId,
      { page: 1, pageSize: 20, sortBy: "newest" },
      { supabase }
    );

    expect(items.map((r) => r.title)).toEqual(["Second Rated", "First Rated"]);
  });

  it("sorts by highest rated first", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const low = await createTestAlbum(supabase, "Low Score");
    const high = await createTestAlbum(supabase, "High Score");
    await upsertRating({ userId, albumId: low, score: 30, listenMethod: "cd" }, { supabase });
    await upsertRating({ userId, albumId: high, score: 95, listenMethod: "cd" }, { supabase });

    const { items } = await getAllRatings(
      userId,
      { page: 1, pageSize: 20, sortBy: "highest_rated" },
      { supabase }
    );

    expect(items.map((r) => r.title)).toEqual(["High Score", "Low Score"]);
  });

  it("never includes review text", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumId = await createTestAlbum(supabase);
    await upsertRating(
      { userId, albumId, score: 70, listenMethod: "cd", reviewText: "Secret review text" },
      { supabase }
    );

    const { items } = await getAllRatings(
      userId,
      { page: 1, pageSize: 20, sortBy: "newest" },
      { supabase }
    );

    expect(JSON.stringify(items)).not.toContain("Secret review text");
  });
});
