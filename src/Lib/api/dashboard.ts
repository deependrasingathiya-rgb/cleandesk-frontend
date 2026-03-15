// src/Lib/api/dashboard.ts

import { getToken } from "../../app/auth";

export type DashboardSummary = {
  total_students: number;
  new_this_week: number;
  active_batches: number;
  upcoming_tests: number;
  attendance_today_pct: number | null;
  attendance_marked_present: number;
  attendance_total_marked: number;
};

export type UpcomingTest = {
  id: string;
  test_name: string;
  subject: string;
  test_date: string;
  batch_name: string;
  created_by: string | null;
};

export type AttendanceSummaryRow = {
  batch_name: string;
  present: number;
  absent: number;
  late: number;
  total_marked: number;
};

async function authFetch(path: string): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return fetch(path, { headers: { Authorization: `Bearer ${token}` } });
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await authFetch("/api/dashboard/summary");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch dashboard summary");
  return data.summary;
}

export async function fetchUpcomingTests(limit = 5): Promise<UpcomingTest[]> {
  const res = await authFetch(`/api/dashboard/upcoming-tests?limit=${limit}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch upcoming tests");
  return data.tests;
}

export async function fetchAttendanceSummary(date?: string): Promise<{ date: string; rows: AttendanceSummaryRow[] }> {
  const param = date ? `?date=${date}` : "";
  const res = await authFetch(`/api/dashboard/attendance-summary${param}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch attendance summary");
  return data;
}