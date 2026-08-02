import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AvatarUpload } from "../AvatarUpload";
import { DeleteAccountButton } from "../DeleteAccountButton";
import { TopNav } from "../TopNav";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("users")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <>
      <TopNav active="settings" />
      <main className="flex flex-1 justify-center p-[16px]">
        <div className="flex w-full max-w-2xl flex-col gap-[28px] py-[28px]">
          <h1 className="font-heading text-[22px] font-bold text-text-primary">Settings</h1>

          {profile?.username && (
            <AvatarUpload
              userId={user.id}
              username={profile.username}
              initialAvatarUrl={profile.avatar_url}
            />
          )}

          <DeleteAccountButton />
        </div>
      </main>
    </>
  );
}
