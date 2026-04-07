// src/Lib/api/announcements.ts

import { getSession, getToken, ROLES } from "../../app/auth";

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

type StudentDashboardAnnouncement = Partial<AnnouncementRecord> & {
  id: string;
  announcement_type: string;
  announcement_title: string;
  message: string;
  created_at: string;
};

type StudentDashboardResponse = {
  data?: {
    recent_announcements?: StudentDashboardAnnouncement[];
  };
  error?: string;
};

async function fetchStudentAnnouncementsFromDashboard(
  token: string
): Promise<AnnouncementRecord[]> {
  const res = await fetch("/api/student/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = (await res.json()) as StudentDashboardResponse;
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to fetch student announcements");
  }

  return (data.data?.recent_announcements ?? []).map((announcement) => ({
    id: announcement.id,
    announcement_type: announcement.announcement_type,
    announcement_title: announcement.announcement_title,
    message: announcement.message,
    class_batch_id: announcement.class_batch_id ?? null,
    school_attribute: announcement.school_attribute ?? null,
    created_by: announcement.created_by ?? "Institute",
    created_at: announcement.created_at,
    is_active: announcement.is_active ?? true,
    attachments: announcement.attachments ?? [],
  }));
}

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
  const session = getSession();

  const res = await fetch("/api/announcements", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    const isStudent = session?.payload.role_id === ROLES.STUDENT;
    const roleError =
      typeof data?.error === "string" &&
      data.error.toLowerCase().includes("insufficient role");

    if (isStudent && (res.status === 403 || roleError)) {
      return fetchStudentAnnouncementsFromDashboard(token);
    }

    throw new Error(data.error ?? "Failed to fetch announcements");
  }

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
