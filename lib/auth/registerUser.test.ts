import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { registerUser } from "./registerUser";
import { createTestSupabaseClient } from "../supabase/testClient";

function buildAuthDeps() {
  // Two independent client instances: signUp/signInWithPassword on
  // `supabase` attach the new user's session, which would silently
  // downgrade `supabaseAdmin`'s privileges if they were the same object.
  return { supabase: createTestSupabaseClient(), supabaseAdmin: createTestSupabaseClient() };
}

async function findMailpitMessageTo(email: string) {
  const res = await fetch(
    `http://127.0.0.1:54324/api/v1/search?query=to:${encodeURIComponent(email)}`
  );
  const body = (await res.json()) as { messages: { To: { Address: string }[] }[] };
  return body.messages[0] ?? null;
}

describe("registerUser", () => {
  it("returns an active session immediately, with no email-confirmation gate", async () => {
    const email = `${randomUUID()}@example.test`;

    const result = await registerUser(
      { email, password: "correct-horse-battery-staple", username: `user_${randomUUID().slice(0, 8)}` },
      buildAuthDeps()
    );

    expect(result.session?.access_token).toBeTruthy();
  });

  it("sends a verification email that does not gate the returned session", async () => {
    const email = `${randomUUID()}@example.test`;

    await registerUser(
      { email, password: "correct-horse-battery-staple", username: `user_${randomUUID().slice(0, 8)}` },
      buildAuthDeps()
    );

    const message = await findMailpitMessageTo(email);
    expect(message).not.toBeNull();
  });

  it("rejects a duplicate username and leaves the email free to retry with a different one", async () => {
    const username = `taken_${randomUUID().slice(0, 8)}`;
    await registerUser(
      { email: `${randomUUID()}@example.test`, password: "correct-horse-battery-staple", username },
      buildAuthDeps()
    );

    const secondEmail = `${randomUUID()}@example.test`;
    await expect(
      registerUser(
        { email: secondEmail, password: "correct-horse-battery-staple", username },
        buildAuthDeps()
      )
    ).rejects.toThrow();

    // The failed attempt must not leave behind an orphaned, half-registered
    // auth user that would block this same email from ever registering.
    const retry = await registerUser(
      { email: secondEmail, password: "correct-horse-battery-staple", username: `${username}_2` },
      buildAuthDeps()
    );
    expect(retry.session?.access_token).toBeTruthy();
  });
});
