// src/Lib/api/student-fee.ts

import { getToken } from "../../app/auth";

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeeRecord = {
  id: string;
  total_payable: number;
  discount_amount: number;
  discount_reason: string | null;
  total_collected: number;
  outstanding_balance: number;
  fee_status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  has_custom_plan: boolean;
  created_at: string;
  fee_structure_label: string;
  plan_type: "LUMP_SUM" | "FIXED_INSTALLMENTS" | "CUSTOM_INSTALLMENTS";
  final_due_date: string;
  late_fee_amount: number | null;
  late_fee_type: "FLAT" | "PERCENT" | null;
  batch_name: string;
  student_name: string;
  institute_name: string;
  login_identifier: string;
};

export type InstallmentRow = {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  amount_paid?: number;
  status?: string;
};

export type PaymentRow = {
  id: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  payment_reference: string | null;
  receipt_number: string;
  note: string | null;
  recorded_by_name: string | null;
  recorded_at: string;
  is_cancelled: boolean;
  cancellation_reason: string | null;
  cancelled_by_name: string | null;
  cancelled_at: string | null;
};

export type FeeTabData = {
  fee_record: FeeRecord;
  payments: PaymentRow[];
};

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getStudentFeeTabApi(
  studentUserId: string
): Promise<FeeTabData | null> {
  // Step 1: get fee record id for this student
  const recRes = await fetch(
    `/api/students/${encodeURIComponent(studentUserId)}/fee-record`,
    { headers: authHeaders() }
  );
  if (recRes.status === 404) return null;
  const recJson = await recRes.json();
  if (!recRes.ok) throw new Error(recJson.error ?? "Failed to fetch fee record");
  const feeRecordId: string = recJson.data.id;

  // Step 2: get full detail + payments via the list endpoint (includes fee_record shape)
  const listRes = await fetch(
    `/api/fee-records/${encodeURIComponent(feeRecordId)}/payments?include_cancelled=true`,
    { headers: authHeaders() }
  );
  const listJson = await listRes.json();
  if (!listRes.ok) throw new Error(listJson.error ?? "Failed to fetch fee data");

  return {
    fee_record: listJson.data.fee_record as FeeRecord,
    payments: listJson.data.payments as PaymentRow[],
  };
}

export async function recordStudentPaymentApi(
  studentFeeRecordId: string,
  payload: {
    amount: number;
    payment_date: string;
    payment_mode: string;
    payment_reference?: string;
    note?: string;
  }
): Promise<void> {
  const res = await fetch(
    `/api/fee-records/${encodeURIComponent(studentFeeRecordId)}/payments`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to record payment");
}

export async function cancelStudentPaymentApi(
  paymentId: string,
  cancellation_reason: string
): Promise<void> {
  const res = await fetch(
    `/api/payments/${encodeURIComponent(paymentId)}/cancel`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ cancellation_reason }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to cancel payment");
}

export async function overrideInstallmentPlanApi(
  studentFeeRecordId: string,
  installments: { installment_number: number; amount: number; due_date: string }[]
): Promise<void> {
  const res = await fetch(
    `/api/fee-records/${encodeURIComponent(studentFeeRecordId)}/installment-plan`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ installments }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to override installment plan");
}