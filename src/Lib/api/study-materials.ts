import { getToken } from "../../app/auth";

export type StudyMaterialRecord = {
  id: string;
  linked_type: string;
  linked_id: string;
  file_url: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
  uploader_name: string | null;
  batch_name: string | null;
  batch_id: string | null;
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
  linked_type: "TEST" | "ANNOUNCEMENT";
  linked_id: string;
  class_batch_id?: string | null;
}): Promise<StudyMaterialRecord> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("file",        input.file);
  formData.append("linked_type", input.linked_type);
  formData.append("linked_id",   input.linked_id);
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