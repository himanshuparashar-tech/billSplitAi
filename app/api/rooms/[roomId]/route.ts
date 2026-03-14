import { NextResponse } from "next/server";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  name: z.string().min(1).max(80)
});

async function getAuthorizedRoom(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, roomId: string) {
  const {
    data: { user }
  } = await supabase!.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: room, error } = await supabase!
    .from("rooms")
    .select("id, house_id, name, is_active, houses!inner(owner_user_id)")
    .eq("id", roomId)
    .eq("houses.owner_user_id", user.id)
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ error: error.message }, { status: 400 }) };
  }

  if (!room) {
    return { error: NextResponse.json({ error: "Room not found" }, { status: 404 }) };
  }

  return { room };
}

export async function PATCH(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is required to update rooms." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const authorized = await getAuthorizedRoom(supabase, params.roomId);

  if (authorized.error) {
    return authorized.error;
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const { error } = await supabase!
    .from("rooms")
    .update({ name: parsed.data.name.trim() })
    .eq("id", params.roomId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { roomId: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is required to delete rooms." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const authorized = await getAuthorizedRoom(supabase, params.roomId);

  if (authorized.error) {
    return authorized.error;
  }

  const [readingUsage, resultUsage] = await Promise.all([
    supabase!
      .from("readings")
      .select("id", { count: "exact", head: true })
      .eq("room_id", params.roomId),
    supabase!
      .from("bill_results")
      .select("id", { count: "exact", head: true })
      .eq("room_id", params.roomId)
  ]);

  if (readingUsage.error || resultUsage.error) {
    return NextResponse.json(
      { error: readingUsage.error?.message ?? resultUsage.error?.message ?? "Unable to inspect room usage." },
      { status: 400 }
    );
  }

  const usageCount = (readingUsage.count ?? 0) + (resultUsage.count ?? 0);

  if (usageCount > 0) {
    const { error } = await supabase!
      .from("rooms")
      .update({ is_active: false })
      .eq("id", params.roomId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, mode: "archived" });
  }

  const { error } = await supabase!.from("rooms").delete().eq("id", params.roomId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, mode: "deleted" });
}
