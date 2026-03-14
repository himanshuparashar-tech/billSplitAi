import type {
  Bill,
  BillResult,
  BillSnapshot,
  DashboardInsight,
  DashboardMetric,
  House,
  Member,
  MemberUsagePoint,
  MonthlyUsagePoint,
  ReadingRecord,
  UsageSharePoint,
  Viewer
} from "@/types";
import {
  demoBills,
  demoHouse,
  demoMembers,
  demoResults,
  demoViewer,
  demoReadings,
  getDemoBillSnapshot
} from "@/lib/demo/seed-data";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureSeedData } from "@/lib/supabase/seed";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";

export interface DashboardData {
  viewer: Viewer;
  houses: House[];
  activeHouse: House | null;
  metrics: DashboardMetric[];
  insights: DashboardInsight[];
  barData: MemberUsagePoint[];
  lineData: MonthlyUsagePoint[];
  pieData: UsageSharePoint[];
  latestBill: BillSnapshot | null;
}

export interface HouseBillingData {
  viewer: Viewer;
  house: House | null;
  members: Member[];
  bills: Bill[];
  latestBill: BillSnapshot | null;
}

export interface HistoryData {
  viewer: Viewer;
  houses: House[];
  bills: Array<Bill & { house_name: string }>;
}

function normalizeHouse(row: any): House {
  return {
    id: row.id,
    name: row.name ?? row.house_name,
    owner_user_id: row.owner_user_id ?? null,
    created_at: row.created_at
  };
}

function sortByMonthDesc<T extends { billing_month: string }>(items: T[]) {
  return [...items].sort((left, right) => right.billing_month.localeCompare(left.billing_month));
}

function buildInsights(latestBill: BillSnapshot | null, previousBill: BillSnapshot | null): DashboardInsight[] {
  if (!latestBill || !latestBill.results.length) {
    return [
      {
        title: "Electricity Insights",
        detail: "Finalize your first month to unlock personalized usage insights.",
        tone: "neutral"
      }
    ];
  }

  const latestByUsage = [...latestBill.results].sort((left, right) => right.member_units - left.member_units);
  const topConsumer = latestByUsage[0];
  const insights: DashboardInsight[] = [
    {
      title: `${topConsumer.member_name_snapshot} consumed the highest electricity`,
      detail: `${topConsumer.member_units.toFixed(2)} units in ${formatMonthLabel(latestBill.billing_month)} before motor sharing was added.`,
      tone: "alert"
    }
  ];

  if (previousBill) {
    const change = latestBill.total_units - previousBill.total_units;
    const changePct = previousBill.total_units
      ? Math.abs((change / previousBill.total_units) * 100)
      : 0;

    insights.push({
      title:
        change >= 0
          ? `Total usage increased by ${changePct.toFixed(1)}% this month`
          : `Total usage dropped by ${changePct.toFixed(1)}% this month`,
      detail: `${formatMonthLabel(previousBill.billing_month)}: ${previousBill.total_units.toFixed(2)} units. ${formatMonthLabel(latestBill.billing_month)}: ${latestBill.total_units.toFixed(2)} units.`,
      tone: change >= 0 ? "alert" : "positive"
    });

    const previousMap = new Map(
      previousBill.results.map((result) => [result.member_name_snapshot, result.member_units])
    );

    const reductions = latestBill.results
      .map((result) => {
        const previousUnits = previousMap.get(result.member_name_snapshot);

        if (!previousUnits || previousUnits <= result.member_units) {
          return null;
        }

        const percentage = ((previousUnits - result.member_units) / previousUnits) * 100;

        return {
          name: result.member_name_snapshot,
          previousUnits,
          currentUnits: result.member_units,
          percentage
        };
      })
      .filter(Boolean)
      .sort((left, right) => (right?.percentage ?? 0) - (left?.percentage ?? 0));

    if (reductions.length) {
      const bestReduction = reductions[0]!;
      insights.push({
        title: `${bestReduction.name} reduced electricity usage by ${bestReduction.percentage.toFixed(1)}%`,
        detail: `${bestReduction.previousUnits.toFixed(2)} units last month, ${bestReduction.currentUnits.toFixed(2)} units this month.`,
        tone: "positive"
      });
    } else {
      insights.push({
        title: "No room reduced usage compared with last month",
        detail: "Review high-consumption rooms and compare them with the trend chart to spot where the increase is coming from.",
        tone: "neutral"
      });
    }
  } else {
    insights.push({
      title: "One more finalized month unlocks trend comparisons",
      detail: "Once another month is finalized, SplitBill AI will compare member-level changes automatically.",
      tone: "neutral"
    });
  }

  return insights;
}

async function getMotorReadingForBill(viewer: Viewer, billId: string) {
  if (viewer.isDemo) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("motor_readings")
    .select("previous_reading, current_reading, units")
    .eq("bill_id", billId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function getViewer(): Promise<Viewer | null> {
  if (!isSupabaseConfigured) {
    return demoViewer;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin",
    isDemo: false
  };
}

export async function getHousesForViewer(viewer: Viewer): Promise<House[]> {
  if (viewer.isDemo) {
    return [demoHouse];
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  let { data, error } = await supabase
    .from("houses")
    .select("id, name, owner_user_id, created_at")
    .eq("owner_user_id", viewer.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!(data ?? []).length) {
    await ensureSeedData(supabase, viewer.id);
    const seeded = await supabase
      .from("houses")
      .select("id, name, owner_user_id, created_at")
      .eq("owner_user_id", viewer.id)
      .order("created_at", { ascending: true });

    data = seeded.data;
    error = seeded.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(normalizeHouse);
}

export async function getMembersForHouse(
  viewer: Viewer,
  houseId: string,
  options?: { includeInactive?: boolean }
): Promise<Member[]> {
  if (viewer.isDemo) {
    const members = demoMembers.filter((member) => member.house_id === houseId);
    return options?.includeInactive ? members : members.filter((member) => member.is_active !== false);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("rooms")
    .select("id, house_id, name, is_active, created_at")
    .eq("house_id", houseId)
    .order("name", { ascending: true });

  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getBillsForHouse(viewer: Viewer, houseId: string): Promise<Bill[]> {
  if (viewer.isDemo) {
    return sortByMonthDesc(demoBills.filter((bill) => bill.house_id === houseId));
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("house_id", houseId)
    .order("billing_month", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function getReadingsForBill(viewer: Viewer, billId: string): Promise<ReadingRecord[]> {
  if (viewer.isDemo) {
    return demoReadings.filter((reading) => reading.bill_id === billId);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("readings")
    .select("id, bill_id, house_id, room_id, previous_reading, current_reading, units, meter_photo_path, meter_photo_url, rooms(name)")
    .eq("bill_id", billId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((reading: any) => ({
    id: reading.id,
    bill_id: reading.bill_id,
    house_id: reading.house_id,
    member_id: reading.room_id,
    member_name: reading.rooms?.name ?? undefined,
    previous_reading: reading.previous_reading,
    current_reading: reading.current_reading,
    units: reading.units,
    meter_photo_path: reading.meter_photo_path,
    meter_photo_url: reading.meter_photo_url
  }));
}

async function getResultsForBill(viewer: Viewer, billId: string): Promise<BillResult[]> {
  if (viewer.isDemo) {
    return demoResults.filter((result) => result.bill_id === billId);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("bill_results")
    .select("*")
    .eq("bill_id", billId)
    .order("room_name_snapshot", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((result: any) => ({
    id: result.id,
    bill_id: result.bill_id,
    member_id: result.room_id,
    member_name_snapshot: result.room_name_snapshot,
    member_units: result.room_units,
    motor_share_units: result.motor_share_units,
    final_units: result.final_units,
    bill_amount: result.bill_amount
  }));
}

export async function getBillSnapshotById(
  billId: string,
  options?: { publicAccess?: boolean; viewer?: Viewer | null }
): Promise<BillSnapshot | null> {
  if (!isSupabaseConfigured) {
    return getDemoBillSnapshot(billId);
  }

  const viewer = options?.viewer ?? (await getViewer());
  const serverViewer: Viewer = viewer ?? { id: "", email: "", name: "", isDemo: false };
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data: bill, error } = await supabase.from("bills").select("*").eq("id", billId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!bill) {
    return null;
  }

  if (options?.publicAccess && bill.status !== "finalized") {
    return null;
  }

  const { data: houseData, error: houseError } = await supabase
    .from("houses")
    .select("id, name, owner_user_id, created_at")
    .eq("id", bill.house_id)
    .maybeSingle();

  if (houseError) {
    throw new Error(houseError.message);
  }

  if (!houseData) {
    return null;
  }

  if (!options?.publicAccess && (!viewer || houseData.owner_user_id !== viewer.id)) {
    return null;
  }

  const [members, readings, results, motorReading] = await Promise.all([
    getMembersForHouse(serverViewer, bill.house_id, { includeInactive: true }),
    getReadingsForBill(serverViewer, bill.id),
    getResultsForBill(serverViewer, bill.id),
    getMotorReadingForBill(serverViewer, bill.id)
  ]);

  return {
    ...bill,
    motor_previous_reading: motorReading?.previous_reading ?? bill.motor_previous_reading,
    motor_current_reading: motorReading?.current_reading ?? bill.motor_current_reading,
    motor_units: motorReading?.units ?? bill.motor_units,
    house: normalizeHouse(houseData),
    members,
    readings,
    results
  };
}

export async function getDashboardData(selectedHouseId?: string): Promise<DashboardData> {
  const viewer = (await getViewer()) ?? demoViewer;
  const houses = await getHousesForViewer(viewer);
  const activeHouse = houses.find((house) => house.id === selectedHouseId) ?? houses[0] ?? null;

  if (!activeHouse) {
    return {
      viewer,
      houses,
      activeHouse: null,
      metrics: [
        { label: "Houses", value: "0", helper: "Create your first property" },
        { label: "Finalized months", value: "0", helper: "No bill history yet" },
        { label: "Average rate", value: formatCurrency(0), helper: "Per unit" },
        { label: "Latest bill", value: formatCurrency(0), helper: "No finalized bill" }
      ],
      insights: [
        {
          title: "Electricity Insights",
          detail: "Create a house and finalize a bill to unlock usage insights.",
          tone: "neutral"
        }
      ],
      barData: [],
      lineData: [],
      pieData: [],
      latestBill: null
    };
  }

  const bills = (await getBillsForHouse(viewer, activeHouse.id)).filter((bill) => bill.status === "finalized");
  const [latestBill, previousBill] = await Promise.all([
    bills[0] ? getBillSnapshotById(bills[0].id, { viewer }) : Promise.resolve(null),
    bills[1] ? getBillSnapshotById(bills[1].id, { viewer }) : Promise.resolve(null)
  ]);

  const results = viewer.isDemo
    ? demoResults.filter((result) => bills.some((bill) => bill.id === result.bill_id))
    : await Promise.all(bills.map((bill) => getResultsForBill(viewer, bill.id))).then((rows) => rows.flat());

  const memberTotals = results.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.member_name_snapshot] =
      (accumulator[item.member_name_snapshot] ?? 0) + item.final_units;
    return accumulator;
  }, {});

  const barData = Object.entries(memberTotals)
    .map(([name, units]) => ({ name, units: Number(units.toFixed(2)) }))
    .sort((left, right) => right.units - left.units);

  const lineData = bills
    .map((bill) => ({ month: formatMonthLabel(bill.billing_month), units: Number(bill.total_units) }))
    .reverse();

  const totalShare = Object.values(memberTotals).reduce((sum, value) => sum + value, 0);
  const pieData = Object.entries(memberTotals).map(([name, value]) => ({
    name,
    value: Number(((value / (totalShare || 1)) * 100).toFixed(2))
  }));

  const metrics: DashboardMetric[] = [
    {
      label: "Houses",
      value: `${houses.length}`,
      helper: "Managed by your account"
    },
    {
      label: "Finalized months",
      value: `${bills.length}`,
      helper: `${activeHouse.name} billing history`
    },
    {
      label: "Average rate",
      value: formatCurrency(
        bills.length
          ? bills.reduce((sum, bill) => sum + bill.price_per_unit, 0) / bills.length
          : 0
      ),
      helper: "Average price per unit"
    },
    {
      label: "Latest bill",
      value: formatCurrency(bills[0]?.main_bill_amount ?? 0),
      helper: bills[0] ? formatMonthLabel(bills[0].billing_month) : "No finalized bill"
    }
  ];

  return {
    viewer,
    houses,
    activeHouse,
    metrics,
    insights: buildInsights(latestBill, previousBill),
    barData,
    lineData,
    pieData,
    latestBill
  };
}

export async function getHouseBillingData(houseId: string): Promise<HouseBillingData> {
  const viewer = (await getViewer()) ?? demoViewer;
  const houses = await getHousesForViewer(viewer);
  const house = houses.find((entry) => entry.id === houseId) ?? null;

  if (!house) {
    return {
      viewer,
      house: null,
      members: [],
      bills: [],
      latestBill: null
    };
  }

  const members = await getMembersForHouse(viewer, house.id);
  const bills = await getBillsForHouse(viewer, house.id);
  const latestBill = bills[0] ? await getBillSnapshotById(bills[0].id, { viewer }) : null;

  return {
    viewer,
    house,
    members,
    bills,
    latestBill
  };
}

export async function getHistoryData(): Promise<HistoryData> {
  const viewer = (await getViewer()) ?? demoViewer;
  const houses = await getHousesForViewer(viewer);

  if (viewer.isDemo) {
    return {
      viewer,
      houses,
      bills: sortByMonthDesc(demoBills.map((bill) => ({ ...bill, house_name: demoHouse.name })))
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { viewer, houses, bills: [] };
  }

  const houseIds = houses.map((house) => house.id);

  if (!houseIds.length) {
    return { viewer, houses, bills: [] };
  }

  const { data, error } = await supabase
    .from("bills")
    .select("*, houses(name)")
    .in("house_id", houseIds)
    .order("billing_month", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    viewer,
    houses,
    bills: (data ?? []).map((bill: any) => ({
      ...bill,
      house_name: bill.houses?.name ?? "House"
    }))
  };
}

