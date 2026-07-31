import { NextRequest, NextResponse } from "next/server";
import { removeFriendship } from "@/lib/friendships/removeFriendship";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function requireUser(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Declines a pending request, or ends an accepted friendship — same operation either way. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(await createServerSupabaseClient());
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await removeFriendship(id, user.id, { supabase: createAdminSupabaseClient() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not remove friendship" },
      { status: 400 }
    );
  }
}
