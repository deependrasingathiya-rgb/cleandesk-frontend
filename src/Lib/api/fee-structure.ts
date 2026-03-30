// src/Lib/api/fee-structure.ts

import { getToken } from "../../app/auth";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// (PlanType removed as it's replaced by independent toggles)

export type LateFeeType = "FLAT" | "PERCENT";

export type InstallmentInput = {
  installment_number: number;
  amount: number;
  due_date: string; // YYYY-MM-DD
};

export type CreateFeeStructurePayload = {
  class_batch_id: string;
  label: string;
  total_amount: number;
  lump_sum_enabled: boolean;
  installments_enabled: boolean;
  lump_sum_discount?: number | null;
  final_due_date: string; // YYYY-MM-DD
  late_fee_amount?: number | null;
  late_fee_type?: LateFeeType | null;
  require_advance?: boolean;
  installments?: InstallmentInput[];
};

export type UpdateFeeStructurePayload = Omit<CreateFeeStructurePayload, "class_batch_id">;

export type FeeStructureRecord = {
  id: string;
  class_batch_id: string;
  label: string;
  plan_type: string;
  total_amount: number;
  lump_sum_enabled: boolean;
  installments_enabled: boolean;
  lump_sum_discount: number | null;
  final_due_date: string;
  late_fee_amount: number | null;
  late_fee_type: LateFeeType | null;
  require_advance: boolean;
  is_active: boolean;
  created_at: string;
  installments: {
    id: string;
    installment_number: number;
    amount: number;
    due_date: string;
  }[];
};

// â”€â”€â”€ API helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// â”€â”€â”€ Create â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createFeeStructureApi(
  payload: CreateFeeStructurePayload
): Promise<FeeStructureRecord> {
  const res = await fetch("/api/fee-structures", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create fee structure");
  return json.data as FeeStructureRecord;
}

export async function updateFeeStructureApi(
  feeStructureId: string,
  payload: UpdateFeeStructurePayload
): Promise<FeeStructureRecord> {
  const res = await fetch(`/api/fee-structures/${encodeURIComponent(feeStructureId)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to update fee structure");
  return json.data as FeeStructureRecord;
}

export async function getStudentFeeRecordApi(
  studentUserId: string
): Promise<{ id: string; total_payable: number; discount_amount: number; fee_status: string } | null> {
  const res = await fetch(
    `/api/students/${encodeURIComponent(studentUserId)}/fee-record`,
    { headers: authHeaders() }
  );
  if (res.status === 404) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch fee record");
  return json.data;
}

export async function recordAdvancePaymentApi(
  studentFeeRecordId: string,
  payload: {
    amount: number;
    payment_date: string;
    payment_mode: string;
    payment_reference?: string;
    note?: string;
  }
): Promise<void> {
  const res = await fetch(`/api/fee-records/${encodeURIComponent(studentFeeRecordId)}/payments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to record payment");
}


// â”€â”€â”€ Read (for a batch) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getFeeStructureForBatchApi(
  batchId: string
): Promise<FeeStructureRecord | null> {
  const res = await fetch(
    `/api/class-batches/${encodeURIComponent(batchId)}/fee-structure`,
    { headers: authHeaders() }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch fee structure");
  return json.data as FeeStructureRecord | null;
}

