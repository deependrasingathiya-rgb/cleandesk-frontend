// src/Lib/api/teacher-dashboard.ts

import { getToken } from "../../app/auth";

export type TeacherDashboardSummary = {
  total_batches: number;
  active_batches: number;
  total_students: number;
  attendance_pending_count: number;
  upcoming_tests_count: number;
  marks_pending_count: number;
};

export type TeacherUpcomingTest = {
  id: string;
  test_name: string;
  subject: string;
  test_date: string;
  batch_name: string;
  class_batch_id: string;
};

export type TeacherBatchRow = {
  id: string;
  name: string;
  student_count: number;
  attendance_done: boolean;
};

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchTeacherDashboardSummary(): Promise<TeacherDashboardSummary> {
  const res = await fetch("/api/teacher/dashboard/summary", { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch teacher dashboard summary");
  return json.summary as TeacherDashboardSummary;
}

export async function fetchTeacherDashboardUpcomingTests(limit = 5): Promise<TeacherUpcomingTest[]> {
  const res = await fetch(`/api/teacher/dashboard/upcoming-tests?limit=${limit}`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch upcoming tests");
  return json.tests as TeacherUpcomingTest[];
}

export async function fetchTeacherDashboardBatches(): Promise<TeacherBatchRow[]> {
  const res = await fetch("/api/teacher/dashboard/batches", { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch teacher batches");
  return json.batches as TeacherBatchRow[];
}