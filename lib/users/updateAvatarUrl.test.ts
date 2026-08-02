import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { registerUser } from "../auth/registerUser";
import { updateAvatarUrl, isOwnAvatarUrl } from "./updateAvatarUrl";
import { createTestSupabaseClient } from "../supabase/testClient";

describe("isOwnAvatarUrl", () => {
  it("accepts a public URL under the given user's own bucket path", () => {
    const userId = randomUUID();
    const url = `https://example.test/storage/v1/object/public/avatars/${userId}/avatar.jpg?t=123`;

    expect(isOwnAvatarUrl(url, userId)).toBe(true);
  });

  it("rejects a URL under a different user's path", () => {
    const userId = randomUUID();
    const otherId = randomUUID();
    const url = `https://example.test/storage/v1/object/public/avatars/${otherId}/avatar.jpg`;

    expect(isOwnAvatarUrl(url, userId)).toBe(false);
  });

  it("rejects an arbitrary external URL", () => {
    expect(isOwnAvatarUrl("https://evil.test/tracker.png", randomUUID())).toBe(false);
  });
});

describe("updateAvatarUrl", () => {
  it("persists an avatar URL under the user's own path", async () => {
    const supabase = createTestSupabaseClient();
    const username = `user_${randomUUID().slice(0, 8)}`;
    const { userId } = await registerUser(
      { email: `${randomUUID()}@example.test`, password: "correct-horse-battery-staple", username },
      { supabase: createTestSupabaseClient(), supabaseAdmin: supabase }
    );
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${userId}/avatar.jpg`;

    await updateAvatarUrl(userId, url, { supabase });

    const { data } = await supabase.from("users").select("avatar_url").eq("id", userId).single();
    expect(data?.avatar_url).toBe(url);
  });

  it("rejects a URL that doesn't belong to the user", async () => {
    const supabase = createTestSupabaseClient();
    const username = `user_${randomUUID().slice(0, 8)}`;
    const { userId } = await registerUser(
      { email: `${randomUUID()}@example.test`, password: "correct-horse-battery-staple", username },
      { supabase: createTestSupabaseClient(), supabaseAdmin: supabase }
    );
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${randomUUID()}/avatar.jpg`;

    await expect(updateAvatarUrl(userId, url, { supabase })).rejects.toThrow(
      /does not belong to this user/
    );
  });
});
