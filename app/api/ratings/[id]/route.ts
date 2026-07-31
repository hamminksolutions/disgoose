import { NextRequest, NextResponse } from "next/server";
import { getRatingDetail } from "@/lib/ratings/getRatingDetail";
import { updateRating } from "@/lib/ratings/updateRating";
import { deleteRating } from "@/lib/ratings/deleteRating";
import type { ListenMethod } from "@/lib/ratings/upsertRating";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function requireUser(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(await createServerSupabaseClient());
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const detail = await getRatingDetail(id, user.id, { supabase: createAdminSupabaseClient() });
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ rating: detail });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(await createServerSupabaseClient());
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    score?: number;
    listenMethod?: ListenMethod;
    reviewText?: string | null;
  };

  try {
    const rating = await updateRating(id, user.id, body, {
      supabase: createAdminSupabaseClient(),
    });
    return NextResponse.json({ rating });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update rating" },
      { status: 400 }
    );
  }
}

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
    await deleteRating(id, user.id, { supabase: createAdminSupabaseClient() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete rating" },
      { status: 400 }
    );
  }
}
