import { describe, it, expect } from "vitest";
import { sendFriendRequest } from "./sendFriendRequest";
import { acceptFriendRequest } from "./acceptFriendRequest";
import { areFriends } from "./areFriends";
import { createTestSupabaseClient } from "../supabase/testClient";
import { createTestUser } from "../auth/testHelpers";

describe("areFriends", () => {
  it("returns true once a friend request has been accepted, regardless of who asked", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const supabase = createTestSupabaseClient();
    const request = await sendFriendRequest(
      { requesterId: a.userId, addresseeUsername: b.username },
      { supabase }
    );
    await acceptFriendRequest(request.id, b.userId, { supabase });

    expect(await areFriends(a.userId, b.userId, { supabase })).toBe(true);
    expect(await areFriends(b.userId, a.userId, { supabase })).toBe(true);
  });

  it("returns false for a pending, not-yet-accepted request", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const supabase = createTestSupabaseClient();
    await sendFriendRequest({ requesterId: a.userId, addresseeUsername: b.username }, { supabase });

    expect(await areFriends(a.userId, b.userId, { supabase })).toBe(false);
  });

  it("returns false for two users with no relationship at all", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const supabase = createTestSupabaseClient();

    expect(await areFriends(a.userId, b.userId, { supabase })).toBe(false);
  });
});
