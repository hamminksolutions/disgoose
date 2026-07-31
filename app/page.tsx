import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logoutAction } from "./logout/actions";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center p-[16px]">
        <div className="flex flex-col items-center gap-[16px] text-center">
          <h1 className="font-heading text-[26px] font-bold text-text-primary">Disgoose</h1>
          <p className="text-[14px] text-text-secondary">
            Rate albums, see your taste as a grid of covers.
          </p>
          <div className="flex gap-[12px]">
            <Link
              href="/login"
              className="rounded-md border border-border px-[16px] py-[10px] text-[14px] text-text-primary"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-accent px-[16px] py-[10px] text-[14px] font-semibold text-canvas"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: profile } = await createAdminSupabaseClient()
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex flex-1 flex-col items-center gap-[16px] p-[28px]">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <p className="font-heading text-[18px] font-semibold text-text-primary">
          Welcome, {profile?.username ?? user.email}
        </p>
        <form action={logoutAction}>
          <button className="text-[13px] text-text-muted" type="submit">
            Log out
          </button>
        </form>
      </div>
      <Link
        href="/rate"
        className="rounded-md bg-accent px-[16px] py-[10px] text-[14px] font-semibold text-canvas"
      >
        Add a rating
      </Link>
    </main>
  );
}
