// src/Lib/api/class-batches.ts

import { getToken } from "../../app/auth";

export type CreateClassBatchPayload = {
  name: string;
  academic_year_id: string;
};

export type AcademicYearOption = {
  id: string;
  label: string;
  is_active: boolean;
};

export async function fetchAcademicYearsApi(): Promise<AcademicYearOption[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/academic-years", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch academic years");

  return data.data as AcademicYearOption[];
}

export async function fetchClassBatchesByYearApi(
  academicYearId: string
): Promise<{ id: string; name: string; academic_year_id: string }[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(
    `/api/class-batches?academic_year_id=${encodeURIComponent(academicYearId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch batches");

  return data.data;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type BatchPageSummary = {
  active_batches: number;
  total_students: number;
};

export type BatchDetailed = {
  id: string;
  name: string;
  created_at: string;
  academic_year_label: string;
  created_by: string;
  student_count: number;
  teachers: string[];
};

export type BatchStudent = {
  id: string;
  name: string;
  login_identifier: string;
};

export type BatchStudentsResponse = {
  data: BatchStudent[];
  total: number;
  limit: number;
  offset: number;
};

// ── API calls ──────────────────────────────────────────────────────────────────

export async function fetchBatchesPageSummaryApi(): Promise<BatchPageSummary> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/class-batches/page-summary", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch batch summary");
  return data.data as BatchPageSummary;
}

export async function fetchBatchesDetailedApi(): Promise<BatchDetailed[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/class-batches/detailed", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch batches");
  return data.data as BatchDetailed[];
}

export async function fetchBatchStudentsApi(
  batchId: string,
  limit: number,
  offset: number
): Promise<BatchStudentsResponse> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(
    `/api/class-batches/${encodeURIComponent(batchId)}/students?limit=${limit}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch batch students");
  return { data: data.data, total: data.total, limit: data.limit, offset: data.offset };
}

export async function createClassBatchApi(
  payload: CreateClassBatchPayload
): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/class-batches", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create batch");
}