import { describe, it, expect } from "vitest";
import { sendFriendRequest } from "./sendFriendRequest";
import { acceptFriendRequest } from "./acceptFriendRequest";
import { createTestSupabaseClient } from "../supabase/testClient";
import { createTestUser } from "../auth/testHelpers";

describe("acceptFriendRequest", () => {
  it("turns a pending request into an accepted friendship when the addressee accepts", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const supabase = createTestSupabaseClient();
    const request = await sendFriendRequest(
      { requesterId: a.userId, addresseeUsername: b.username },
      { supabase }
    );

    const result = await acceptFriendRequest(request.id, b.userId, { supabase });

    expect(result.status).toBe("accepted");
  });

  it("rejects acceptance by anyone other than the addressee", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const stranger = await createTestUser();
    const supabase = createTestSupabaseClient();
    const request = await sendFriendRequest(
      { requesterId: a.userId, addresseeUsername: b.username },
      { supabase }
    );

    await expect(
      acceptFriendRequest(request.id, stranger.userId, { supabase })
    ).rejects.toThrow();
  });
});
