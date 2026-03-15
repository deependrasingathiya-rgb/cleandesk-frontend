// src/Lib/api/subjects.ts

import { getToken } from "../../app/auth";

export async function fetchSubjectCatalogApi(): Promise<string[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/subject-catalog", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load subjects");
  return json.data as string[];
}

export async function addSubjectApi(subject: string): Promise<string[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/subject-catalog", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subject }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to add subject");
  return json.data as string[];
}