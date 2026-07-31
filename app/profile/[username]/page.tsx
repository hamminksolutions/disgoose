import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { findUserByUsername } from "@/lib/users/findUserByUsername";
import { getProfileGrid } from "@/lib/ratings/getProfileGrid";
import { ProfileGrid } from "../../ProfileGrid";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const admin = createAdminSupabaseClient();

  const profileUser = await findUserByUsername(username, { supabase: admin });
  if (!profileUser) {
    notFound();
  }

  const grid = await getProfileGrid(profileUser.id, { supabase: admin });

  return (
    <main className="flex flex-1 flex-col items-center gap-[18px] p-[28px]">
      <p className="font-heading text-[18px] font-semibold text-text-primary">
        {profileUser.username}
      </p>

      <ProfileGrid entries={grid} readOnly />
    </main>
  );
}
