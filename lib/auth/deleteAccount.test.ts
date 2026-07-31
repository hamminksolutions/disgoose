import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { deleteAccount } from "./deleteAccount";
import { loginUser } from "./loginUser";
import { upsertRating } from "../ratings/upsertRating";
import { sendFriendRequest } from "../friendships/sendFriendRequest";
import { createTestSupabaseClient } from "../supabase/testClient";
import { createTestUser, createConfirmedTestUser } from "./testHelpers";

async function createTestAlbum(supabaseAdmin: ReturnType<typeof createTestSupabaseClient>) {
  const { data } = await supabaseAdmin
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

describe("deleteAccount", () => {
  it("removes the user's own profile row", async () => {
    const supabaseAdmin = createTestSupabaseClient();
    const { userId } = await createTestUser();

    await deleteAccount(userId, { supabaseAdmin });

    const { data } = await supabaseAdmin.from("users").select().eq("id", userId).maybeSingle();
    expect(data).toBeNull();
  });

  it("cascades to the user's ratings", async () => {
    const supabaseAdmin = createTestSupabaseClient();
    const { userId } = await createTestUser();
    const albumId = await createTestAlbum(supabaseAdmin);
    const rating = await upsertRating(
      { userId, albumId, score: 90, listenMethod: "vinyl" },
      { supabase: supabaseAdmin }
    );

    await deleteAccount(userId, { supabaseAdmin });

    const { data } = await supabaseAdmin
      .from("ratings")
      .select()
      .eq("id", rating.id)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it("cascades to friendships involving the deleted user, so they vanish from a friend's list", async () => {
    const supabaseAdmin = createTestSupabaseClient();
    const { userId: deletedUserId } = await createTestUser();
    const friend = await createTestUser();
    const friendship = await sendFriendRequest(
      { requesterId: deletedUserId, addresseeUsername: friend.username },
      { supabase: supabaseAdmin }
    );

    await deleteAccount(deletedUserId, { supabaseAdmin });

    const { data } = await supabaseAdmin
      .from("friendships")
      .select()
      .eq("id", friendship.id)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it("prevents the deleted user from logging in afterward", async () => {
    const supabaseAdmin = createTestSupabaseClient();
    const { userId, email, password } = await createConfirmedTestUser();

    await deleteAccount(userId, { supabaseAdmin });

    await expect(
      loginUser({ email, password }, { supabase: createTestSupabaseClient() })
    ).rejects.toThrow();
  });
});
