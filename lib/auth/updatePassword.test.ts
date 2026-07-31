import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { registerUser } from "./registerUser";
import { loginUser } from "./loginUser";
import { updatePassword } from "./updatePassword";
import { createTestSupabaseClient, confirmTestUserEmail } from "../supabase/testClient";

describe("updatePassword", () => {
  it("changes the password for the active session, and the new password can log in", async () => {
    const email = `${randomUUID()}@example.test`;
    const oldPassword = "correct-horse-battery-staple";
    const newPassword = "new-correct-horse-battery-staple";
    const supabase = createTestSupabaseClient();
    const supabaseAdmin = createTestSupabaseClient();

    const { userId } = await registerUser(
      { email, password: oldPassword, username: `user_${randomUUID().slice(0, 8)}` },
      { supabase: createTestSupabaseClient(), supabaseAdmin }
    );
    await confirmTestUserEmail(supabaseAdmin, userId);
    await loginUser({ email, password: oldPassword }, { supabase });

    await updatePassword({ password: newPassword }, { supabase });

    await expect(
      loginUser({ email, password: newPassword }, { supabase: createTestSupabaseClient() })
    ).resolves.toBeTruthy();
    await expect(
      loginUser({ email, password: oldPassword }, { supabase: createTestSupabaseClient() })
    ).rejects.toThrow();
  });
});
