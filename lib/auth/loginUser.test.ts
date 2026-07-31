import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { registerUser } from "./registerUser";
import { loginUser } from "./loginUser";
import { createTestSupabaseClient, confirmTestUserEmail } from "../supabase/testClient";

describe("loginUser", () => {
  it("returns a session for a registered, confirmed user's correct email and password", async () => {
    const email = `${randomUUID()}@example.test`;
    const password = "correct-horse-battery-staple";
    const supabaseAdmin = createTestSupabaseClient();
    const { userId } = await registerUser(
      { email, password, username: `user_${randomUUID().slice(0, 8)}` },
      { supabase: createTestSupabaseClient(), supabaseAdmin }
    );
    await confirmTestUserEmail(supabaseAdmin, userId);

    const result = await loginUser(
      { email, password },
      { supabase: createTestSupabaseClient() }
    );

    expect(result.session?.access_token).toBeTruthy();
  });

  it("rejects login before the email is confirmed", async () => {
    const email = `${randomUUID()}@example.test`;
    const password = "correct-horse-battery-staple";
    await registerUser(
      { email, password, username: `user_${randomUUID().slice(0, 8)}` },
      { supabase: createTestSupabaseClient(), supabaseAdmin: createTestSupabaseClient() }
    );

    await expect(
      loginUser({ email, password }, { supabase: createTestSupabaseClient() })
    ).rejects.toThrow();
  });

  it("rejects an incorrect password", async () => {
    const email = `${randomUUID()}@example.test`;
    const supabaseAdmin = createTestSupabaseClient();
    const { userId } = await registerUser(
      { email, password: "correct-horse-battery-staple", username: `user_${randomUUID().slice(0, 8)}` },
      { supabase: createTestSupabaseClient(), supabaseAdmin }
    );
    await confirmTestUserEmail(supabaseAdmin, userId);

    await expect(
      loginUser(
        { email, password: "totally-wrong-password" },
        { supabase: createTestSupabaseClient() }
      )
    ).rejects.toThrow();
  });
});
