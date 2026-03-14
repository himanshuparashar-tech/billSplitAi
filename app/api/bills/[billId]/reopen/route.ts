import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: { billId: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is required to reopen bills." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase!.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: bill } = await supabase!
    .from("bills")
    .select("id, house_id")
    .eq("id", params.billId)
    .maybeSingle();

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const { data: house } = await supabase!
    .from("houses")
    .select("id")
    .eq("id", bill.house_id)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!house) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase!
    .from("bills")
    .update({ status: "draft", finalized_at: null, updated_at: new Date().toISOString() })
    .eq("id", params.billId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase!.from("bill_results").delete().eq("bill_id", params.billId);

  return NextResponse.json({ ok: true });
}
