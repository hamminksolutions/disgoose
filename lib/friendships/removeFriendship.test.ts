import { describe, it, expect } from "vitest";
import { sendFriendRequest } from "./sendFriendRequest";
import { acceptFriendRequest } from "./acceptFriendRequest";
import { removeFriendship } from "./removeFriendship";
import { createTestSupabaseClient } from "../supabase/testClient";
import { createTestUser } from "../auth/testHelpers";

describe("removeFriendship", () => {
  it("lets the addressee decline a pending request", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const supabase = createTestSupabaseClient();
    const request = await sendFriendRequest(
      { requesterId: a.userId, addresseeUsername: b.username },
      { supabase }
    );

    await removeFriendship(request.id, b.userId, { supabase });

    const { data } = await supabase.from("friendships").select().eq("id", request.id).maybeSingle();
    expect(data).toBeNull();
  });

  it("lets either party unfriend an accepted friendship", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const supabase = createTestSupabaseClient();
    const request = await sendFriendRequest(
      { requesterId: a.userId, addresseeUsername: b.username },
      { supabase }
    );
    await acceptFriendRequest(request.id, b.userId, { supabase });

    // The original requester (a) can also end it, not just the addressee.
    await removeFriendship(request.id, a.userId, { supabase });

    const { data } = await supabase.from("friendships").select().eq("id", request.id).maybeSingle();
    expect(data).toBeNull();
  });

  it("rejects removal by someone who isn't part of the friendship", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const stranger = await createTestUser();
    const supabase = createTestSupabaseClient();
    const request = await sendFriendRequest(
      { requesterId: a.userId, addresseeUsername: b.username },
      { supabase }
    );

    await expect(removeFriendship(request.id, stranger.userId, { supabase })).rejects.toThrow();
  });
});
