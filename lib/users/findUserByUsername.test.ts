import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { registerUser } from "../auth/registerUser";
import { findUserByUsername } from "./findUserByUsername";
import { createTestSupabaseClient } from "../supabase/testClient";

describe("findUserByUsername", () => {
  it("finds a user by exact username", async () => {
    const supabase = createTestSupabaseClient();
    const username = `user_${randomUUID().slice(0, 8)}`;
    const { userId } = await registerUser(
      { email: `${randomUUID()}@example.test`, password: "correct-horse-battery-staple", username },
      { supabase: createTestSupabaseClient(), supabaseAdmin: supabase }
    );

    const found = await findUserByUsername(username, { supabase });

    expect(found?.id).toBe(userId);
  });

  it("is case-insensitive", async () => {
    const supabase = createTestSupabaseClient();
    const username = `User_${randomUUID().slice(0, 8)}`;
    const { userId } = await registerUser(
      { email: `${randomUUID()}@example.test`, password: "correct-horse-battery-staple", username },
      { supabase: createTestSupabaseClient(), supabaseAdmin: supabase }
    );

    const found = await findUserByUsername(username.toLowerCase(), { supabase });

    expect(found?.id).toBe(userId);
  });

  it("does not treat underscores as wildcards", async () => {
    const supabase = createTestSupabaseClient();
    const username = `user_${randomUUID().slice(0, 8)}`;
    await registerUser(
      { email: `${randomUUID()}@example.test`, password: "correct-horse-battery-staple", username },
      { supabase: createTestSupabaseClient(), supabaseAdmin: supabase }
    );
    const impostor = username.replace("_", "X");

    const found = await findUserByUsername(impostor, { supabase });

    expect(found).toBeNull();
  });

  it("returns null for a username that doesn't exist", async () => {
    const supabase = createTestSupabaseClient();

    const found = await findUserByUsername(`nobody_${randomUUID().slice(0, 8)}`, { supabase });

    expect(found).toBeNull();
  });
});
