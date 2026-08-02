import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

  return (
    <>
      <TopNav active="settings" />
      <main className="flex flex-1 justify-center p-[16px]">
        <div className="flex w-full max-w-2xl flex-col gap-[18px] py-[28px]">
          <h1 className="font-heading text-[22px] font-bold text-text-primary">Settings</h1>

          <DeleteAccountButton />
        </div>
      </main>
    </>
  );
}
