// src/Lib/api/announcements.ts

import { getToken } from "../../app/auth";

export type AnnouncementPayload = {
  announcement_type: string;
  announcement_title: string;
  message: string;
  class_batch_id?: string | null;
  school_attribute?: string | null;
};

export type AnnouncementAttachment = {
  id: string;
  file_url: string;
  created_at: string;
};

export type AnnouncementRecord = {
  id: string;
  announcement_type: string;
  announcement_title: string;
  message: string;
  class_batch_id: string | null;
  school_attribute: string | null;
  created_by: string;
  created_at: string;
  is_active: boolean;
  attachments: AnnouncementAttachment[];
};


export async function createAnnouncementApi(
  payload: AnnouncementPayload
): Promise<AnnouncementRecord> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/announcements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to create announcement");
  }

  return data.data as AnnouncementRecord;
}
export async function fetchAnnouncementsApi(): Promise<AnnouncementRecord[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/announcements", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch announcements");

  return data.data as AnnouncementRecord[];
}

export async function deleteAnnouncementApi(announcementId: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`/api/announcements/${announcementId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_active: false }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to delete announcement");
}
export type AnnouncementUpdatePayload = {
  announcement_title?: string;
  message?: string;
  school_attribute?: string | null;
};

export async function updateAnnouncementApi(
  announcementId: string,
  payload: AnnouncementUpdatePayload
): Promise<AnnouncementRecord> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`/api/announcements/${announcementId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to update announcement");

  return data.data as AnnouncementRecord;
}