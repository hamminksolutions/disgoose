import { describe, it, expect } from "vitest";
import { sendFriendRequest } from "./sendFriendRequest";
import { getPendingRequests } from "./getPendingRequests";
import { createTestSupabaseClient } from "../supabase/testClient";
import { createTestUser } from "./testHelpers";

describe("getPendingRequests", () => {
  it("lists pending requests addressed to the user, with the requester's username", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const c = await createTestUser();
    const supabase = createTestSupabaseClient();
    await sendFriendRequest({ requesterId: a.userId, addresseeUsername: c.username }, { supabase });
    await sendFriendRequest({ requesterId: b.userId, addresseeUsername: c.username }, { supabase });

    const requests = await getPendingRequests(c.userId, { supabase });

    expect(requests).toHaveLength(2);
    expect(requests.map((r) => r.requesterUsername).sort()).toEqual(
      [a.username, b.username].sort()
    );
  });

  it("does not include requests the user sent (only ones addressed to them)", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const supabase = createTestSupabaseClient();
    await sendFriendRequest({ requesterId: a.userId, addresseeUsername: b.username }, { supabase });

    const requests = await getPendingRequests(a.userId, { supabase });

    expect(requests).toHaveLength(0);
  });
});
