import { z } from "zod";

import type { BillResult, ReadingInput } from "@/types";

export const billPayloadSchema = z.object({
  houseId: z.string().min(1),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/),
  mainBillAmount: z.number().positive(),
  totalUnits: z.number().positive(),
  motorPreviousReading: z.number().min(0),
  motorCurrentReading: z.number().min(0),
  readings: z
    .array(
      z.object({
        memberId: z.string().min(1),
        previousReading: z.number().min(0),
        currentReading: z.number().min(0),
        daysStayed: z.number().int().min(1).max(31).optional(),
        meterPhotoPath: z.string().nullable().optional(),
        meterPhotoUrl: z.string().nullable().optional()
      })
    )
    .min(1)
});

export interface CalculatedReading extends ReadingInput {
  units: number;
  daysStayed: number;
}

export interface CalculationOutput {
  pricePerUnit: number;
  motorUnits: number;
  totalDaysInMonth: number;
  motorSharePerFullMonth: number;
  readings: CalculatedReading[];
  results: Array<
    Pick<
      BillResult,
      "member_id" | "member_units" | "motor_share_units" | "final_units" | "bill_amount"
    >
  >;
  totalTrackedUnits: number;
  differenceUnits: number;
}

function getDaysInMonth(billingMonth: string): number {
  const [year, month] = billingMonth.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function calculateBillSummary(
  payload: Omit<z.infer<typeof billPayloadSchema>, "readings"> & {
    readings: ReadingInput[];
  }
): CalculationOutput {
  const totalDaysInMonth = getDaysInMonth(payload.billingMonth);

  const readings = payload.readings.map((reading) => {
    const units = Number((reading.currentReading - reading.previousReading).toFixed(2));

    if (units < 0) {
      throw new Error("Current reading must be greater than or equal to previous reading.");
    }

    return {
      ...reading,
      units,
      daysStayed: reading.daysStayed ?? totalDaysInMonth
    };
  });

  const motorUnits = Number(
    (payload.motorCurrentReading - payload.motorPreviousReading).toFixed(2)
  );

  if (motorUnits < 0) {
    throw new Error("Motor current reading must be greater than or equal to previous reading.");
  }

  const pricePerUnit = Number((payload.mainBillAmount / payload.totalUnits).toFixed(4));

  // Pro-rate motor share by person-days so mid-month joiners pay less
  const totalPersonDays = readings.reduce((sum, r) => sum + r.daysStayed, 0);

  const results = readings.map((reading) => {
    const motorShareUnits =
      totalPersonDays > 0
        ? Number(((motorUnits * reading.daysStayed) / totalPersonDays).toFixed(4))
        : Number((motorUnits / readings.length).toFixed(4));

    const finalUnits = Number((reading.units + motorShareUnits).toFixed(4));
    const billAmount = Number((finalUnits * pricePerUnit).toFixed(2));

    return {
      member_id: reading.memberId,
      member_units: reading.units,
      motor_share_units: motorShareUnits,
      final_units: finalUnits,
      bill_amount: billAmount
    };
  });

  const totalTrackedUnits = Number(
    results.reduce((sum, item) => sum + item.final_units, 0).toFixed(2)
  );

  const differenceUnits = Number((payload.totalUnits - totalTrackedUnits).toFixed(2));

  // What a full-month room would pay (reference value for display)
  const effectiveRooms = totalPersonDays / totalDaysInMonth;
  const motorSharePerFullMonth =
    effectiveRooms > 0
      ? Number((motorUnits / effectiveRooms).toFixed(4))
      : Number((motorUnits / readings.length).toFixed(4));

  return {
    pricePerUnit,
    motorUnits,
    totalDaysInMonth,
    motorSharePerFullMonth,
    readings,
    results,
    totalTrackedUnits,
    differenceUnits
  };
}
