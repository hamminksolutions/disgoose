import { describe, it, expect } from "vitest";
import { sendFriendRequest } from "./sendFriendRequest";
import { acceptFriendRequest } from "./acceptFriendRequest";
import { getFriends } from "./getFriends";
import { createTestSupabaseClient } from "../supabase/testClient";
import { createTestUser } from "./testHelpers";

describe("getFriends", () => {
  it("lists accepted friends regardless of who sent the original request", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const c = await createTestUser();
    const supabase = createTestSupabaseClient();
    // a requested b (a is requester); c requested a (a is addressee).
    const ab = await sendFriendRequest(
      { requesterId: a.userId, addresseeUsername: b.username },
      { supabase }
    );
    await acceptFriendRequest(ab.id, b.userId, { supabase });
    const ca = await sendFriendRequest(
      { requesterId: c.userId, addresseeUsername: a.username },
      { supabase }
    );
    await acceptFriendRequest(ca.id, a.userId, { supabase });

    const friends = await getFriends(a.userId, { supabase });

    expect(friends.map((f) => f.username).sort()).toEqual([b.username, c.username].sort());
  });

  it("does not include pending (not yet accepted) requests", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const supabase = createTestSupabaseClient();
    await sendFriendRequest({ requesterId: a.userId, addresseeUsername: b.username }, { supabase });

    const friends = await getFriends(a.userId, { supabase });

    expect(friends).toHaveLength(0);
  });
});
