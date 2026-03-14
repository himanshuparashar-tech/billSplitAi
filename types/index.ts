export type BillStatus = "draft" | "finalized";

export interface Viewer {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
}

export interface House {
  id: string;
  owner_user_id?: string | null;
  name: string;
  created_at?: string;
}

export interface Member {
  id: string;
  house_id: string;
  name: string;
  is_active?: boolean;
  created_at?: string;
}

export interface ReadingInput {
  memberId: string;
  previousReading: number;
  currentReading: number;
  meterPhotoPath?: string | null;
  meterPhotoUrl?: string | null;
}

export interface ReadingRecord {
  id: string;
  bill_id: string;
  house_id: string;
  member_id: string;
  member_name?: string;
  previous_reading: number;
  current_reading: number;
  units: number;
  meter_photo_path?: string | null;
  meter_photo_url?: string | null;
}

export interface Bill {
  id: string;
  house_id: string;
  billing_month: string;
  status: BillStatus;
  main_bill_amount: number;
  total_units: number;
  price_per_unit: number;
  motor_previous_reading: number;
  motor_current_reading: number;
  motor_units: number;
  finalized_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BillResult {
  id: string;
  bill_id: string;
  member_id: string;
  member_name_snapshot: string;
  member_units: number;
  motor_share_units: number;
  final_units: number;
  bill_amount: number;
}

export interface BillSnapshot extends Bill {
  house: House;
  readings: ReadingRecord[];
  results: BillResult[];
  members: Member[];
}

export interface DashboardMetric {
  label: string;
  value: string;
  helper: string;
}

export interface DashboardInsight {
  title: string;
  detail: string;
  tone: "positive" | "neutral" | "alert";
}

export interface MemberUsagePoint {
  name: string;
  units: number;
}

export interface MonthlyUsagePoint {
  month: string;
  units: number;
}

export interface UsageSharePoint {
  name: string;
  value: number;
}

