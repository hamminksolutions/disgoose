import { describe, it, expect } from "vitest";
import { loginUser } from "./loginUser";
import { logoutUser } from "./logoutUser";
import { createTestSupabaseClient } from "../supabase/testClient";
import { createConfirmedTestUser } from "./testHelpers";

describe("logoutUser", () => {
  it("clears the active session", async () => {
    const supabase = createTestSupabaseClient();
    const { email, password } = await createConfirmedTestUser();
    // registerUser no longer returns an active session — log in (on the
    // same client instance logoutUser will act on) to get one.
    await loginUser({ email, password }, { supabase });

    const { data: before } = await supabase.auth.getSession();
    expect(before.session).not.toBeNull();

    await logoutUser({ supabase });

    const { data: after } = await supabase.auth.getSession();
    expect(after.session).toBeNull();
  });
});
