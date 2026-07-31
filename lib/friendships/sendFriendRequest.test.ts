import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { sendFriendRequest } from "./sendFriendRequest";
import { createTestSupabaseClient } from "../supabase/testClient";
import { createTestUser } from "./testHelpers";

describe("sendFriendRequest", () => {
  it("creates a pending request from the requester to the named user", async () => {
    const a = await createTestUser();
    const b = await createTestUser();

    const result = await sendFriendRequest(
      { requesterId: a.userId, addresseeUsername: b.username },
      { supabase: createTestSupabaseClient() }
    );

    expect(result.status).toBe("pending");
    expect(result.requesterId).toBe(a.userId);
    expect(result.addresseeId).toBe(b.userId);
  });

  it("rejects a request to yourself", async () => {
    const a = await createTestUser();

    await expect(
      sendFriendRequest(
        { requesterId: a.userId, addresseeUsername: a.username },
        { supabase: createTestSupabaseClient() }
      )
    ).rejects.toThrow();
  });

  it("rejects a request to a username that doesn't exist", async () => {
    const a = await createTestUser();

    await expect(
      sendFriendRequest(
        { requesterId: a.userId, addresseeUsername: `nobody_${randomUUID().slice(0, 8)}` },
        { supabase: createTestSupabaseClient() }
      )
    ).rejects.toThrow();
  });

  it("auto-resolves to an accepted friendship when the addressee already has a pending request open toward the requester", async () => {
    const a = await createTestUser();
    const b = await createTestUser();

    // b already asked a first.
    await sendFriendRequest(
      { requesterId: b.userId, addresseeUsername: a.username },
      { supabase: createTestSupabaseClient() }
    );

    // a now asks b — should resolve the existing row to accepted, not add a second one.
    const result = await sendFriendRequest(
      { requesterId: a.userId, addresseeUsername: b.username },
      { supabase: createTestSupabaseClient() }
    );

    expect(result.status).toBe("accepted");
    expect(result.requesterId).toBe(b.userId);
    expect(result.addresseeId).toBe(a.userId);
  });
});
