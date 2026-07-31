"use server";

import { sendFriendRequest } from "@/lib/friendships/sendFriendRequest";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type SendFriendRequestState = { error: string | null; sent: boolean };

export async function sendFriendRequestAction(
  _prevState: SendFriendRequestState,
  formData: FormData
): Promise<SendFriendRequestState> {
  const username = String(formData.get("username") ?? "");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not logged in", sent: false };
  }

  try {
    await sendFriendRequest(
      { requesterId: user.id, addresseeUsername: username },
      { supabase: createAdminSupabaseClient() }
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not send request", sent: false };
  }

  return { error: null, sent: true };
}
