import { randomUUID } from "node:crypto";
import { registerUser } from "./registerUser";
import { createTestSupabaseClient, confirmTestUserEmail } from "../supabase/testClient";

export async function createTestUser() {
  const supabaseAdmin = createTestSupabaseClient();
  const username = `user_${randomUUID().slice(0, 8)}`;
  const { userId } = await registerUser(
    { email: `${randomUUID()}@example.test`, password: "correct-horse-battery-staple", username },
    { supabase: createTestSupabaseClient(), supabaseAdmin }
  );
  return { userId, username };
}

/** Like createTestUser, but confirmed and with its credentials returned for a real loginUser call. */
export async function createConfirmedTestUser() {
  const supabaseAdmin = createTestSupabaseClient();
  const email = `${randomUUID()}@example.test`;
  const password = "correct-horse-battery-staple";
  const username = `user_${randomUUID().slice(0, 8)}`;
  const { userId } = await registerUser(
    { email, password, username },
    { supabase: createTestSupabaseClient(), supabaseAdmin }
  );
  await confirmTestUserEmail(supabaseAdmin, userId);
  return { userId, username, email, password };
}
