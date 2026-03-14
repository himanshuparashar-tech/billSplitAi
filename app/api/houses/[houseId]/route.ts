import { NextResponse } from "next/server";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  name: z.string().min(2).max(80)
});

async function getAuthorizedHouse(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, houseId: string) {
  const {
    data: { user }
  } = await supabase!.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: house, error } = await supabase!
    .from("houses")
    .select("id")
    .eq("id", houseId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ error: error.message }, { status: 400 }) };
  }

  if (!house) {
    return { error: NextResponse.json({ error: "House not found" }, { status: 404 }) };
  }

  return { house };
}

export async function PATCH(
  request: Request,
  { params }: { params: { houseId: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is required to update houses." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const authorized = await getAuthorizedHouse(supabase, params.houseId);

  if (authorized.error) {
    return authorized.error;
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const { error } = await supabase!
    .from("houses")
    .update({ name: parsed.data.name.trim() })
    .eq("id", params.houseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { houseId: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is required to delete houses." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const authorized = await getAuthorizedHouse(supabase, params.houseId);

  if (authorized.error) {
    return authorized.error;
  }

  const { error } = await supabase!.from("houses").delete().eq("id", params.houseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
