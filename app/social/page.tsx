import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getFriends } from "@/lib/friendships/getFriends";
import { AddFriendForm } from "../AddFriendForm";
import { FriendsList } from "../FriendsList";
import { TopNav } from "../TopNav";

export default async function SocialPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const friends = await getFriends(user.id, { supabase: createAdminSupabaseClient() });

  return (
    <>
      <TopNav active="social" />
      <main className="flex flex-1 justify-center p-[16px]">
        <div className="flex w-full max-w-2xl flex-col gap-[18px] py-[28px]">
          <h1 className="font-heading text-[22px] font-bold text-text-primary">Social</h1>

          <AddFriendForm />

          {friends.length === 0 ? (
            <p className="text-[13px] text-text-muted">No friends yet — add one above.</p>
          ) : (
            <FriendsList initialFriends={friends} />
          )}
        </div>
      </main>
    </>
  );
}
