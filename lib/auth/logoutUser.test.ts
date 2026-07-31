import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { registerUser } from "./registerUser";
import { loginUser } from "./loginUser";
import { logoutUser } from "./logoutUser";
import { createTestSupabaseClient, confirmTestUserEmail } from "../supabase/testClient";

describe("logoutUser", () => {
  it("clears the active session", async () => {
    const supabase = createTestSupabaseClient();
    const supabaseAdmin = createTestSupabaseClient();
    const email = `${randomUUID()}@example.test`;
    const password = "correct-horse-battery-staple";
    const { userId } = await registerUser(
      { email, password, username: `user_${randomUUID().slice(0, 8)}` },
      { supabase: createTestSupabaseClient(), supabaseAdmin }
    );
    // registerUser no longer returns an active session — confirm and log in
    // (on the same client instance logoutUser will act on) to get one.
    await confirmTestUserEmail(supabaseAdmin, userId);
    await loginUser({ email, password }, { supabase });

    const { data: before } = await supabase.auth.getSession();
    expect(before.session).not.toBeNull();

    await logoutUser({ supabase });

    const { data: after } = await supabase.auth.getSession();
    expect(after.session).toBeNull();
  });
});
