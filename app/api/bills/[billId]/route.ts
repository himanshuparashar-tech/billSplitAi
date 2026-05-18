import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: { billId: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is required." }, { status: 400 });
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

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("id, status, house_id")
    .eq("id", params.billId)
    .maybeSingle();

  if (billError) {
    return NextResponse.json({ error: billError.message }, { status: 400 });
  }

  if (!bill) {
    return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  }

  if (bill.status !== "draft") {
    return NextResponse.json({ error: "Only draft bills can be deleted." }, { status: 409 });
  }

  const { data: house } = await supabase
    .from("houses")
    .select("id")
    .eq("id", bill.house_id)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!house) {
    return NextResponse.json({ error: "Not authorized to delete this bill." }, { status: 403 });
  }

  await Promise.all([
    supabase.from("motor_readings").delete().eq("bill_id", bill.id),
    supabase.from("readings").delete().eq("bill_id", bill.id),
    supabase.from("bill_results").delete().eq("bill_id", bill.id)
  ]);

  const { error: deleteError } = await supabase.from("bills").delete().eq("id", bill.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
