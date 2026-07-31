import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RateForm } from "./RateForm";

export default async function RatePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 justify-center p-[16px]">
      <div className="w-full max-w-lg py-[28px]">
        <h1 className="mb-[16px] font-heading text-[22px] font-bold text-text-primary">
          Add a rating
        </h1>
        <RateForm />
      </div>
    </main>
  );
}
