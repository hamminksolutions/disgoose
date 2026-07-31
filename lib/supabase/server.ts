import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Session-bound client for Server Components, Server Actions, and Route Handlers. */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Safe to ignore: proxy.ts refreshes the session on every
            // request, so Server Actions/Route Handlers still see fresh
            // cookies even though this particular write was dropped.
          }
        },
      },
    }
  );
}
