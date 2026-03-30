// src/Lib/api/student-fee-record-update.ts
import { getToken } from "../../app/auth";

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function updateStudentFeeRecordApi(
  studentFeeRecordId: string,
  payload: {
    discount_amount: number;
    discount_reason: string | null;
    installments?: { installment_number: number; amount: number; due_date: string }[];
  }
): Promise<void> {
  const res = await fetch(
    `/api/fee-records/${encodeURIComponent(studentFeeRecordId)}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to update fee record");
}