import { subMonths } from "date-fns";

import { calculateBillSummary } from "@/lib/billing";
import { monthInputValue } from "@/lib/utils";

const seedMonths = [subMonths(new Date(), 2), subMonths(new Date(), 1), new Date()].map(monthInputValue);

const roomNames = ["Ashu", "Jay", "Bhaiya", "Aunty"];

const monthlySeed = [
  {
    month: seedMonths[0],
    mainBillAmount: 7860,
    totalUnits: 1682,
    motorPreviousReading: 144,
    motorCurrentReading: 216,
    readings: [
      { roomName: "Ashu", previousReading: 812, currentReading: 1110 },
      { roomName: "Jay", previousReading: 692, currentReading: 938 },
      { roomName: "Bhaiya", previousReading: 544, currentReading: 746 },
      { roomName: "Aunty", previousReading: 466, currentReading: 634 }
    ]
  },
  {
    month: seedMonths[1],
    mainBillAmount: 8645,
    totalUnits: 1824,
    motorPreviousReading: 216,
    motorCurrentReading: 301,
    readings: [
      { roomName: "Ashu", previousReading: 1110, currentReading: 1468 },
      { roomName: "Jay", previousReading: 938, currentReading: 1214 },
      { roomName: "Bhaiya", previousReading: 746, currentReading: 971 },
      { roomName: "Aunty", previousReading: 634, currentReading: 795 }
    ]
  },
  {
    month: seedMonths[2],
    mainBillAmount: 8350,
    totalUnits: 1768,
    motorPreviousReading: 301,
    motorCurrentReading: 378,
    readings: [
      { roomName: "Ashu", previousReading: 1468, currentReading: 1732 },
      { roomName: "Jay", previousReading: 1214, currentReading: 1498 },
      { roomName: "Bhaiya", previousReading: 971, currentReading: 1179 },
      { roomName: "Aunty", previousReading: 795, currentReading: 980 }
    ]
  }
];

export async function ensureSeedData(supabase: any, ownerUserId: string) {
  const { count, error: countError } = await supabase
    .from("houses")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", ownerUserId);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { data: house, error: houseError } = await supabase
    .from("houses")
    .insert({ owner_user_id: ownerUserId, name: "Pitru Chaya" })
    .select("id")
    .single();

  if (houseError) {
    throw new Error(houseError.message);
  }

  const { error: roomsError } = await supabase.from("rooms").upsert(
    roomNames.map((name) => ({ house_id: house.id, name, is_active: true })),
    { onConflict: "house_id,name" }
  );

  if (roomsError) {
    throw new Error(roomsError.message);
  }

  const { data: rooms, error: fetchRoomsError } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("house_id", house.id)
    .order("name", { ascending: true });

  if (fetchRoomsError) {
    throw new Error(fetchRoomsError.message);
  }

  const roomMap = new Map<string, string>(
    (rooms ?? []).map((room: { id: string; name: string }) => [room.name, room.id])
  );

  for (const item of monthlySeed) {
    const calculation = calculateBillSummary({
      houseId: house.id,
      billingMonth: item.month,
      mainBillAmount: item.mainBillAmount,
      totalUnits: item.totalUnits,
      motorPreviousReading: item.motorPreviousReading,
      motorCurrentReading: item.motorCurrentReading,
      readings: item.readings.map((reading) => ({
        memberId: roomMap.get(reading.roomName) ?? "",
        previousReading: reading.previousReading,
        currentReading: reading.currentReading
      }))
    });

    const { data: bill, error: billError } = await supabase
      .from("bills")
      .upsert(
        {
          house_id: house.id,
          billing_month: item.month,
          status: "finalized",
          main_bill_amount: item.mainBillAmount,
          total_units: item.totalUnits,
          price_per_unit: calculation.pricePerUnit,
          motor_previous_reading: item.motorPreviousReading,
          motor_current_reading: item.motorCurrentReading,
          motor_units: calculation.motorUnits,
          finalized_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: "house_id,billing_month" }
      )
      .select("id")
      .single();

    if (billError) {
      throw new Error(billError.message);
    }

    await supabase.from("motor_readings").delete().eq("bill_id", bill.id);
    await supabase.from("readings").delete().eq("bill_id", bill.id);
    await supabase.from("bill_results").delete().eq("bill_id", bill.id);

    const { error: motorError } = await supabase.from("motor_readings").insert({
      bill_id: bill.id,
      house_id: house.id,
      billing_month: item.month,
      previous_reading: item.motorPreviousReading,
      current_reading: item.motorCurrentReading,
      units: calculation.motorUnits
    });

    if (motorError) {
      throw new Error(motorError.message);
    }

    const readingRows = calculation.readings.map((reading) => ({
      bill_id: bill.id,
      house_id: house.id,
      room_id: reading.memberId,
      previous_reading: reading.previousReading,
      current_reading: reading.currentReading,
      units: reading.units,
      meter_photo_path: null,
      meter_photo_url: null
    }));

    const { error: readingsError } = await supabase.from("readings").insert(readingRows);

    if (readingsError) {
      throw new Error(readingsError.message);
    }

    const resultRows = calculation.results.map((result) => ({
      bill_id: bill.id,
      room_id: result.member_id,
      room_name_snapshot: [...roomMap.entries()].find(([, id]) => id === result.member_id)?.[0] ?? "Room",
      room_units: result.member_units,
      motor_share_units: result.motor_share_units,
      final_units: result.final_units,
      bill_amount: result.bill_amount
    }));

    const { error: resultsError } = await supabase.from("bill_results").insert(resultRows);

    if (resultsError) {
      throw new Error(resultsError.message);
    }
  }
}

