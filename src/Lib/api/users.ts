// src/Lib/api/users.ts

import { getToken } from "../../app/auth";
import { type RoleId } from "../../app/auth";

export type CreateUserPayload = {
  full_name: string;
  role: RoleId;
  mobile?: string;
  email?: string;
  address?: string;
};

export type CreatedUser = {
  id: string;
  institute_id: string;
  role_id: RoleId;
  phone_number: string | null;
};

export type UserRoleId = 1 | 2 | 3 | 4;

export type UserListItem = {
  id: string;
  phone_number: string | null;
  role_id: UserRoleId;
  is_active: boolean;
  created_at: string;
  full_name: string | null;
};

export async function fetchUsersApi(): Promise<UserListItem[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/users", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch users");

  return data.data as UserListItem[];
}

export async function deactivateUserApi(userId: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`/api/users/${userId}/deactivate`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to deactivate user");
}

export async function reactivateUserApi(userId: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`/api/users/${userId}/reactivate`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to reactivate user");
}

export async function createUserApi(
  payload: CreateUserPayload
): Promise<CreatedUser> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      full_name: payload.full_name,
      role: payload.role,
      ...(payload.mobile  && { mobile:  payload.mobile }),
      ...(payload.email   && { email:   payload.email }),
      ...(payload.address && { address: payload.address }),
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create user");

  return {
    ...data.user,
  };
}