// src/Lib/api/holiday.ts

import { getToken } from "../../app/auth";

function authHeaders() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export type HolidayRow = {
  id: string;
  holiday_date: string;
  name: string;
  class_batch_id: string | null;
  batch_name: string | null;
  declared_by_name: string | null;
  created_at: string;
  is_cancelled: boolean;
};

export type DeclareHolidayPayload = {
  holiday_date: string;          // YYYY-MM-DD
  name: string;
  class_batch_id?: string | null;
};

export async function fetchHolidaysApi(options?: {
  upcoming?: boolean;
  limit?: number;
}): Promise<HolidayRow[]> {
  const params = new URLSearchParams();
  if (options?.upcoming) params.set("upcoming", "true");
  if (options?.limit)    params.set("limit", String(options.limit));

  const res = await fetch(`/api/holidays?${params.toString()}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch holidays");
  return json.data as HolidayRow[];
}

export async function fetchHolidaysForDateApi(date: string): Promise<HolidayRow[]> {
  const res = await fetch(`/api/holidays?date=${encodeURIComponent(date)}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch holidays for date");
  return json.data as HolidayRow[];
}

export async function cancelHolidayApi(holidayId: string): Promise<void> {
  const res = await fetch(`/api/holidays/${encodeURIComponent(holidayId)}/cancel`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to cancel holiday");
}


export async function declareHolidayApi(payload: DeclareHolidayPayload): Promise<HolidayRow> {
  const res = await fetch("/api/holidays", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      holiday_date: payload.holiday_date,
      name: payload.name,
      class_batch_id: payload.class_batch_id ?? null,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to declare holiday");
  return json.data as HolidayRow;
}