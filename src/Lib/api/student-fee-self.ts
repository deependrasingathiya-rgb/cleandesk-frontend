// src/Lib/api/student-fee-self.ts
//
// Student self-view of their own fee record.
// Calls GET /api/student/fee — scoped to the authenticated student only.

import { getToken } from "../../app/auth";

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export type StudentFeeInstallment = {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
};


export type StudentOwnPayment = {
  id: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  receipt_number: string;
  note: string | null;
  recorded_at: string;
};


export type StudentOwnFeeRecord = {
  id: string;
  total_payable: number;
  discount_amount: number;
  discount_reason: string | null;
  total_collected: number;
  outstanding_balance: number;
  fee_status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  has_custom_plan: boolean;
  fee_structure_label: string;
  plan_type: "LUMP_SUM" | "FIXED_INSTALLMENTS" | "CUSTOM_INSTALLMENTS";
  final_due_date: string;
  late_fee_amount: number | null;
  late_fee_type: "FLAT" | "PERCENT" | null;
  batch_name: string;
  installments: StudentFeeInstallment[];
  payments: StudentOwnPayment[];
};

export async function fetchOwnFeeRecordApi(): Promise<StudentOwnFeeRecord | null> {
  const res = await fetch("/api/student/fee", { headers: authHeaders() });
  // 404 = enrolled before fee structures existed — not an error, just no record
  if (res.status === 404) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch fee record");
  return json.data as StudentOwnFeeRecord;
}