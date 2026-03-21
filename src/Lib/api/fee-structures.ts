// src/Lib/api/fee-structures.ts

import { getToken } from "../../app/auth";

export type FeeStructureInstallment = {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
};

export type FeeStructure = {
  id: string;
  class_batch_id: string;
  label: string;
  total_amount: number;
  plan_type: "LUMP_SUM" | "FIXED_INSTALLMENTS" | "CUSTOM_INSTALLMENTS";
  final_due_date: string;
  late_fee_amount: number | null;
  late_fee_type: "FLAT" | "PERCENT" | null;
  require_advance: boolean;
  is_active: boolean;
  created_at: string;
  created_by_name: string | null;
  installments: FeeStructureInstallment[];
};

export type CreateFeeStructurePayload = {
  class_batch_id: string;
  label: string;
  total_amount: number;
  plan_type: "LUMP_SUM" | "FIXED_INSTALLMENTS" | "CUSTOM_INSTALLMENTS";
  final_due_date: string;
  late_fee_amount?: number | null;
  late_fee_type?: "FLAT" | "PERCENT" | null;
  require_advance?: boolean;
  installments?: { installment_number: number; amount: number; due_date: string }[];
};

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function fetchFeeStructureForBatchApi(
  batchId: string
): Promise<FeeStructure | null> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`/api/class-batches/${encodeURIComponent(batchId)}/fee-structure`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch fee structure");
  return json.data as FeeStructure | null;
}

export async function createFeeStructureApi(
  payload: CreateFeeStructurePayload
): Promise<FeeStructure> {
  const res = await fetch("/api/fee-structures", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create fee structure");
  return json.data as FeeStructure;
}

export async function deactivateFeeStructureApi(
  feeStructureId: string
): Promise<void> {
  const res = await fetch(`/api/fee-structures/${encodeURIComponent(feeStructureId)}/deactivate`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to deactivate fee structure");
}