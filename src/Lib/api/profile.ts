// src/Lib/api/profile.ts

import { getToken, type RoleId } from "../../app/auth";

export type MyProfile = {
  full_name: string;
  email: string | null;
  mobile: string | null;
  address: string | null;
  created_at: string;
  institute_name: string;
  role_id?: RoleId;
  role?: string | null;
  role_name?: string | null;
  role_label?: string | null;
};

export type UpdateProfilePayload = {
  full_name?: string;
  email?: string;
  mobile?: string;
  address?: string;
};


export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/profile/me/password", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to change password");
}


export async function updateMyProfile(payload: UpdateProfilePayload): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/profile/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to update profile");
}


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