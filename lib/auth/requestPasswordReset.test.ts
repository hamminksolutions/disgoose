import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { registerUser } from "./registerUser";
import { requestPasswordReset } from "./requestPasswordReset";
import { createTestSupabaseClient } from "../supabase/testClient";

async function findMailpitMessagesTo(email: string) {
  const res = await fetch(
    `http://127.0.0.1:54324/api/v1/search?query=to:${encodeURIComponent(email)}`
  );
  const body = (await res.json()) as { messages: unknown[] };
  return body.messages;
}

describe("requestPasswordReset", () => {
  it("sends a password-reset email to a registered user", async () => {
    const email = `${randomUUID()}@example.test`;
    await registerUser(
      { email, password: "correct-horse-battery-staple", username: `user_${randomUUID().slice(0, 8)}` },
      { supabase: createTestSupabaseClient(), supabaseAdmin: createTestSupabaseClient() }
    );

    await requestPasswordReset(
      { email },
      { supabase: createTestSupabaseClient(), redirectTo: "http://127.0.0.1:3000/reset-password" }
    );

    const messages = await findMailpitMessagesTo(email);
    // One message from signUp's confirmation email, a second from the reset request.
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });
});
