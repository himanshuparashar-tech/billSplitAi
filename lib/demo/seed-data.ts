import { subMonths } from "date-fns";

import { calculateBillSummary } from "@/lib/billing";
import { monthInputValue } from "@/lib/utils";
import type {
  Bill,
  BillResult,
  BillSnapshot,
  House,
  Member,
  ReadingRecord,
  Viewer
} from "@/types";

const today = new Date();
const seedMonths = [subMonths(today, 2), subMonths(today, 1), today].map(monthInputValue);

export const demoViewer: Viewer = {
  id: "demo-user",
  email: "demo@splitbill.ai",
  name: "Demo Admin",
  isDemo: true
};

export const demoHouse: House = {
  id: "house-pitru-chaya",
  name: "Pitru Chaya",
  owner_user_id: demoViewer.id,
  created_at: new Date().toISOString()
};

export const demoMembers: Member[] = [
  { id: "member-ashu", house_id: demoHouse.id, name: "Ashu", is_active: true },
  { id: "member-jay", house_id: demoHouse.id, name: "Jay", is_active: true },
  { id: "member-bhaiya", house_id: demoHouse.id, name: "Bhaiya", is_active: true },
  { id: "member-aunty", house_id: demoHouse.id, name: "Aunty", is_active: true }
];

const demoReadingsByMonth = [
  {
    month: seedMonths[0],
    mainBillAmount: 7860,
    totalUnits: 1682,
    motorPreviousReading: 144,
    motorCurrentReading: 216,
    readings: [
      { memberId: "member-ashu", previousReading: 812, currentReading: 1110 },
      { memberId: "member-jay", previousReading: 692, currentReading: 938 },
      { memberId: "member-bhaiya", previousReading: 544, currentReading: 746 },
      { memberId: "member-aunty", previousReading: 466, currentReading: 634 }
    ]
  },
  {
    month: seedMonths[1],
    mainBillAmount: 8645,
    totalUnits: 1824,
    motorPreviousReading: 216,
    motorCurrentReading: 301,
    readings: [
      { memberId: "member-ashu", previousReading: 1110, currentReading: 1468 },
      { memberId: "member-jay", previousReading: 938, currentReading: 1214 },
      { memberId: "member-bhaiya", previousReading: 746, currentReading: 971 },
      { memberId: "member-aunty", previousReading: 634, currentReading: 795 }
    ]
  },
  {
    month: seedMonths[2],
    mainBillAmount: 8350,
    totalUnits: 1768,
    motorPreviousReading: 301,
    motorCurrentReading: 378,
    readings: [
      { memberId: "member-ashu", previousReading: 1468, currentReading: 1732 },
      { memberId: "member-jay", previousReading: 1214, currentReading: 1498 },
      { memberId: "member-bhaiya", previousReading: 971, currentReading: 1179 },
      { memberId: "member-aunty", previousReading: 795, currentReading: 980 }
    ]
  }
];

function buildDemoSnapshots() {
  const bills: Bill[] = [];
  const results: BillResult[] = [];
  const readings: ReadingRecord[] = [];

  for (const item of demoReadingsByMonth) {
    const calculation = calculateBillSummary({
      houseId: demoHouse.id,
      billingMonth: item.month,
      mainBillAmount: item.mainBillAmount,
      totalUnits: item.totalUnits,
      motorPreviousReading: item.motorPreviousReading,
      motorCurrentReading: item.motorCurrentReading,
      readings: item.readings
    });

    const billId = `bill-${item.month}`;

    bills.push({
      id: billId,
      house_id: demoHouse.id,
      billing_month: item.month,
      status: "finalized",
      main_bill_amount: item.mainBillAmount,
      total_units: item.totalUnits,
      price_per_unit: calculation.pricePerUnit,
      motor_previous_reading: item.motorPreviousReading,
      motor_current_reading: item.motorCurrentReading,
      motor_units: calculation.motorUnits,
      finalized_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    for (const reading of calculation.readings) {
      const member = demoMembers.find((entry) => entry.id === reading.memberId)!;
      readings.push({
        id: `${billId}-${reading.memberId}`,
        bill_id: billId,
        house_id: demoHouse.id,
        member_id: reading.memberId,
        member_name: member.name,
        previous_reading: reading.previousReading,
        current_reading: reading.currentReading,
        units: reading.units,
        meter_photo_path: null,
        meter_photo_url: null
      });
    }

    for (const result of calculation.results) {
      const member = demoMembers.find((entry) => entry.id === result.member_id)!;
      results.push({
        id: `${billId}-result-${result.member_id}`,
        bill_id: billId,
        member_id: result.member_id,
        member_name_snapshot: member.name,
        member_units: result.member_units,
        motor_share_units: result.motor_share_units,
        final_units: result.final_units,
        bill_amount: result.bill_amount
      });
    }
  }

  return { bills, results, readings };
}

const demoArtifacts = buildDemoSnapshots();

export const demoBills = demoArtifacts.bills;
export const demoResults = demoArtifacts.results;
export const demoReadings = demoArtifacts.readings;

export function getDemoBillSnapshot(billId: string): BillSnapshot | null {
  const bill = demoBills.find((entry) => entry.id === billId);

  if (!bill) {
    return null;
  }

  return {
    ...bill,
    house: demoHouse,
    members: demoMembers,
    readings: demoReadings.filter((entry) => entry.bill_id === bill.id),
    results: demoResults.filter((entry) => entry.bill_id === bill.id)
  };
}

