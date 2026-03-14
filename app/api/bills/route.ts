import { NextResponse } from "next/server";
import { z } from "zod";

import { billPayloadSchema, calculateBillSummary } from "@/lib/billing";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = billPayloadSchema.extend({
  mode: z.enum(["draft", "finalize"])
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is required to save bills." }, { status: 400 });
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

  const payload = parsed.data;
  const { data: house } = await supabase
    .from("houses")
    .select("id")
    .eq("id", payload.houseId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!house) {
    return NextResponse.json({ error: "House not found" }, { status: 404 });
  }

  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("house_id", payload.houseId)
    .order("name", { ascending: true });

  if (roomsError) {
    return NextResponse.json({ error: roomsError.message }, { status: 400 });
  }

  const roomMap = new Map((rooms ?? []).map((room) => [room.id, room.name]));

  if (payload.readings.some((reading) => !roomMap.has(reading.memberId))) {
    return NextResponse.json({ error: "One or more readings reference invalid rooms." }, { status: 400 });
  }

  let calculation;

  try {
    calculation = calculateBillSummary(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to calculate bill." },
      { status: 400 }
    );
  }

  const { data: existingBill, error: existingError } = await supabase
    .from("bills")
    .select("id, status")
    .eq("house_id", payload.houseId)
    .eq("billing_month", payload.billingMonth)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 400 });
  }

  if (existingBill?.status === "finalized") {
    return NextResponse.json(
      { error: "This month is finalized. Reopen it before editing." },
      { status: 409 }
    );
  }

  const billRecord = {
    house_id: payload.houseId,
    billing_month: payload.billingMonth,
    status: payload.mode === "finalize" ? "finalized" : "draft",
    main_bill_amount: payload.mainBillAmount,
    total_units: payload.totalUnits,
    price_per_unit: calculation.pricePerUnit,
    motor_previous_reading: payload.motorPreviousReading,
    motor_current_reading: payload.motorCurrentReading,
    motor_units: calculation.motorUnits,
    finalized_at: payload.mode === "finalize" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };

  let billId = existingBill?.id;

  if (billId) {
    const { error } = await supabase.from("bills").update(billRecord).eq("id", billId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } else {
    const { data, error } = await supabase
      .from("bills")
      .insert({ ...billRecord, created_at: new Date().toISOString() })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    billId = data.id;
  }

  const deleteResults = await Promise.all([
    supabase.from("motor_readings").delete().eq("bill_id", billId),
    supabase.from("readings").delete().eq("bill_id", billId),
    supabase.from("bill_results").delete().eq("bill_id", billId)
  ]);

  const deleteError = deleteResults.find((result) => result.error)?.error;
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  const { error: motorError } = await supabase.from("motor_readings").insert({
    bill_id: billId,
    house_id: payload.houseId,
    billing_month: payload.billingMonth,
    previous_reading: payload.motorPreviousReading,
    current_reading: payload.motorCurrentReading,
    units: calculation.motorUnits
  });

  if (motorError) {
    return NextResponse.json({ error: motorError.message }, { status: 400 });
  }

  const readingsRows = calculation.readings.map((reading) => ({
    bill_id: billId,
    house_id: payload.houseId,
    room_id: reading.memberId,
    previous_reading: reading.previousReading,
    current_reading: reading.currentReading,
    units: reading.units,
    meter_photo_path: reading.meterPhotoPath ?? null,
    meter_photo_url: reading.meterPhotoUrl ?? null
  }));

  const { error: readingError } = await supabase.from("readings").insert(readingsRows);

  if (readingError) {
    return NextResponse.json({ error: readingError.message }, { status: 400 });
  }

  if (payload.mode === "finalize") {
    const resultRows = calculation.results.map((result) => ({
      bill_id: billId,
      room_id: result.member_id,
      room_name_snapshot: roomMap.get(result.member_id),
      room_units: result.member_units,
      motor_share_units: result.motor_share_units,
      final_units: result.final_units,
      bill_amount: result.bill_amount
    }));

    const { error: resultError } = await supabase.from("bill_results").insert(resultRows);

    if (resultError) {
      return NextResponse.json({ error: resultError.message }, { status: 400 });
    }
  }

  return NextResponse.json({
    billId,
    mode: payload.mode,
    pricePerUnit: calculation.pricePerUnit,
    differenceUnits: calculation.differenceUnits
  });
}
