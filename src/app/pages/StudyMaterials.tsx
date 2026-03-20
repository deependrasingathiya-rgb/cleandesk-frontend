// src/app/pages/StudyMaterials.tsx

import { useState, useRef, useEffect, type ElementType } from "react";
import { fetchStudyMaterialsApi, uploadStudyMaterialApi, deleteStudyMaterialApi } from "../../Lib/api/study-materials";
import { getSession, ROLES } from "../../app/auth";
import { fetchClassBatchesApi } from "../../Lib/api/teachers";
import { fetchSubjectCatalogApi } from "../../Lib/api/subjects";
import { fetchTestsApi, type TestRow } from "../../Lib/api/tests";
import {
  Search,
  Plus,
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  Eye,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  Image,
  File,
  ChevronDown,
  ClipboardList,
  BookOpen,
  Users2,
  User,
  Calendar,
  HardDrive,
  ExternalLink,
  Upload,
} from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────────



// ─── Types ─────────────────────────────────────────────────────────────────────

type MaterialType = "PDF" | "Video" | "Image" | "Link" | "Doc" | "Other";

type Material = {
  id: number;
  title: string;
  description: string;
  subject: string;
  batch: string;
  type: MaterialType;
  size: string;
  uploadedBy: string;
  uploadedById: string;   // raw user_id for ownership checks
  date: string;
  downloads: number;
  linkedTestId: string | null;
  url?: string; // for link type
};

type UploadForm = {
  // Files (for non-link types)
  files: File[];
  // Link type
  isLink: boolean;
  linkUrl: string;
  linkTitle: string;
  // Metadata
  title: string;
  description: string;
  subject: string;
  batchId: string;   // now stores batch UUID
  linkedTestId: string | null;  // now stores test UUID string
};

// ─── Lookups ───────────────────────────────────────────────────────────────────

const subjectColors: Record<string, { color: string; bg: string }> = {
  Physics:          { color: "#db2777", bg: "#fdf2f8" },
  Mathematics:      { color: "#2563eb", bg: "#eff6ff" },
  Chemistry:        { color: "#ea580c", bg: "#fff7ed" },
  English:          { color: "#6b7280", bg: "#f9fafb" },
  Business:         { color: "#7c3aed", bg: "#f5f3ff" },
  Biology:          { color: "#16a34a", bg: "#f0fdf4" },
  Accounts:         { color: "#0d9488", bg: "#f0fdfa" },
  History:          { color: "#b45309", bg: "#fffbeb" },
  Geography:        { color: "#0369a1", bg: "#f0f9ff" },
  "Computer Science":{ color: "#4f46e5", bg: "#eef2ff" },
  Economics:        { color: "#be185d", bg: "#fdf2f8" },
};

const typeConfig: Record<MaterialType, { icon: ElementType; color: string; bg: string; label: string }> = {
  PDF:   { icon: FileText,  color: "#ea580c", bg: "#fff7ed",  label: "PDF"   },
  Video: { icon: Video,     color: "#7c3aed", bg: "#f5f3ff",  label: "Video" },
  Image: { icon: Image,     color: "#2563eb", bg: "#eff6ff",  label: "Image" },
  Link:  { icon: LinkIcon,  color: "#0369a1", bg: "#f0f9ff",  label: "Link"  },
  Doc:   { icon: FileText,  color: "#16a34a", bg: "#f0fdf4",  label: "Doc"   },
  Other: { icon: File,      color: "#6b7280", bg: "#f9fafb",  label: "Other" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function detectType(filename: string): MaterialType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "PDF";
  if (["mp4","mov","avi","mkv","webm"].includes(ext)) return "Video";
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "Image";
  if (["doc","docx","ppt","pptx","xls","xlsx","txt"].includes(ext)) return "Doc";
  return "Other";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function todayStr(): string {
  const d = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ─── Initial Data ──────────────────────────────────────────────────────────────

function mapRecord(r: any): Material {
  const filename = r.file_url.split("/").pop() ?? r.id;
  const type = detectType(filename);
  return {
    id:           r.id,
    title:        decodeURIComponent(filename.replace(/\.[^.]+$/, "").replace(/-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/, "")) || r.id,
    description:  "",
    subject:      "",
    batch:        r.batch_name ?? "—",
    type,
    size:         "—",
    uploadedBy:   r.uploader_name ?? "—",
    uploadedById: r.created_by ?? "",
    date:         new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    downloads:    0,
    linkedTestId: null,
    url:          r.file_url,
  };
}

const emptyForm: UploadForm = {
  files: [], isLink: false, linkUrl: "", linkTitle: "",
  title: "", description: "", subject: "", batchId: "", linkedTestId: null,
};

// ─── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (materials: Material[]) => void;
}) {
  const [form, setForm] = useState<UploadForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live data
  const [batchOptions, setBatchOptions] = useState<{ id: string; name: string }[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [testOptions, setTestOptions] = useState<TestRow[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchClassBatchesApi(),
      fetchSubjectCatalogApi(),
      fetchTestsApi(),
    ])
      .then(([batches, subjects, tests]) => {
        setBatchOptions(batches);
        setSubjectOptions(subjects);
        // Only upcoming tests (test_date >= today)
        const today = new Date().toISOString().split("T")[0];
        setTestOptions(tests.filter((t) => t.test_date >= today));
      })
      .catch(() => setUploadError("Failed to load options."))
      .finally(() => setLoadingOptions(false));
  }, []);

  // Filter tests to selected batch
  const relevantTests = form.batchId
    ? testOptions.filter((t) => t.class_batch_id === form.batchId)
    : testOptions;

  const set = <K extends keyof UploadForm>(key: K) => (val: UploadForm[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    set("files")([...form.files, ...newFiles]);
    setErrors(e => ({ ...e, files: "" }));
    if (!form.title && newFiles.length === 1) {
      set("title")(newFiles[0].name.replace(/\.[^.]+$/, ""));
    }
  }

  function removeFile(i: number) {
    set("files")(form.files.filter((_, idx) => idx !== i));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.isLink && form.files.length === 0) e.files = "Please attach at least one file.";
    if (form.isLink && !form.linkUrl.trim()) e.linkUrl = "Please enter a URL.";
    if (form.isLink && !form.linkTitle.trim()) e.linkTitle = "Please enter a title for the link.";
    if (!form.batchId) e.batchId = "Please select a batch.";
    return e;
  }

  async function handleUpload() {
    const e = validate();
    if (Object.keys(e).filter(k => e[k]).length) { setErrors(e); return; }
    setUploading(true);
    setUploadError(null);

    try {
      const newMaterials: Material[] = [];

      if (form.isLink) {
        // For link type: use the linked_id as either the test id or batch id
        // Links are associated with an announcement or test; for now link to the
        // selected test if provided, else we store as ANNOUNCEMENT linked to a
        // placeholder. Since the backend requires linked_type + linked_id, and we
        // want to link to a test, we use TEST when a test is selected.
        const linked_id = form.linkedTestId ?? form.batchId;
        const linked_type = form.linkedTestId ? "TEST" : "ANNOUNCEMENT";

        // Link materials are stored as a URL — upload the metadata via the API
        // using a minimal text blob so the backend receives a file field.
        const blob = new Blob([form.linkUrl], { type: "text/plain" });
        const fileData: BlobPart[] = [blob];
        const fileOptions = { type: "text/plain" };
        const file = new (window.File as any)(fileData, `${form.linkTitle || "link"}.url.txt`, fileOptions) as File;

        const record = await uploadStudyMaterialApi({
          file,
          linked_type,
          linked_id,
          class_batch_id: form.batchId || null,
        });

        newMaterials.push({
          id: record.id as unknown as number,
          title: form.linkTitle,
          description: form.description,
          subject: form.subject,
          batch: batchOptions.find(b => b.id === form.batchId)?.name ?? "",
          type: "Link",
          size: "—",
          uploadedBy: record.uploader_name ?? "—",
          uploadedById: record.created_by ?? "",
          date: new Date(record.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          downloads: 0,
          linkedTestId: null,
          url: form.linkUrl,
        });
      } else {
        // Upload each file
        for (const f of form.files) {
          const linked_id = form.linkedTestId ?? form.batchId;
          const linked_type = form.linkedTestId ? "TEST" : "ANNOUNCEMENT";

          const record = await uploadStudyMaterialApi({
            file: f,
            linked_type,
            linked_id,
            class_batch_id: form.batchId || null,
          });

          newMaterials.push({
            id: record.id as unknown as number,
            title: form.title || f.name.replace(/\.[^.]+$/, ""),
            description: form.description,
            subject: form.subject,
            batch: batchOptions.find(b => b.id === form.batchId)?.name ?? "",
            type: detectType(f.name),
            size: formatBytes(f.size),
            uploadedBy: record.uploader_name ?? "—",
            uploadedById: record.created_by ?? "",
            date: new Date(record.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            downloads: 0,
            linkedTestId: null,
          });
        }
      }

      setSaved(true);
      setTimeout(() => { onUpload(newMaterials); }, 1000);
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#f0fdfa" }}>
            <CheckCircle2 size={28} color="#0d9488" strokeWidth={2} />
          </div>
          <p className="text-gray-900 mb-1" style={{ fontSize: "18px", fontWeight: 700 }}>
            {form.isLink ? "Link Added!" : `${form.files.length} File${form.files.length > 1 ? "s" : ""} Uploaded!`}
          </p>
          <p className="text-gray-400 text-center" style={{ fontSize: "13.5px" }}>
            Material is now available for {batchOptions.find(b => b.id === form.batchId)?.name ?? "the selected batch"}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-[580px] flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* Fixed header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Upload Study Material
            </h2>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "13px" }}>
              Add files or link resources for your batches.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-7 py-6 space-y-5 flex-1">

          {/* Toggle: File vs Link */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            {[
              { label: "Upload File(s)", value: false, icon: Upload },
              { label: "Add Link",       value: true,  icon: LinkIcon },
            ].map(({ label, value, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => { set("isLink")(value); setErrors({}); }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all"
                style={{
                  fontSize: "13px", fontWeight: 600,
                  backgroundColor: form.isLink === value ? "white" : "transparent",
                  color: form.isLink === value ? "#0d9488" : "#6b7280",
                  boxShadow: form.isLink === value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <Icon size={14} strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>

          {/* File upload area */}
          {!form.isLink && (
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                Files <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                className="border-2 border-dashed rounded-xl p-7 flex flex-col items-center gap-2.5 cursor-pointer transition-all"
                style={{
                  borderColor: dragOver ? "#0d9488" : errors.files ? "#fca5a5" : "#e5e7eb",
                  backgroundColor: dragOver ? "#f0fdfa" : errors.files ? "#fef9f9" : "#fafafa",
                }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#f0fdfa" }}>
                  <Paperclip size={20} color="#0d9488" strokeWidth={2} />
                </div>
                <p className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                  Click to browse or drag & drop files here
                </p>
                <p className="text-gray-400" style={{ fontSize: "12px" }}>
                  PDFs, videos, images, Word docs, and more — any format accepted
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*/*"
                  className="hidden"
                  onChange={e => addFiles(e.target.files)}
                />
              </div>
              {errors.files && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.files}</p>}

              {form.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.files.map((f, i) => {
                    const type = detectType(f.name);
                    const tc = typeConfig[type];
                    const Icon = tc.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-100 bg-white">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tc.bg }}>
                          <Icon size={14} style={{ color: tc.color }} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 truncate" style={{ fontSize: "13px", fontWeight: 500 }}>{f.name}</p>
                          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>{formatBytes(f.size)} · {tc.label}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Link fields */}
          {form.isLink && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Link Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.linkTitle}
                  onChange={e => { set("linkTitle")(e.target.value); setErrors(er => ({ ...er, linkTitle: "" })); }}
                  placeholder="e.g. NCERT Chemistry Chapter 6"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
                  style={{ fontSize: "13.5px" }}
                />
                {errors.linkTitle && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.linkTitle}</p>}
              </div>
              <div>
                <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={form.linkUrl}
                  onChange={e => { set("linkUrl")(e.target.value); setErrors(er => ({ ...er, linkUrl: "" })); }}
                  placeholder="https://…"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
                  style={{ fontSize: "13.5px", fontFamily: "monospace" }}
                />
                {errors.linkUrl && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.linkUrl}</p>}
              </div>
            </div>
          )}

          {/* Title (for files) */}
          {!form.isLink && (
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                Title <span className="text-gray-400" style={{ fontWeight: 400, fontSize: "12px" }}>(auto-filled from filename)</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => set("title")(e.target.value)}
                placeholder="e.g. Thermodynamics – Complete Notes"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
                style={{ fontSize: "13.5px" }}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Description <span className="text-gray-400" style={{ fontWeight: 400, fontSize: "12px" }}>(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set("description")(e.target.value)}
              placeholder="Brief description of what this material covers…"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all resize-none"
              style={{ fontSize: "13.5px", lineHeight: 1.6 }}
            />
          </div>

          {/* Subject + Batch row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                Subject
              </label>
              <select
                value={form.subject}
                onChange={e => set("subject")(e.target.value)}
                disabled={loadingOptions}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white disabled:opacity-50"
                style={{ fontSize: "13.5px", color: form.subject ? "#1f2937" : "#d1d5db" }}
              >
                <option value="">{loadingOptions ? "Loading…" : "Select subject"}</option>
                {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                Batch <span className="text-red-500">*</span>
              </label>
              <select
                value={form.batchId}
                onChange={e => {
                  set("batchId")(e.target.value);
                  set("linkedTestId")(null);
                  setErrors(er => ({ ...er, batchId: "" }));
                }}
                disabled={loadingOptions}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white disabled:opacity-50"
                style={{
                  fontSize: "13.5px",
                  color: form.batchId ? "#1f2937" : "#d1d5db",
                  borderColor: errors.batchId ? "#fca5a5" : "#e5e7eb",
                }}
              >
                <option value="">{loadingOptions ? "Loading…" : "Select batch"}</option>
                {batchOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.batchId && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.batchId}</p>}
            </div>
          </div>

          {/* Link to Test */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Link to Test
              <span className="text-gray-400 ml-1.5" style={{ fontWeight: 400, fontSize: "12px" }}>(optional — upcoming tests for this batch)</span>
            </label>
            <select
              value={form.linkedTestId ?? ""}
              onChange={e => set("linkedTestId")(e.target.value || null)}
              disabled={!form.batchId || loadingOptions}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontSize: "13.5px", color: form.linkedTestId ? "#1f2937" : "#d1d5db" }}
            >
              <option value="">
                {!form.batchId
                  ? "Select a batch first"
                  : relevantTests.length === 0
                  ? "No upcoming tests for this batch"
                  : "No test link (general material)"}
              </option>
              {relevantTests.map(t => (
                <option key={t.id} value={t.id}>
                  {t.test_name} · {t.subject} · {new Date(t.test_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </option>
              ))}
            </select>
            {form.linkedTestId && (() => {
              const linked = relevantTests.find(t => t.id === form.linkedTestId);
              return linked ? (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-md" style={{ backgroundColor: "#f0fdfa" }}>
                  <ClipboardList size={13} color="#0d9488" strokeWidth={2} />
                  <p className="text-teal-700" style={{ fontSize: "12px", fontWeight: 500 }}>
                    Linked to: {linked.test_name} · {linked.subject}
                  </p>
                </div>
              ) : null;
            })()}
          </div>

          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>
            <span className="text-red-400">*</span> Required fields
          </p>

          {uploadError && (
            <p className="text-red-500" style={{ fontSize: "12.5px" }}>{uploadError}</p>
          )}
        </div>

        {/* Fixed footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            style={{ fontSize: "13.5px", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || loadingOptions}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            <Upload size={15} strokeWidth={2.5} />
            {uploading
              ? "Uploading…"
              : form.isLink
              ? "Add Link"
              : `Upload${form.files.length > 1 ? ` ${form.files.length} Files` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
  

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ title, onClose, onConfirm }: { title: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fef2f2" }}>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div>
            <h3 className="text-gray-900 mb-1" style={{ fontSize: "16px", fontWeight: 700 }}>Delete Material?</h3>
            <p className="text-gray-400" style={{ fontSize: "13.5px", lineHeight: 1.6 }}>
              <strong className="text-gray-700">"{title}"</strong> will be permanently removed and students will lose access.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: "#ef4444", fontSize: "13.5px", fontWeight: 600 }}
          >
            Yes, Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
            style={{ fontSize: "13.5px", fontWeight: 500 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  material,
  onClose,
  onDelete,
  canManage,
  currentUserId,
  currentUserRoleId,
}: {
  material: Material;
  onClose: () => void;
  onDelete: () => void;
  canManage: boolean;
  currentUserId?: string;
  currentUserRoleId?: number;
}) {
  // Teachers may only delete their own uploads; Admin/Management can delete any
  const canDelete = canManage && (
    currentUserRoleId !== ROLES.TEACHER ||
    material.uploadedById === currentUserId
  );
  const tc = typeConfig[material.type];
  const sc = subjectColors[material.subject] ?? { color: "#0d9488", bg: "#f0fdfa" };
  const Icon = tc.icon;
  // linkedTestId is now a string UUID; the detail panel shows what was passed through
  const linkedTestId = material.linkedTestId;
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit sticky top-8" style={{ minWidth: 0 }}>
      {/* Top bar */}
      <div className="flex items-start justify-between gap-2 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tc.bg }}>
            <Icon size={18} style={{ color: tc.color }} strokeWidth={2} />
          </div>
          <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 700, color: tc.color, backgroundColor: tc.bg }}>
            {material.type}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {canDelete && (
            <button
              onClick={() => setShowDelete(true)}
              className="w-8 h-8 rounded-md flex items-center justify-center border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition-all"
              title="Delete material"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center border border-gray-200 text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-gray-900 mb-2" style={{ fontSize: "17px", fontWeight: 700, lineHeight: 1.4 }}>
        {material.title}
      </h2>

      {/* Description */}
      {material.description && (
        <p className="text-gray-500 mb-5 leading-relaxed" style={{ fontSize: "13.5px", lineHeight: 1.7 }}>
          {material.description}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mb-6">
        {material.type === "Link" ? (
          <a
            href={material.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-teal-200 text-teal-700 hover:bg-teal-50 transition-all"
            style={{ fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
          >
            <ExternalLink size={13} strokeWidth={2} />
            Open Link
          </a>
        ) : (
          <>
            <a
              href={material.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
              style={{ fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
            >
              <Eye size={13} strokeWidth={2} />
              Preview
            </a>
            <a
              href={material.url ?? "#"}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-teal-200 text-teal-700 hover:bg-teal-50 transition-all"
              style={{ fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
            >
              <Download size={13} strokeWidth={2} />
              Download
            </a>
          </>
        )}
      </div>

      {/* Meta */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400">
            <BookOpen size={12} />
            <span style={{ fontSize: "12.5px" }}>Subject</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: sc.color, backgroundColor: sc.bg }}>
            {material.subject || "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Users2 size={12} />
            <span style={{ fontSize: "12.5px" }}>Batch</span>
          </div>
          <span className="text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{material.batch}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400">
            <User size={12} />
            <span style={{ fontSize: "12.5px" }}>Uploaded by</span>
          </div>
          <span className="text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{material.uploadedBy}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Calendar size={12} />
            <span style={{ fontSize: "12.5px" }}>Date</span>
          </div>
          <span className="text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{material.date}</span>
        </div>
        {material.size !== "—" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-400">
              <HardDrive size={12} />
              <span style={{ fontSize: "12.5px" }}>Size</span>
            </div>
            <span className="text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{material.size}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Download size={12} />
            <span style={{ fontSize: "12.5px" }}>Downloads</span>
          </div>
          <span className="text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{material.downloads}</span>
        </div>

        {/* Linked test */}
        {linkedTestId && (
          <div className="flex items-start justify-between gap-3 pt-3 mt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
              <ClipboardList size={12} />
              <span style={{ fontSize: "12.5px" }}>Linked test</span>
            </div>
            <div className="text-right">
              <p className="text-teal-700" style={{ fontSize: "12.5px", fontWeight: 700 }}>Test linked</p>
              <p className="text-gray-400" style={{ fontSize: "11.5px" }}>{String(linkedTestId).slice(0, 8)}…</p>
            </div>
          </div>
        )}
      </div>

      {showDelete && (
        <DeleteModal
          title={material.title}
          onClose={() => setShowDelete(false)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}

// ─── Main Study Materials Page ─────────────────────────────────────────────────

export function StudyMaterials({ canManage = true }: { canManage?: boolean }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [selected, setSelected] = useState<Material | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const session = getSession();
  const currentUserId = session?.payload.user_id;
  const currentUserRoleId = session?.payload.role_id;

  function handlePreview(mat: Material) {
    if (!mat.url) return;
    window.open(mat.url, "_blank", "noopener,noreferrer");
  }

  async function handleDownload(mat: Material) {
    if (!mat.url) return;
    try {
      const token = getSession()?.token;
      const res = await fetch(`/api/study-materials/${mat.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to get download URL");
      const json = await res.json();
      const signedUrl: string = json.data?.url;
      if (!signedUrl) throw new Error("No URL returned");
      // Open the presigned URL — browser will download due to Content-Disposition: attachment
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      // Fallback: open the public URL directly
      window.open(mat.url, "_blank", "noopener,noreferrer");
    }
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    setLoading(true);
    setLoadError(null);
    try {
      const records = await fetchStudyMaterialsApi();
      setMaterials(records.map(mapRecord));
    } catch (err: any) {
      setLoadError(err.message ?? "Failed to load study materials");
    } finally {
      setLoading(false);
    }
  }

  const filtered = materials.filter(m => {
    const matchType  = typeFilter  === "All" || m.type  === typeFilter;
    const matchBatch = batchFilter === "All" || m.batch === batchFilter;
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.batch.toLowerCase().includes(search.toLowerCase());
    return matchType && matchBatch && matchSearch;
  });

  async function handleUpload(newMats: Material[]) {
    await loadMaterials();
    setShowUpload(false);
  }

  async function handleDelete(id: number) {
    try {
      await deleteStudyMaterialApi(String(id));
    } catch (err: any) {
      console.error("Delete failed:", err.message);
    }
    setMaterials(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
    setDeleteTarget(null);
  }

  const totalDownloads = materials.reduce((a, b) => a + b.downloads, 0);

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Study Materials
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {materials.length} resources · {totalDownloads} total downloads
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Upload Material
          </button>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "PDFs",   value: materials.filter(m => m.type === "PDF").length,   color: "#ea580c", bg: "#fff7ed" },
          { label: "Videos", value: materials.filter(m => m.type === "Video").length, color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Links",  value: materials.filter(m => m.type === "Link").length,  color: "#0369a1", bg: "#f0f9ff" },
          { label: "Others", value: materials.filter(m => !["PDF","Video","Link"].includes(m.type)).length, color: "#6b7280", bg: "#f9fafb" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>{label}</p>
            <p style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color, lineHeight: 1.2, marginTop: "4px" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 relative" style={{ minWidth: "220px" }}>
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, subject, or batch…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm"
            style={{ fontSize: "13.5px" }}
          />
        </div>

        {/* Type pills */}
        <div className="flex gap-2">
          {["All", "PDF", "Video", "Image", "Link", "Doc"].map(f => {
            const isActive = typeFilter === f;
            const tc = f !== "All" ? typeConfig[f as MaterialType] : null;
            return (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className="px-3.5 py-2.5 rounded-xl border shadow-sm transition-colors"
                style={{
                  fontSize: "12.5px", fontWeight: 600,
                  backgroundColor: isActive ? (tc?.color ?? "#0d9488") : "white",
                  color: isActive ? "white" : (tc?.color ?? "#6b7280"),
                  borderColor: isActive ? (tc?.color ?? "#0d9488") : "#f3f4f6",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* Batch dropdown */}
        <div className="relative">
          <select
            value={batchFilter}
            onChange={e => setBatchFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-100 rounded-xl pl-4 pr-8 py-2.5 text-gray-600 shadow-sm focus:outline-none focus:border-teal-300 transition-colors"
            style={{ fontSize: "12.5px", fontWeight: 500 }}
          >
            <option value="All">All Batches</option>
            {materials
              .map(m => m.batch)
              .filter((b, i, arr) => b && b !== "—" && arr.indexOf(b) === i)
              .map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Two-column layout when detail panel open */}
      {loadError && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-500" style={{ fontSize: "13px" }}>
          {loadError}
        </div>
      )}
      <div className="flex gap-6 items-start">
        {/* Table */}
        <div className={`transition-all duration-300 ${selected ? "flex-1 min-w-0" : "w-full"}`}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-gray-400" style={{ fontSize: "14px" }}>Loading study materials…</div>
            ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  {["Material", "Subject", "Batch", "Type", "Size", "Uploaded By", "Date", ""].map(col => (
                    <th
                      key={col}
                      className="text-left px-5 py-3 text-gray-400"
                      style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.04em" }}
                    >
                      {col.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <p className="text-gray-300" style={{ fontSize: "14px" }}>No materials found.</p>
                    </td>
                  </tr>
                )}
                {filtered.map(mat => {
                  const sc = subjectColors[mat.subject] ?? { color: "#0d9488", bg: "#f0fdfa" };
                  const tc = typeConfig[mat.type];
                  const Icon = tc.icon;
                  const isSelected = selected?.id === mat.id;
                  return (
                    <tr
                      key={mat.id}
                      onClick={() => setSelected(isSelected ? null : mat)}
                      className={`border-t border-gray-50 transition-colors cursor-pointer group ${
                        isSelected ? "bg-teal-50" : "hover:bg-teal-50"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tc.bg }}>
                            <Icon size={15} style={{ color: tc.color }} strokeWidth={2} />
                          </div>
                          <span
                            className={`${isSelected ? "text-teal-700" : "text-gray-800 group-hover:text-teal-700"} transition-colors`}
                            style={{ fontSize: "13.5px", fontWeight: 600 }}
                          >
                            {mat.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: sc.color, backgroundColor: sc.bg }}>
                          {mat.subject || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-400" style={{ fontSize: "12.5px" }}>{mat.batch}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: tc.color, backgroundColor: tc.bg }}>
                          {mat.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-400" style={{ fontSize: "13px" }}>{mat.size}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-400" style={{ fontSize: "12.5px" }}>{mat.uploadedBy}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-400" style={{ fontSize: "12.5px" }}>{mat.date}</span>
                      </td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePreview(mat); }}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Preview"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(mat); }}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                          {canManage && (
                            currentUserRoleId !== ROLES.TEACHER || mat.uploadedById === currentUserId
                          ) && (
                            <button
                              onClick={() => setDeleteTarget(mat)}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: "320px", flexShrink: 0 }}>
            <DetailPanel
              material={selected}
              onClose={() => setSelected(null)}
              onDelete={() => handleDelete(selected.id)}
              canManage={canManage}
              currentUserId={currentUserId}
              currentUserRoleId={currentUserRoleId}
            />
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteModal
          title={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}
    </div>
  );
}
