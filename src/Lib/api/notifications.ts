// src/Lib/api/notifications.ts

import { getToken } from "../../app/auth";

export type NotificationRecord = {
  id: string;
  event_type: string;
  entity_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchNotificationsApi(options?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<{ notifications: NotificationRecord[]; unread_count: number }> {
  const params = new URLSearchParams();
  if (options?.limit)      params.set("limit",       String(options.limit));
  if (options?.unreadOnly) params.set("unread_only",  "true");

  const res = await fetch(`/api/notifications?${params.toString()}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch notifications");
  return { notifications: data.notifications, unread_count: data.unread_count };
}

export async function markNotificationsReadApi(
  notificationIds?: string[]
): Promise<void> {
  const res = await fetch("/api/notifications/read", {
    method:  "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body:    JSON.stringify(
      notificationIds?.length ? { notification_ids: notificationIds } : {}
    ),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to mark read");
}