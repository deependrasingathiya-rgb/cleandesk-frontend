// src/Lib/api/tests.ts

import { getToken } from "../../app/auth";

export type CreateTestPayload = {
  test_name: string;
  subject: string;
  syllabus_text?: string;
  test_date: string;
  test_time?: string;
  duration_minutes?: number;
  total_marks: number;
  class_batch_ids: string[];
};


// ─── Test list & detail types ──────────────────────────────────────────────────

export type TestRow = {
  id: string;
  test_name: string;
  subject: string;
  syllabus_text: string | null;
  test_date: string;
  test_time: string | null;
  duration_minutes: number | null;
  total_marks: number;
  class_batch_id: string;
  batch_name: string;
  created_by_name: string | null;
  has_marks: boolean;
};

export type TestMarkRow = {
  marks_id: string;
  student_id: string;
  student_name: string;
  mobile: string | null;
  score: number | null;
};

export type TestDetailRow = TestRow & { marks: TestMarkRow[] };

export type BatchStudentRow = {
  student_id: string;
  full_name: string;
  mobile: string | null;
};

export async function fetchTestsApi(): Promise<TestRow[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch("/api/tests", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch tests");
  return json.data as TestRow[];
}

export async function fetchTestDetailApi(testId: string): Promise<TestDetailRow> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`/api/tests/${testId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch test");
  return json.data as TestDetailRow;
}

export async function fetchTestBatchStudentsApi(testId: string): Promise<BatchStudentRow[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`/api/tests/${testId}/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch batch students");
  return json.data as BatchStudentRow[];
}

export async function deleteTestApi(testId: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`/api/tests/${testId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "Failed to delete test");
  }
}

export async function updateTestApi(
  testId: string,
  payload: { subject?: string; syllabus_text?: string; test_date?: string; test_time?: string | null; duration_minutes?: number | null }
): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`/api/tests/${testId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "Failed to update test");
  }
}

export async function bulkSubmitMarksApi(
  testId: string,
  entries: { student_id: string; score: number | null }[],
  mode: "enter" | "modify"
): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`/api/tests/${testId}/marks/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ entries, mode }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "Failed to submit marks");
  }
}
export type TestStudyMaterial = {
  id: string;
  file_url: string;
  linked_type: string;
  linked_id: string;
  created_at: string;
  uploader_name: string | null;
  batch_name: string | null;
};

export async function fetchTestStudyMaterialsApi(testId: string): Promise<TestStudyMaterial[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`/api/study-materials?linked_test_id=${testId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch study materials");
  return json.data as TestStudyMaterial[];
}

export async function createTestApi(payload: CreateTestPayload): Promise<{ created: number; data: { id: string }[] }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/tests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create test");
  return json;
}