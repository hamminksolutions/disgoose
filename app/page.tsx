import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getProfileGrid } from "@/lib/ratings/getProfileGrid";
import { getRatingStats } from "@/lib/ratings/getRatingStats";
import type { SortBy } from "@/lib/ratings/getAllRatings";
import { getPendingRequests } from "@/lib/friendships/getPendingRequests";
import { ProfileGrid } from "./ProfileGrid";
import { ProfileHeader } from "./ProfileHeader";
import { logoutAction } from "./logout/actions";
import { FriendRequestsBell } from "./FriendRequestsBell";
import { TopNav } from "./TopNav";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string }>;
}) {
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

  const admin = createAdminSupabaseClient();
  const [{ data: profile }, grid, stats, pendingRequests] = await Promise.all([
    admin.from("users").select("username, created_at").eq("id", user.id).single(),
    getProfileGrid(user.id, { supabase: admin }),
    getRatingStats(user.id, { supabase: admin }),
    getPendingRequests(user.id, { supabase: admin }),
  ]);

  const params = await searchParams;
  const sortBy: SortBy = params.sortBy === "highest_rated" ? "highest_rated" : "newest";
  const sortedGrid =
    sortBy === "highest_rated" ? [...grid].sort((a, b) => b.score - a.score) : grid;

  const collectingSince = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : null;

  return (
    <>
      <TopNav active="profile" />
      <main className="flex flex-1 flex-col items-center gap-[18px] p-[28px]">
        <FriendRequestsBell initialRequests={pendingRequests} />

        <div className="flex w-full max-w-2xl items-center justify-between">
          <p className="font-heading text-[18px] font-semibold text-text-primary">
            {profile?.username ?? user.email}
          </p>
          <form action={logoutAction}>
            <button className="text-[13px] text-text-muted" type="submit">
              Log out
            </button>
          </form>
        </div>

        {profile?.username && (
          <ProfileHeader username={profile.username} collectingSince={collectingSince} stats={stats} />
        )}

        {sortedGrid.length > 0 && (
          <div className="flex w-full max-w-2xl items-center justify-between">
            <p className="font-heading text-[16px] font-bold text-text-secondary">Grid</p>
            <div className="flex gap-[6px] rounded-full border border-border bg-surface p-[6px]">
              <Link
                href="/?sortBy=newest"
                className={`rounded-full px-[14px] py-[7px] text-[13px] font-semibold ${
                  sortBy === "newest" ? "bg-accent text-canvas" : "text-text-secondary"
                }`}
              >
                New
              </Link>
              <Link
                href="/?sortBy=highest_rated"
                className={`rounded-full px-[14px] py-[7px] text-[13px] font-semibold ${
                  sortBy === "highest_rated" ? "bg-accent text-canvas" : "text-text-secondary"
                }`}
              >
                Highest rated
              </Link>
            </div>
          </div>
        )}

        <ProfileGrid entries={sortedGrid} />
      </main>
    </>
  );
}
