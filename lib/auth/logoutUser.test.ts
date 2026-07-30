import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { registerUser } from "./registerUser";
import { logoutUser } from "./logoutUser";
import { createTestSupabaseClient } from "../supabase/testClient";

describe("logoutUser", () => {
  it("clears the active session", async () => {
    const supabase = createTestSupabaseClient();
    await registerUser(
      {
        email: `${randomUUID()}@example.test`,
        password: "correct-horse-battery-staple",
        username: `user_${randomUUID().slice(0, 8)}`,
      },
      { supabase, supabaseAdmin: createTestSupabaseClient() }
    );
    const { data: before } = await supabase.auth.getSession();
    expect(before.session).not.toBeNull();

    await logoutUser({ supabase });

    const { data: after } = await supabase.auth.getSession();
    expect(after.session).toBeNull();
  });
});
