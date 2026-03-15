// src/Lib/api/students.ts

import { getToken } from "../../app/auth";
import { ROLES } from "../../app/auth";

export type EnrollStudentPayload = {
  full_name: string;
  father_name?: string;
  mobile: string;
  alternate_mobile?: string;
  school_name: string;
  education_board: string;
  academic_year_id: string;
  class_batch_id?: string;
};

export type EnrolledStudent = {
  id: string;
  login_identifier: string;
  temporary_password: string;
};

// ─── Student list types ────────────────────────────────────────────────────────

export type StudentRow = {
  id: string;
  name: string | null;
  mobile: string | null;
  batch: string | null;
  board: string | null;
  is_active: boolean;
  created_at: string;
  attendance_pct: number | null;
};

export type StudentStats = {
  active_count: number;
  new_this_month: number;
};

export async function fetchStudentStatsApi(): Promise<StudentStats> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/students/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch student stats");
  return data.data as StudentStats;
}

export async function fetchStudentsApi(options: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ students: StudentRow[]; total: number }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (options.limit  != null) params.set("limit",  String(options.limit));
  if (options.offset != null) params.set("offset", String(options.offset));
  if (options.search)         params.set("search", options.search);

  const res = await fetch(`/api/students?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch students");
  return { students: data.data as StudentRow[], total: data.total as number };
}


export async function enrollStudentApi(
  payload: EnrollStudentPayload
): Promise<EnrolledStudent> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...payload, role: ROLES.STUDENT }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to enroll student");

  return {
    id: data.user.id,
    login_identifier: data.user.login_identifier,
    temporary_password: data.temporary_password,
  };
}