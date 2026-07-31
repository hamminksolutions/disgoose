import { randomUUID } from "node:crypto";
import { registerUser } from "./registerUser";
import { createTestSupabaseClient } from "../supabase/testClient";

export async function createTestUser() {
  const supabaseAdmin = createTestSupabaseClient();
  const username = `user_${randomUUID().slice(0, 8)}`;
  const { userId } = await registerUser(
    { email: `${randomUUID()}@example.test`, password: "correct-horse-battery-staple", username },
    { supabase: createTestSupabaseClient(), supabaseAdmin }
  );
  return { userId, username };
}
