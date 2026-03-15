// src/Lib/api/attendance.ts

import { getToken } from "../../app/auth";

export type BatchSummaryItem = {
  batch_id: string;
  batch_name: string;
  teacher_name: string | null;
  total_students: number;
  is_marked: boolean;
  present_count: number;
  absent_count: number;
  late_count: number;
  early_leave_count: number;
  marked_by_name: string | null;
  marked_at: string | null;
};

export type StudentDetailItem = {
  student_id: string;
  full_name: string;
  attendance_id: string | null;
  status: "present" | "absent" | null;
  late: boolean;
  early_leave: boolean;
  marked_by_name: string | null;
  marked_at: string | null;
};

function authHeaders() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function fetchAttendanceBatchSummaryApi(
  date: string
): Promise<BatchSummaryItem[]> {
  const res = await fetch(`/api/attendance/batch-summary?date=${encodeURIComponent(date)}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch attendance summary");
  return json.data;
}

export async function fetchAttendanceBatchDetailApi(
  batchId: string,
  date: string
): Promise<StudentDetailItem[]> {
  const res = await fetch(
    `/api/attendance/batch/${encodeURIComponent(batchId)}/date/${encodeURIComponent(date)}`,
    { headers: authHeaders() }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch attendance detail");
  return json.data;
}

// Mark attendance for an entire batch (loops per student)
export async function markBatchAttendanceApi(
  batchId: string,
  date: string,
  entries: { studentId: string; present: boolean; late: boolean; earlyLeave: boolean }[]
): Promise<void> {
  const headers = authHeaders();
  for (const entry of entries) {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers,
      body: JSON.stringify({
        student_id: entry.studentId,
        class_batch_id: batchId,
        attendance_date: date,
        status: entry.present ? "present" : "absent",
        late: entry.late,
        early_leave: entry.earlyLeave,
      }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? `Failed to mark attendance for student ${entry.studentId}`);
    }
  }
}

// Update existing attendance records for a batch
export async function updateBatchAttendanceApi(
  entries: { attendanceId: string; present: boolean; late: boolean; earlyLeave: boolean }[]
): Promise<void> {
  const headers = authHeaders();
  for (const entry of entries) {
    const res = await fetch(`/api/attendance/${entry.attendanceId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        status: entry.present ? "present" : "present",
        late: entry.late,
        early_leave: entry.earlyLeave,
      }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? `Failed to update attendance record ${entry.attendanceId}`);
    }
  }
}