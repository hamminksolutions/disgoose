import type { Session, SupabaseClient } from "@supabase/supabase-js";

export type LoginUserInput = {
  email: string;
  password: string;
};

export type LoginUserResult = {
  session: Session | null;
};

export async function loginUser(
  { email, password }: LoginUserInput,
  { supabase }: { supabase: SupabaseClient }
): Promise<LoginUserResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
  return { session: data.session };
}
