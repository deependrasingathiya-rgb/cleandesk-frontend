// src/Lib/api/profile.ts

import { getToken } from "../../app/auth";

export type MyProfile = {
  full_name: string;
  email: string | null;
  mobile: string | null;
  address: string | null;
  created_at: string;
  institute_name: string;
};

export async function fetchMyProfile(): Promise<MyProfile> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/profile/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch profile");

  return data.profile as MyProfile;
}