//src/Lib/api/study-materials.ts
import { getToken } from "../../app/auth";

export type StudyMaterialRecord = {
  id: string;
  file_url: string;
  linked_announcement_id: string | null;
  linked_test_id: string | null;
  created_at: string;
  created_by: string;
  is_active: boolean;
  uploader_name: string | null;
};

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchStudyMaterialsApi(options?: {
  class_batch_id?: string;
  linked_test_id?: string;
}): Promise<StudyMaterialRecord[]> {
  const params = new URLSearchParams();
  if (options?.class_batch_id) params.set("class_batch_id", options.class_batch_id);
  if (options?.linked_test_id)  params.set("linked_test_id",  options.linked_test_id);

  const res = await fetch(`/api/study-materials?${params.toString()}`, {
    headers: authHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch study materials");
  return data.data as StudyMaterialRecord[];
}

export async function uploadStudyMaterialApi(input: {
  file: File;
  linked_type?: "ANNOUNCEMENT" | "TEST";
  linked_id?: string;
  class_batch_id?: string | null;
  // legacy fields kept for backwards compatibility
  linked_announcement_id?: string | null;
  linked_test_id?: string | null;
}): Promise<StudyMaterialRecord> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Resolve to canonical fields — new callers use linked_type+linked_id,
  // legacy callers use linked_announcement_id / linked_test_id directly.
  const resolvedAnnouncementId =
    (input.linked_type === "ANNOUNCEMENT" ? input.linked_id : null) ??
    input.linked_announcement_id ??
    null;
  const resolvedTestId =
    (input.linked_type === "TEST" ? input.linked_id : null) ??
    input.linked_test_id ??
    null;

  if (!resolvedAnnouncementId && !resolvedTestId) {
    throw new Error("Provide a valid linked_type + linked_id or linked_announcement_id / linked_test_id");
  }

  const formData = new FormData();
  formData.append("file", input.file);
  if (resolvedAnnouncementId) {
    formData.append("linked_announcement_id", resolvedAnnouncementId);
  }
  if (resolvedTestId) {
    formData.append("linked_test_id", resolvedTestId);
  }
  if (input.class_batch_id) {
    formData.append("class_batch_id", input.class_batch_id);
  }

  const res = await fetch("/api/study-materials/upload", {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}` },
    body:    formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.data as StudyMaterialRecord;
}

export async function deleteStudyMaterialApi(materialId: string): Promise<void> {
  const res = await fetch(`/api/study-materials/${materialId}`, {
    method:  "DELETE",
    headers: authHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Delete failed");
}