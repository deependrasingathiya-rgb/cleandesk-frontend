// src/Lib/api/student-results.ts

import { getToken } from "../../app/auth";

// ── Types — mirror backend StudentResultsPayload exactly ──────────────────────

export type ResultRow = {
  test_id:       string;
  test_name:     string;
  subject:       string;
  batch_name:    string;
  test_date:     string;       // YYYY-MM-DD — the test date, NOT upload date
  score:         number | null;
  total_marks:   number;
  syllabus_text: string | null;
  percentage:    number | null;
};

export type SubjectSummary = {
  subject:         string;
  avg_pct:         number;
  attempted_count: number;
  total_count:     number;
};

export type TrendPoint = {
  test_id:     string;
  test_name:   string;
  subject:     string;
  test_date:   string;
  percentage:  number;
  score:       number;
  total_marks: number;
};

export type StudentResultsData = {
  overall_pct:       number | null;
  total_tested:      number;
  pass_rate_pct:     number | null;
  best_subject:      SubjectSummary | null;
  weak_subject:      SubjectSummary | null;
  subject_summaries: SubjectSummary[];
  trend_data:        TrendPoint[];
  all_results:       ResultRow[];
};

// ── Fetch ─────────────────────────────────────────────────────────────────────

function authFetch(path: string): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return fetch(path, { headers: { Authorization: `Bearer ${token}` } });
}

export async function fetchStudentResults(): Promise<StudentResultsData> {
  const res = await authFetch("/api/student/results");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch results");
  return json.data as StudentResultsData;
}