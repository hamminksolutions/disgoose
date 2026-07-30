import type { Session, SupabaseClient } from "@supabase/supabase-js";

export type RegisterUserInput = {
  email: string;
  password: string;
  username: string;
};

export type RegisterUserResult = {
  userId: string;
  session: Session | null;
};

export async function registerUser(
  { email, password, username }: RegisterUserInput,
  {
    supabase,
    supabaseAdmin,
  }: {
    /** Drives the auth flow (signUp/signInWithPassword); its session becomes the returned session. */
    supabase: SupabaseClient;
    /**
     * A separate, session-untouched service_role client for privileged
     * writes (the users-table insert and auth.admin.* calls). Required
     * because signUp/signInWithPassword attach the new user's JWT to
     * `supabase`'s session, which downgrades any later .from() call on
     * that same client instance to the "authenticated" role.
     */
    supabaseAdmin: SupabaseClient;
  }
): Promise<RegisterUserResult> {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpError || !signUpData.user) {
    throw signUpError ?? new Error("Sign up did not return a user");
  }
  const userId = signUpData.user.id;

  // Auto-confirm so sign-in works immediately; the confirmation email
  // triggered by signUp above still goes out (see supabase/config.toml).
  await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });

  const { error: profileError } = await supabaseAdmin
    .from("users")
    .insert({ id: userId, email, username });
  if (profileError) {
    // Don't leave an orphaned auth user behind — it would permanently
    // block this email from ever registering again.
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error(`Could not create user profile: ${profileError.message}`);
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    throw signInError;
  }

  return { userId, session: signInData.session };
}
