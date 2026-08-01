import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { getRatingStats } from "./getRatingStats";
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
      cover_url: null,
    })
    .select()
    .single();
  return data!.id as string;
}

describe("getRatingStats", () => {
  it("returns a zero count and null average for a user with no ratings", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);

    const stats = await getRatingStats(userId, { supabase });

    expect(stats).toEqual({ count: 0, avgScore: null });
  });

  it("counts every rating and averages their scores, not just the Grid's 40", async () => {
    const supabase = createTestSupabaseClient();
    const userId = await createTestUser(supabase);
    const albumA = await createTestAlbum(supabase);
    const albumB = await createTestAlbum(supabase);

    await upsertRating({ userId, albumId: albumA, score: 80, listenMethod: "cd" }, { supabase });
    await upsertRating({ userId, albumId: albumB, score: 60, listenMethod: "cd" }, { supabase });

    const stats = await getRatingStats(userId, { supabase });

    expect(stats).toEqual({ count: 2, avgScore: 70 });
  });
});
