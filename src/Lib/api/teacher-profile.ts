// src/Lib/api/teacher-profile.ts

import { getToken } from "../../app/auth";

export type TeacherBatchDetail = {
  id: string;
  name: string;
  subject: string | null;
  academic_year_label: string;
  student_count: number;
};

export type TeacherTestRow = {
  id: string;
  test_name: string;
  subject: string;
  test_date: string;
  total_marks: number;
  batch_name: string;
  has_marks: boolean;
};

export type TeacherProfileData = {
  id: string;
  login_identifier: string;
  is_active: boolean;
  created_at: string;
  full_name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
  assigned_batches: TeacherBatchDetail[];
  tests_conducted: TeacherTestRow[];
  tests_total: number;
};

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchTeacherProfileApi(teacherId: string): Promise<TeacherProfileData> {
  const res = await fetch(`/api/teachers/${teacherId}/profile`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch teacher profile");
  return json.data as TeacherProfileData;
}

export async function fetchTeacherTestsApi(
  teacherId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ data: TeacherTestRow[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.limit  != null) params.set("limit",  String(options.limit));
  if (options?.offset != null) params.set("offset", String(options.offset));

  const res = await fetch(`/api/teachers/${teacherId}/tests?${params.toString()}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch teacher tests");
  return { data: json.data, total: json.total };
}