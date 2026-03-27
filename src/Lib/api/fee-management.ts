// src/Lib/api/fee-management.ts

import { getToken } from "../../app/auth";

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export type BatchFeeRow = {
  batch_id: string;
  batch_name: string;
  total_expected: number;
  total_collected: number;
  outstanding: number;
  paid_count: number;
  partially_paid_count: number;
  unpaid_count: number;
  overdue_count: number;
  student_count: number;
};

export type FeeOverviewData = {
  academic_year_id: string;
  academic_year_label: string;
  total_expected: number | null;
  total_collected: number | null;
  outstanding: number | null;
  collection_pct: number | null;
  show_financials: boolean;
  batches: BatchFeeRow[];
};

export async function getFeeOverviewApi(): Promise<FeeOverviewData> {
  const res = await fetch("/api/fee-management/overview", {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch fee overview");
  return json.data as FeeOverviewData;
}

export type BatchDrillDownStudent = {
  student_user_id: string;
  student_name: string;
  login_identifier: string;
  fee_status: string;
  total_payable: number;
  outstanding_balance: number;
  total_collected: number;
  last_payment_date: string | null;
};

export type BatchDrillDownData = {
  batch_id: string;
  batch_name: string;
  students: BatchDrillDownStudent[];
};

export async function getBatchDrillDownApi(batchId: string): Promise<BatchDrillDownData> {
  const res = await fetch(
    `/api/fee-management/batches/${encodeURIComponent(batchId)}/students`,
    { headers: authHeaders() }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch batch fee data");
  return json.data as BatchDrillDownData;
}