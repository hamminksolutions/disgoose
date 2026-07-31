import { NextRequest, NextResponse } from "next/server";
import { acceptFriendRequest } from "@/lib/friendships/acceptFriendRequest";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const friendship = await acceptFriendRequest(id, user.id, {
      supabase: createAdminSupabaseClient(),
    });
    return NextResponse.json({ friendship });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not accept friend request" },
      { status: 400 }
    );
  }
}
