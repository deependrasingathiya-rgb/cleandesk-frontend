// src/Lib/api/teachers.ts

import { getToken } from "../../app/auth";

export type TeacherUserOption = {
  id: string;
  full_name: string;
  login_identifier: string;
};

export type ClassBatchOption = {
  id: string;
  name: string;
};


export type TeacherBatch = {
  id: string;
  name: string;
};

export type TeacherListItem = {
  id: string;
  login_identifier: string;
  is_active: boolean;
  created_at: string;
  full_name: string;
  mobile: string | null;
  email: string | null;
  assigned_batches: TeacherBatch[];
};




export async function fetchTeachersApi(): Promise<TeacherListItem[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/teachers", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch teachers");

  return data.data as TeacherListItem[];
}

export async function fetchUnassignedTeacherUsersApi(): Promise<TeacherUserOption[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/users/teachers", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch teacher users");

  return data.data as TeacherUserOption[];
}

export async function fetchClassBatchesApi(): Promise<ClassBatchOption[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/class-batches", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch batches");

  return data.data as ClassBatchOption[];
}

export async function assignTeacherApi(payload: {
  teacher_user_id: string;
  class_batch_ids: string[];
}): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/teachers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to assign teacher");
}