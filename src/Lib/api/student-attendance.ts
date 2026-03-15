// src/Lib/api/student-attendance.ts

import { getToken } from "../../app/auth";

// ── Types mirroring backend payload ──────────────────────────────────────────

export type AttendanceDayRecord = {
  date: string;
  status: "present" | "absent";
  late: boolean;
  early_leave: boolean;
  created_at: string;
  updated_at: string;
  created_by_name: string | null;
  updated_by_name: string | null;
};

export type MonthSummary = {
  year: number;
  month: number;
  month_label: string;
  present: number;
  absent: number;
  late: number;
  early_leave: number;
  total_marked: number;
  attendance_pct: number | null;
  is_current_month: boolean;
};

export type StudentAttendancePageData = {
  login_identifier: string;
  batch_name: string | null;
  overall_present: number;
  overall_absent: number;
  overall_late: number;
  overall_early_leave: number;
  overall_total_marked: number;
  overall_pct: number | null;
  min_required_pct: number;
  min_required_met: boolean | null;
  days_needed_for_eligibility: number;
  current_streak: number;
  longest_streak: number;
  monthly_trend: MonthSummary[];
  day_records: AttendanceDayRecord[];
};

// ── Fetch ─────────────────────────────────────────────────────────────────────

function authHeaders() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchStudentAttendancePage(): Promise<StudentAttendancePageData> {
  const res = await fetch("/api/student/attendance", {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch attendance");
  return json.data as StudentAttendancePageData;
}