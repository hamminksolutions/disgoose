import { NextRequest, NextResponse } from "next/server";
import { sendFriendRequest } from "@/lib/friendships/sendFriendRequest";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { username } = body as { username: string };

  try {
    const friendship = await sendFriendRequest(
      { requesterId: user.id, addresseeUsername: username },
      { supabase: createAdminSupabaseClient() }
    );
    return NextResponse.json({ friendship });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send friend request" },
      { status: 400 }
    );
  }
}
