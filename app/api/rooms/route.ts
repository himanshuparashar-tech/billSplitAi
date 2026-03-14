import { NextResponse } from "next/server";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  houseId: z.string().min(1),
  name: z.string().min(1).max(80)
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is required to add rooms." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const { data: house } = await supabase
    .from("houses")
    .select("id")
    .eq("id", parsed.data.houseId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!house) {
    return NextResponse.json({ error: "House not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("rooms")
    .insert({ house_id: parsed.data.houseId, name: parsed.data.name.trim(), is_active: true })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id });
}
