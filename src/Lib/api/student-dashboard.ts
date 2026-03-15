// src/Lib/api/student-dashboard.ts

import { getToken } from "../../app/auth";

// ── Types mirroring backend payload ──────────────────────────────────────────

export type StudentDashboardProfile = {
  full_name: string | null;
  login_identifier: string;
  batch_name: string | null;
};

export type TodayAttendanceStatus = "present" | "absent" | "late" | null;

export type StudentAttendanceStats = {
  present: number;
  absent: number;
  total_marked: number;
  percentage: number | null;
  min_required_pct: number;
  min_required_met: boolean | null;
};

export type RecentMarkRow = {
  test_id: string;
  test_name: string;
  subject: string;
  test_date: string;
  score: number;
  total_marks: number;
  percentage: number;
};

export type RecentAnnouncement = {
  id: string;
  announcement_type: string;
  announcement_title: string;
  message: string;
  created_at: string;
};

export type StudentDashboardData = {
  profile: StudentDashboardProfile;
  today_attendance: TodayAttendanceStatus;
  attendance_stats: StudentAttendanceStats;
  recent_marks: RecentMarkRow[];
  recent_announcements: RecentAnnouncement[];
};

// ── Fetch ─────────────────────────────────────────────────────────────────────

function authFetch(path: string): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return fetch(path, { headers: { Authorization: `Bearer ${token}` } });
}

export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  const res = await authFetch("/api/student/dashboard");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch student dashboard");
  return json.data as StudentDashboardData;
}