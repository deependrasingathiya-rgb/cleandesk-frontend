// src/app/pages/Tests.tsx

import { useState, useRef, useEffect } from "react";
import {
  createTestApi,
  fetchTestsApi,
  fetchTestDetailApi,
  fetchTestBatchStudentsApi,
  deleteTestApi,
  updateTestApi,
  bulkSubmitMarksApi,
  type TestRow,
  type TestDetailRow,
  type BatchStudentRow,
} from "../../Lib/api/tests";
import { fetchClassBatchesApi } from "../../Lib/api/teachers";
import { fetchSubjectCatalogApi, addSubjectApi } from "../../Lib/api/subjects";
import {
  Search,
  Plus,
  ClipboardList,
  Calendar,
  ArrowLeft,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Paperclip,
  FileText,
  Video,
  Image,
  File,
  ChevronDown,
  Award,
  BookOpen,
  Clock,
  Users2,
  Check,
  TrendingUp,
  UploadCloud,
  AlertCircle,
} from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────────



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
  "Computer Science": { color: "#4f46e5", bg: "#eef2ff" },
  Economics:        { color: "#be185d", bg: "#fdf2f8" },
};

// ─── Types ─────────────────────────────────────────────────────────────────────

// Derived from test_date vs today + whether marks records exist in DB
// "Upcoming"        → test_date >= today
// "Marks Pending"   → test_date < today, NO marks records exist for this test
// "Marks Submitted" → test_date < today, marks records EXIST for this test
type TestStatus = "Upcoming" | "Marks Pending" | "Marks Submitted";

type AttachedFile = {
  name: string;
  size: string;
  type: "pdf" | "image" | "video" | "other";
};

type StudentMark = {
  studentId: string;
  studentName: string;
  mobile: string | null;
  score: number | null;
};

type Test = {
  id: string;
  name: string;
  subject: string;
  batchId: string;
  batchName: string;
  syllabus: string;
  date: string;
  testTime: string | null;
  durationMinutes: number | null;
  totalMarks: number;
  createdBy: string;
  attachments: AttachedFile[];
  marks: StudentMark[] | null;
  hasMarks: boolean;
};

type TestForm = {
  name: string;
  subject: string;
  batches: string[];
  syllabus: string;
  date: string;
  testTime: string;
  durationMinutes: number | "";
  totalMarks: number;
  attachments: AttachedFile[];
};

// ─── Derive status helper ──────────────────────────────────────────────────────

function deriveStatus(test: Test): TestStatus {
  const now = new Date();

  // If test has both a date and a time+duration, we can compute the precise end moment.
  // A test is "Upcoming" only until its end time (start + duration) has passed.
  // If time is set but duration is not (or vice versa), we fall back to date-only comparison
  // so partial data never causes a wrong flip.
  if (test.testTime && test.durationMinutes) {
    // test.date is "YYYY-MM-DD", test.testTime is "HH:MM:SS" (Postgres time type)
    const [hours, minutes] = test.testTime.split(":").map(Number);
    const testStart = new Date(test.date);
    testStart.setHours(hours, minutes, 0, 0);
    const testEnd = new Date(testStart.getTime() + test.durationMinutes * 60 * 1000);
    if (now < testEnd) return "Upcoming";
  } else {
    // Fallback: date-only — treat entire day as upcoming
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const testDate = new Date(test.date);
    testDate.setHours(0, 0, 0, 0);
    if (testDate >= today) return "Upcoming";
  }

  if (!test.hasMarks) return "Marks Pending";
  return "Marks Submitted";
}


function mapRowToTest(row: TestRow): Test {
  return {
    id: row.id,
    name: row.test_name,
    subject: row.subject,
    batchId: row.class_batch_id,
    batchName: row.batch_name,
    syllabus: row.syllabus_text ?? "",
    date: row.test_date,
    testTime: row.test_time,
    durationMinutes: row.duration_minutes,
    totalMarks: Number(row.total_marks),
    createdBy: row.created_by_name ?? "—",
    attachments: [],
    marks: null,
    hasMarks: row.has_marks,
  };
}

const emptyForm: TestForm = {
  name: "", subject: "", batches: [], syllabus: "", date: "",
  testTime: "", durationMinutes: "", totalMarks: 100, attachments: [],
};

// ─── File helpers ──────────────────────────────────────────────────────────────

function getFileIcon(type: AttachedFile["type"]) {
  if (type === "pdf") return FileText;
  if (type === "image") return Image;
  if (type === "video") return Video;
  return File;
}

function getFileColor(type: AttachedFile["type"]) {
  if (type === "pdf")   return { color: "#ea580c", bg: "#fff7ed" };
  if (type === "image") return { color: "#2563eb", bg: "#eff6ff" };
  if (type === "video") return { color: "#7c3aed", bg: "#f5f3ff" };
  return { color: "#6b7280", bg: "#f9fafb" };
}

function detectFileType(filename: string): AttachedFile["type"] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  return "other";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Status badge config ───────────────────────────────────────────────────────

function getStatusStyle(status: TestStatus) {
  if (status === "Upcoming")
    return { color: "#2563eb", bg: "#eff6ff", label: "Upcoming" };
  if (status === "Marks Pending")
    return { color: "#d97706", bg: "#fffbeb", label: "Marks Pending" };
  return { color: "#16a34a", bg: "#f0fdf4", label: "Marks Submitted" };
}

// ─── Shared UI Atoms ───────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── Batch Multi-Select Dropdown ───────────────────────────────────────────────

function BatchMultiSelect({
  selected,
  onChange,
  options,
  loading,
}: {
  selected: string[];
  onChange: (batches: string[]) => void;
  options: { id: string; name: string }[];
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  function toggle(batchId: string) {
    if (selected.includes(batchId)) {
      onChange(selected.filter((b) => b !== batchId));
    } else {
      onChange([...selected, batchId]);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !loading && setOpen((o) => !o)}
        disabled={loading}
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white disabled:opacity-50"
        style={{ fontSize: "13.5px" }}
      >
        <span className={selected.length === 0 ? "text-gray-300" : "text-gray-800"}>
          {loading
            ? "Loading batches…"
            : selected.length === 0
            ? "Select batches…"
            : selected.length === 1
            ? (options.find((o) => o.id === selected[0])?.name ?? selected[0])
            : `${selected.length} batches selected`}
        </span>
        <ChevronDown
          size={14}
          className="text-gray-400 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1.5 w-full bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden"
          style={{ maxHeight: "220px", overflowY: "auto" }}
        >
          {options.map((batch) => {
            const isSelected = selected.includes(batch.id);
            return (
              <button
                key={batch.id}
                type="button"
                onClick={() => toggle(batch.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 transition-colors text-left"
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    border: isSelected ? "none" : "2px solid #d1d5db",
                    backgroundColor: isSelected ? "#0d9488" : "transparent",
                  }}
                >
                  {isSelected && <Check size={10} color="white" strokeWidth={3} />}
                </div>
                <span
                  className="text-gray-700"
                  style={{ fontSize: "13px", fontWeight: isSelected ? 600 : 400 }}
                >
                  {batch.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
              style={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#f0fdfa", color: "#0d9488" }}
            >
              {options.find((o) => o.id === id)?.name ?? id}
              <button type="button" onClick={() => toggle(id)} className="hover:text-teal-700">
                <X size={10} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── File Attachment Area ──────────────────────────────────────────────────────

function FileAttachArea({
  files,
  onChange,
}: {
  files: AttachedFile[];
  onChange: (files: AttachedFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles: AttachedFile[] = Array.from(fileList).map((f) => ({
      name: f.name,
      size: formatFileSize(f.size),
      type: detectFileType(f.name),
    }));
    onChange([...files, ...newFiles]);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-teal-300 hover:bg-teal-50 transition-all"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#f0fdfa" }}>
          <Paperclip size={18} color="#0d9488" strokeWidth={2} />
        </div>
        <p className="text-gray-600" style={{ fontSize: "13.5px", fontWeight: 600 }}>
          Click to browse or drag files here
        </p>
        <p className="text-gray-400" style={{ fontSize: "12px" }}>
          PDFs, images, videos and other documents supported
        </p>
        <input ref={inputRef} type="file" multiple accept="*/*" className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, i) => {
            const FileIcon = getFileIcon(f.type);
            const fc = getFileColor(f.type);
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-100 bg-white">
                <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: fc.bg }}>
                  <FileIcon size={14} style={{ color: fc.color }} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 truncate" style={{ fontSize: "13px", fontWeight: 500 }}>{f.name}</p>
                  <p className="text-gray-400" style={{ fontSize: "11.5px" }}>{f.size}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, idx) => idx !== i))}
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
  );
}

// ─── Create / Edit Test Form ───────────────────────────────────────────────────

function TestFormView({
  initial,
  onBack,
  onSubmit,
  mode,
}: {
  initial: TestForm;
  onBack: () => void;
  onSubmit: (f: TestForm, createdIds: string[]) => void;
  mode: "create" | "edit";
}) {
  const [form, setForm] = useState<TestForm>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof TestForm, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Live batch options
  const [batchOptions, setBatchOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Live subject catalog
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [addingSubject, setAddingSubject] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [showAddSubject, setShowAddSubject] = useState(false);

  useEffect(() => {
    fetchClassBatchesApi()
      .then((list) => setBatchOptions(list))
      .catch(() => setApiError("Failed to load batches."))
      .finally(() => setLoadingBatches(false));

    fetchSubjectCatalogApi()
      .then((list) => setSubjectOptions(list))
      .catch(() => setApiError("Failed to load subjects."))
      .finally(() => setLoadingSubjects(false));
  }, []);

  async function handleAddSubject() {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;
    setAddingSubject(true);
    try {
      const updated = await addSubjectApi(trimmed);
      setSubjectOptions(updated);
      set("subject")(trimmed);
      setNewSubjectInput("");
      setShowAddSubject(false);
    } catch (err: any) {
      setApiError(err.message ?? "Failed to add subject.");
    } finally {
      setAddingSubject(false);
    }
  }

  const set = <K extends keyof TestForm>(key: K) =>
    (val: TestForm[K]) => setForm((f) => ({ ...f, [key]: val }));

  // ── Date / time boundary helpers ──────────────────────────────────────────
  // Always computed fresh so the UI stays accurate without a re-render clock.
  // Uses YYYY-MM-DD format required by HTML date inputs.
  function getTodayIso(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function getMinDate(): string {
    const today = getTodayIso();
    // In edit mode: if the saved date is already in the past, keep it as the
    // floor so the form stays valid — but don't let them pick a different past date.
    if (mode === "edit" && initial.date && initial.date < today) return initial.date;
    return today;
  }

  function getMinTime(): string | undefined {
    // Only restrict time when the chosen date is today.
    if (form.date !== getTodayIso()) return undefined;
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, "0");
    const mnt = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mnt}`;
  }

  function validate() {
    const e: Partial<Record<keyof TestForm, string>> = {};
    if (!form.name.trim()) e.name = "Test name is required.";
    if (!form.subject) e.subject = "Subject is required.";
    if (form.batches.length === 0) e.batches = "Select at least one batch.";
    if (!form.date) e.date = "Test date is required.";
    if (!form.totalMarks || form.totalMarks <= 0) e.totalMarks = "Total marks must be greater than 0.";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setApiError(null);
    try {
      const result = await createTestApi({
        test_name: form.name.trim(),
        subject: form.subject,
        syllabus_text: form.syllabus.trim() || undefined,
        test_date: form.date,
        test_time: form.testTime || undefined,
        duration_minutes: form.durationMinutes !== "" ? Number(form.durationMinutes) : undefined,
        total_marks: form.totalMarks,
        class_batch_ids: form.batches,
      });
      setSubmitted(true);
      setTimeout(() => onSubmit(form, result.data.map((d) => d.id)), 1000);
    } catch (err: any) {
      setApiError(err.message ?? "Failed to create test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="p-8 max-w-[600px] mx-auto flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#f0fdfa" }}>
          <CheckCircle2 size={32} color="#0d9488" strokeWidth={2} />
        </div>
        <h2 className="text-gray-900 mb-2" style={{ fontSize: "20px", fontWeight: 700 }}>
          {mode === "create" ? "Test Created!" : "Test Updated!"}
        </h2>
        <p className="text-gray-400 text-center" style={{ fontSize: "14px" }}>
          {form.name} has been {mode === "create" ? "scheduled" : "updated"} successfully.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[720px] mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {mode === "create" ? "Create New Test" : "Edit Test"}
          </h1>
          <p className="text-gray-400 mt-0.5" style={{ fontSize: "13.5px" }}>
            {mode === "create"
              ? "Schedule a test and assign it to one or more batches."
              : "Update the details of this test."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <p className="text-gray-400 uppercase mb-5" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em" }}>
          Test Details
        </p>

        {/* Test Name */}
        <div className="mb-5">
          <FieldLabel required>Test Name</FieldLabel>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. Mid-Term Physics"
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
            style={{ fontSize: "13.5px" }}
          />
          {errors.name && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-5 mb-5">
          {/* Subject */}
          <div>
            <FieldLabel required>Subject</FieldLabel>
            {loadingSubjects ? (
              <div className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-400" style={{ fontSize: "13.5px" }}>
                Loading subjects…
              </div>
            ) : (
              <>
                <select
                  value={form.subject}
                  onChange={(e) => {
                    if (e.target.value === "__add_new__") {
                      setShowAddSubject(true);
                    } else {
                      set("subject")(e.target.value);
                      setShowAddSubject(false);
                    }
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white"
                  style={{ fontSize: "13.5px", color: form.subject ? "#1f2937" : "#d1d5db" }}
                >
                  <option value="" disabled>Select a subject</option>
                  {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="__add_new__">+ Add new subject…</option>
                </select>

                {showAddSubject && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newSubjectInput}
                      onChange={(e) => setNewSubjectInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubject(); } }}
                      placeholder="e.g. Political Science"
                      className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
                      style={{ fontSize: "13px" }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddSubject}
                      disabled={addingSubject || !newSubjectInput.trim()}
                      className="px-4 py-2 rounded-xl text-white transition-all disabled:opacity-50"
                      style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#0d9488" }}
                    >
                      {addingSubject ? "Adding…" : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddSubject(false); setNewSubjectInput(""); }}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 transition-all"
                      style={{ fontSize: "13px" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
            {errors.subject && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.subject}</p>}
          </div>

          {/* Test Date */}
          <div>
            <FieldLabel required>Test Date</FieldLabel>
            <input
              type="date"
              value={form.date}
              min={getMinDate()}
              onChange={(e) => set("date")(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white"
              style={{ fontSize: "13.5px" }}
            />
            {errors.date && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.date}</p>}
          </div>
        </div>

{/* Time & Duration */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div>
            <FieldLabel>Test Time</FieldLabel>
            <input
              type="time"
              value={form.testTime}
              min={getMinTime()}
              onChange={(e) => set("testTime")(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white"
              style={{ fontSize: "13.5px" }}
            />
          </div>
          <div>
            <FieldLabel>Duration (minutes)</FieldLabel>
            <input
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes")(e.target.value === "" ? "" : Number(e.target.value) as any)}
              placeholder="e.g. 90"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
              style={{ fontSize: "13.5px" }}
            />
          </div>
        </div>

        {/* Total Marks */}
        <div className="mb-5">
          <FieldLabel required>Total Marks</FieldLabel>
          <input
            type="number"
            min={1}
            value={form.totalMarks}
            onChange={(e) => set("totalMarks")(Number(e.target.value))}
            placeholder="e.g. 100"
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
            style={{ fontSize: "13.5px" }}
          />
          {errors.totalMarks && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.totalMarks}</p>}
        </div>

        {/* Batches */}
        <div className="mb-5">
          <FieldLabel required>Assign to Batches</FieldLabel>
          <BatchMultiSelect
            selected={form.batches}
            onChange={set("batches")}
            options={batchOptions}
            loading={loadingBatches}
          />
          {errors.batches && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.batches}</p>}
        </div>

        {/* Syllabus */}
        <div className="mb-6">
          <FieldLabel>Syllabus / Topics Covered</FieldLabel>
          <textarea
            value={form.syllabus}
            onChange={(e) => set("syllabus")(e.target.value)}
            placeholder="Describe the chapters, topics, or units this test covers…"
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all resize-none"
            style={{ fontSize: "13.5px", lineHeight: 1.6 }}
          />
        </div>

        {/* Attachments */}
        <div className="border-t border-gray-50 pt-6 mb-8">
          <p className="text-gray-400 uppercase mb-4" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em" }}>
            Study Material / Attachments
          </p>
          <FileAttachArea files={form.attachments} onChange={set("attachments")} />
        </div>

        <p className="text-gray-400 mb-6" style={{ fontSize: "12px" }}>
          <span className="text-red-400">*</span> Required fields
        </p>

        {apiError && (
          <p className="text-red-500 mb-4" style={{ fontSize: "12.5px" }}>{apiError}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingBatches}
            className="px-6 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {submitting ? "Creating…" : mode === "create" ? "Create Test" : "Save Changes"}
          </button>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
            style={{ fontSize: "13.5px", fontWeight: 500 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Marks Entry View ──────────────────────────────────────────────────────────
// Used for both "Enter Marks" (first time) and "Modify Marks" (edit existing)

function MarksEntryView({
  test,
  onBack,
  onSave,
  mode,
}: {
  test: Test;
  onBack: () => void;
  onSave: (marks: StudentMark[]) => void;
  mode: "enter" | "modify";
}) {
  const sc = subjectColors[test.subject] ?? { color: "#0d9488", bg: "#f0fdfa" };

  const [students, setStudents] = useState<BatchStudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [absent, setAbsent] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTestBatchStudentsApi(test.id)
      .then((list) => {
        setStudents(list);
        // Pre-fill from existing marks if modifying
        if (mode === "modify" && test.marks) {
          const prefill: Record<string, string> = {};
          const absentSet = new Set<string>();
          list.forEach((s) => {
            const existing = test.marks!.find((m) => m.studentId === s.student_id);
            if (existing) {
              if (existing.score === null) absentSet.add(s.student_id);
              else prefill[s.student_id] = String(existing.score);
            }
          });
          setMarks(prefill);
          setAbsent(absentSet);
        } else {
          const prefill: Record<string, string> = {};
          list.forEach((s) => { prefill[s.student_id] = ""; });
          setMarks(prefill);
        }
      })
      .catch((err) => setLoadError(err.message ?? "Failed to load students"))
      .finally(() => setLoadingStudents(false));
  }, [test.id]);

  function toggleAbsent(id: string) {
    setAbsent((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setMarks((m) => ({ ...m, [id]: "" }));
        setErrors((e) => { const c = { ...e }; delete c[id]; return c; });
      }
      return next;
    });
  }

  async function handleSave() {
    const e: Record<string, string> = {};
    students.forEach((s) => {
      if (absent.has(s.student_id)) return;
      const v = marks[s.student_id];
      if (v === "" || v === undefined) { e[s.student_id] = "Required"; return; }
      const n = Number(v);
      if (isNaN(n) || n < 0) { e[s.student_id] = "Invalid"; return; }
      if (n > test.totalMarks) { e[s.student_id] = `Max ${test.totalMarks}`; return; }
    });
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    try {
      const entries = students.map((s) => ({
        student_id: s.student_id,
        score: absent.has(s.student_id) ? null : Number(marks[s.student_id]),
      }));
      await bulkSubmitMarksApi(test.id, entries, mode);
      setSaved(true);
      const result: StudentMark[] = students.map((s) => ({
        studentId: s.student_id,
        studentName: s.full_name,
        mobile: s.mobile,
        score: absent.has(s.student_id) ? null : Number(marks[s.student_id]),
      }));
      setTimeout(() => onSave(result), 1200);
    } catch (err: any) {
      setErrors({ _form: err.message ?? "Failed to submit marks" });
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <div className="p-8 max-w-[600px] mx-auto flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#f0fdfa" }}>
          <CheckCircle2 size={32} color="#0d9488" strokeWidth={2} />
        </div>
        <h2 className="text-gray-900 mb-2" style={{ fontSize: "20px", fontWeight: 700 }}>
          Marks {mode === "enter" ? "Submitted" : "Updated"}!
        </h2>
        <p className="text-gray-400 text-center" style={{ fontSize: "14px" }}>
          Marks for <strong className="text-gray-700">{test.name}</strong> have been recorded successfully.
        </p>
      </div>
    );
  }

  const presentCount = students.length - absent.size;

  return (
    <div className="p-8 max-w-[800px] mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors"
        style={{ fontSize: "13.5px", fontWeight: 500 }}
      >
        <ArrowLeft size={15} />
        Back to Test Details
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: sc.bg }}>
              <Award size={22} style={{ color: sc.color }} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-gray-900" style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                {mode === "enter" ? "Enter Marks" : "Modify Marks"}
              </h1>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: "13.5px" }}>
                {test.name} · {test.subject} · Total: <strong className="text-gray-700">{test.totalMarks}</strong> marks
              </p>
            </div>
          </div>
          {mode === "modify" && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: "#fffbeb" }}
            >
              <AlertCircle size={13} color="#d97706" strokeWidth={2} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#d97706" }}>
                Editing existing marks
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Marks table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 border-b border-gray-50 flex items-center justify-between"
          style={{ backgroundColor: "#f9fafb" }}
        >
          <p className="text-gray-500" style={{ fontSize: "13px", fontWeight: 600 }}>
            {students.length} Students
            {absent.size > 0 && (
              <span className="ml-2 text-red-400" style={{ fontSize: "12px", fontWeight: 500 }}>
                · {absent.size} absent
              </span>
            )}
          </p>
          <p className="text-gray-400" style={{ fontSize: "12.5px" }}>
            Entering marks for <strong className="text-gray-700">{presentCount}</strong> present students
          </p>
        </div>

        {loadError && (
          <div className="px-6 py-3 text-red-500 text-sm">{loadError}</div>
        )}
        {errors._form && (
          <div className="px-6 py-3 text-red-500 text-sm">{errors._form}</div>
        )}
        <div className="divide-y divide-gray-50">
          {loadingStudents ? (
            <div className="px-6 py-8 text-center text-gray-400" style={{ fontSize: "13.5px" }}>Loading students…</div>
          ) : students.map((student) => {
            const initials = student.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
            const err = errors[student.student_id];
            const isAbsent = absent.has(student.student_id);
            return (
              <div
                key={student.student_id}
                className="flex items-center gap-4 px-6 py-4 transition-colors"
                style={{ backgroundColor: isAbsent ? "#fffafa" : "white" }}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: isAbsent ? "#fee2e2" : "#f0fdfa" }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, color: isAbsent ? "#dc2626" : "#0d9488" }}>
                    {initials}
                  </span>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-gray-800"
                    style={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      textDecoration: isAbsent ? "line-through" : "none",
                      color: isAbsent ? "#9ca3af" : "#1f2937",
                    }}
                  >
                    {student.full_name}
                  </p>
                  <p className="text-gray-400" style={{ fontSize: "12px" }}>
                    {student.mobile ?? "—"}
                  </p>
                </div>

                {/* Score input or Absent badge */}
                <div className="flex items-center gap-2">
                  {isAbsent ? (
                    <span
                      className="px-3 py-1.5 rounded-xl"
                      style={{ fontSize: "12.5px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fee2e2", minWidth: "80px", textAlign: "center" }}
                    >
                      Absent
                    </span>
                  ) : (
                    <>
                      <input
                        type="number"
                        min={0}
                        max={test.totalMarks}
                        value={marks[student.student_id] ?? ""}
                  onChange={(e) => {
                    setMarks((m) => ({ ...m, [student.student_id]: e.target.value }));
                    setErrors((er) => { const c = { ...er }; delete c[student.student_id]; return c; });
                        }}
                        placeholder="—"
                        className="w-20 border rounded-xl px-3 py-2 text-center focus:outline-none focus:border-teal-400 transition-all"
                        style={{
                          fontSize: "14px", fontWeight: 600,
                          borderColor: err ? "#fca5a5" : "#e5e7eb",
                          backgroundColor: err ? "#fef2f2" : "white",
                        }}
                      />
                      <span className="text-gray-400" style={{ fontSize: "13px" }}>/ {test.totalMarks}</span>
                    </>
                  )}
                  {err && !isAbsent && (
                    <span className="text-red-400" style={{ fontSize: "11.5px", fontWeight: 600, minWidth: "60px" }}>
                      {err}
                    </span>
                  )}
                </div>

                {/* Absent toggle */}
                <button
                  onClick={() => toggleAbsent(student.student_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all flex-shrink-0"
                  style={{
                    fontSize: "12px", fontWeight: 600,
                    borderColor: isAbsent ? "#fca5a5" : "#f3f4f6",
                    backgroundColor: isAbsent ? "#fef2f2" : "white",
                    color: isAbsent ? "#dc2626" : "#9ca3af",
                  }}
                >
                  <X size={11} strokeWidth={2.5} />
                  {isAbsent ? "Undo" : "Absent"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleSave}
            disabled={submitting || loadingStudents}
            className="px-6 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {submitting ? "Submitting…" : mode === "enter" ? "Submit All Marks" : "Save Changes"}
          </button>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
            style={{ fontSize: "13.5px", fontWeight: 500 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Test Detail View ──────────────────────────────────────────────────────────

function TestDetail({
  test,
  onBack,
  onEdit,
  onDelete,
  onEnterMarks,
  onModifyMarks,
  onUploadMaterial,
  canManage,
}: {
  test: Test;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEnterMarks: () => void;
  onModifyMarks: () => void;
  onUploadMaterial: () => void;
  canManage: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const sc = subjectColors[test.subject] ?? { color: "#0d9488", bg: "#f0fdfa" };
  const status = deriveStatus(test);
  const statusStyle = getStatusStyle(status);
  const marksExist = test.marks !== null;

  // Stats for submitted marks
  const presentStudents = test.marks?.filter((m) => m.score !== null) ?? [];
  const avg = presentStudents.length > 0
    ? Math.round(presentStudents.reduce((s, m) => s + (m.score ?? 0), 0) / presentStudents.length)
    : null;
  const highest = presentStudents.length > 0
    ? Math.max(...presentStudents.map((m) => m.score ?? 0))
    : null;

  return (
    <div className="p-8 max-w-[960px] mx-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors"
        style={{ fontSize: "13.5px", fontWeight: 500 }}
      >
        <ArrowLeft size={15} />
        Back to Tests
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: sc.bg }}>
              <ClipboardList size={24} style={{ color: sc.color }} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-gray-900" style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {test.name}
                </h1>
                <span
                  className="px-2.5 py-0.5 rounded-full"
                  style={{ fontSize: "11.5px", fontWeight: 600, color: statusStyle.color, backgroundColor: statusStyle.bg }}
                >
                  {statusStyle.label}
                </span>
              </div>
              <p className="text-gray-400" style={{ fontSize: "13.5px" }}>
                Created by {test.createdBy}
              </p>
            </div>
          </div>

          {/* Action buttons — context-aware */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {canManage && status === "Upcoming" && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                style={{ fontSize: "13px", fontWeight: 600 }}
              >
                <Pencil size={13} strokeWidth={2} />
                Edit Test
              </button>
            )}

            {/* Enter Marks: only shown if test is past AND no marks yet */}
            {canManage && status === "Marks Pending" && (
              <button
                onClick={onEnterMarks}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:opacity-90 transition-all"
                style={{ backgroundColor: "#0d9488", fontSize: "13px", fontWeight: 600 }}
              >
                <Award size={14} strokeWidth={2} />
                Enter Marks
              </button>
            )}

            {/* Modify Marks + other actions: only if marks already exist */}
            {canManage && status === "Marks Submitted" && (
              <>
                <button
                  onClick={onModifyMarks}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-teal-200 text-teal-700 hover:bg-teal-50 transition-all"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  <Pencil size={13} strokeWidth={2} />
                  Modify Marks
                </button>

                <button
                  onClick={onUploadMaterial}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  <UploadCloud size={13} strokeWidth={2} />
                  Upload Material
                </button>
              </>
            )}

            {canManage && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition-all"
                style={{ fontSize: "13px", fontWeight: 600 }}
              >
                <Trash2 size={13} strokeWidth={2} />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-5 gap-5 mt-7 pt-6 border-t border-gray-50">
          {[
            { icon: BookOpen, label: "Subject",     value: test.subject,     badge: true,  color: sc.color, bg: sc.bg },
            { icon: Calendar, label: "Test Date",   value: new Date(test.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
            {
            icon: Clock,
            label: "Duration",
            value: test.durationMinutes ? `${test.durationMinutes} min` : "—"
          },
          {
            icon: Clock,
            label: "Time",
            value: test.testTime
              ? new Date(`1970-01-01T${test.testTime}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
              : "—"
          },
            { icon: Award,    label: "Total Marks", value: String(test.totalMarks) },
          ].map(({ icon: Icon, label, value, badge, color, bg }: any) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className="text-gray-300" />
                <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {label}
                </p>
              </div>
              {badge ? (
                <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "12px", fontWeight: 600, color, backgroundColor: bg }}>
                  {value}
                </span>
              ) : (
                <p className="text-gray-800" style={{ fontSize: "14px", fontWeight: 600 }}>{value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Batches */}
        <div className="mt-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Users2 size={12} className="text-gray-300" />
            <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Assigned Batches
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-md" style={{ fontSize: "12.5px", fontWeight: 500, backgroundColor: "#f0fdfa", color: "#0d9488" }}>
              {test.batchName}
            </span>
          </div>
        </div>
      </div>

      {/* Two-column: Syllabus + Attachments */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={15} className="text-teal-500" />
            <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Syllabus / Topics</h2>
          </div>
          {test.syllabus ? (
            <p className="text-gray-600" style={{ fontSize: "13.5px", lineHeight: 1.7 }}>{test.syllabus}</p>
          ) : (
            <p className="text-gray-300" style={{ fontSize: "13.5px" }}>No syllabus specified.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Paperclip size={15} className="text-teal-500" />
            <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Study Material</h2>
          </div>
          {test.attachments.length === 0 ? (
            <p className="text-gray-300" style={{ fontSize: "13.5px" }}>No attachments added.</p>
          ) : (
            <div className="space-y-2">
              {test.attachments.map((f, i) => {
                const FileIcon = getFileIcon(f.type);
                const fc = getFileColor(f.type);
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: fc.bg }}>
                      <FileIcon size={14} style={{ color: fc.color }} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 truncate" style={{ fontSize: "13px", fontWeight: 500 }}>{f.name}</p>
                      <p className="text-gray-400" style={{ fontSize: "11.5px" }}>{f.size}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Marks Section ── shown only for completed tests */}
      {status !== "Upcoming" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between" style={{ backgroundColor: "#f9fafb" }}>
            <div className="flex items-center gap-2">
              <Award size={15} className="text-teal-500" />
              <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Student Marks</h2>
            </div>

            {/* Summary stats — only if marks exist */}
            {marksExist && avg !== null && (
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Class Average</p>
                  <p className="text-gray-800" style={{ fontSize: "16px", fontWeight: 700 }}>{avg} <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 400 }}>/ {test.totalMarks}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Highest</p>
                  <p className="text-gray-800" style={{ fontSize: "16px", fontWeight: 700 }}>{highest} <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 400 }}>/ {test.totalMarks}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* No marks yet state */}
          {!marksExist ? (
            <div className="px-6 py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fffbeb" }}>
                <Award size={22} color="#d97706" strokeWidth={1.5} />
              </div>
              <p className="text-gray-600" style={{ fontSize: "14px", fontWeight: 600 }}>No marks submitted yet</p>
              <p className="text-gray-400 text-center" style={{ fontSize: "13px", maxWidth: "300px" }}>
                This test has been completed. Use the "Enter Marks" button above to record scores.
              </p>
              {canManage && (
                <button
                  onClick={onEnterMarks}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
                  style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
                >
                  <Award size={15} strokeWidth={2} />
                  Enter Marks Now
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Marks table header */}
              <div className="grid px-6 py-3 border-b border-gray-50" style={{ gridTemplateColumns: "1fr 120px 120px 80px", backgroundColor: "#f9fafb" }}>
                {["Student", "Score", "Percentage", "Status"].map((col) => (
                  <p key={col} className="text-gray-400" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {col}
                  </p>
                ))}
              </div>

              <div className="divide-y divide-gray-50">
                {test.marks!.map((m) => {
                  const initials = m.studentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                  const isAbsent = m.score === null;
                  const pct = isAbsent ? null : Math.round(((m.score ?? 0) / test.totalMarks) * 100);
                  const passed = pct !== null && pct >= 35;

                  return (
                    <div
                      key={m.studentId}
                      className="grid px-6 py-3.5 items-center hover:bg-gray-50 transition-colors"
                      style={{ gridTemplateColumns: "1fr 120px 120px 80px" }}
                    >
                      {/* Student */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: isAbsent ? "#fee2e2" : sc.bg }}
                        >
                          <span style={{ fontSize: "11px", fontWeight: 700, color: isAbsent ? "#dc2626" : sc.color }}>
                            {initials}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 600 }}>{m.studentName}</p>
                          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>{m.mobile ?? "—"}</p>
                        </div>
                      </div>

                      {/* Score */}
                      <div>
                        {isAbsent ? (
                          <span className="text-gray-400" style={{ fontSize: "13.5px" }}>—</span>
                        ) : (
                          <span className="text-gray-800" style={{ fontSize: "14px", fontWeight: 700 }}>
                            {m.score}
                            <span className="text-gray-400" style={{ fontSize: "12px", fontWeight: 400 }}> / {test.totalMarks}</span>
                          </span>
                        )}
                      </div>

                      {/* Percentage */}
                      <div>
                        {isAbsent ? (
                          <span className="text-gray-400" style={{ fontSize: "13px" }}>—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: "#f3f4f6" }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: pct! >= 75 ? "#16a34a" : pct! >= 50 ? "#0d9488" : pct! >= 35 ? "#d97706" : "#dc2626",
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: pct! >= 35 ? "#374151" : "#dc2626" }}>
                              {pct}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        {isAbsent ? (
                          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: "#dc2626", backgroundColor: "#fee2e2" }}>
                            Absent
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: passed ? "#16a34a" : "#dc2626", backgroundColor: passed ? "#f0fdf4" : "#fef2f2" }}>
                            {passed ? "Pass" : "Fail"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-[420px] mx-4">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fef2f2" }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-1" style={{ fontSize: "16px", fontWeight: 700 }}>Delete Test?</h3>
                <p className="text-gray-400" style={{ fontSize: "13.5px", lineHeight: 1.6 }}>
                  Are you sure you want to delete <strong className="text-gray-700">{test.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { onDelete(); setShowDeleteConfirm(false); }}
                className="flex-1 py-2.5 rounded-xl text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#ef4444", fontSize: "13.5px", fontWeight: 600 }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                style={{ fontSize: "13.5px", fontWeight: 500 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Tests Page ───────────────────────────────────────────────────────────

type View =
  | { type: "list" }
  | { type: "create" }
  | { type: "detail"; testId: string }
  | { type: "edit"; testId: string }
  | { type: "marks"; testId: string; mode: "enter" | "modify" };

export function Tests({ canManage = true }: { canManage?: boolean }) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ type: "list" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const loadTests = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await fetchTestsApi();
      setTests(rows.map(mapRowToTest));
    } catch (err: any) {
      setLoadError(err.message ?? "Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTests(); }, []);
useEffect(() => {
    if (view.type === "detail") {
      loadTestDetail(view.testId);
    }
  }, [view]);
  // When opening detail view, fetch fresh detail (includes marks)
  const loadTestDetail = async (testId: string) => {
    try {
      const detail = await fetchTestDetailApi(testId);
      setTests((prev) => prev.map((t) =>
        t.id === testId
          ? {
              ...t,
              hasMarks: detail.has_marks,
              marks: detail.marks.length > 0 ? detail.marks.map((m) => ({
                studentId: m.student_id,
                studentName: m.student_name,
                mobile: m.mobile,
                score: m.score != null ? Number(m.score) : null,
              })) : null,
            }
          : t
      ));
    } catch {
      // Non-fatal — list still works
    }
  };

  const filtered = tests.filter((t) => {
    const status = deriveStatus(t);
    const matchesFilter =
      filter === "All" ||
      (filter === "Upcoming" && status === "Upcoming") ||
      (filter === "Marks Pending" && status === "Marks Pending") ||
      (filter === "Marks Submitted" && status === "Marks Submitted");
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.batchName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  function handleCreate(_form: TestForm, _createdIds: string[]) {
    loadTests(); // Refetch — server is source of truth
    setView({ type: "list" });
  }

  async function handleEdit(testId: string, form: TestForm) {
    try {
      await updateTestApi(testId, {
        subject: form.subject,
        syllabus_text: form.syllabus || undefined,
        test_date: form.date,
        test_time: form.testTime || null,
        duration_minutes: form.durationMinutes !== "" ? Number(form.durationMinutes) : null,
      });
      await loadTests();
    } catch {
      // error shown in form already
    }
    setTimeout(() => setView({ type: "detail", testId }), 100);
  }

  async function handleDelete(testId: string) {
    try {
      await deleteTestApi(testId);
      setTests((prev) => prev.filter((t) => t.id !== testId));
    } catch {
      // error handled in TestDetail modal
    }
    setView({ type: "list" });
  }

  function handleSaveMarks(testId: string, marks: StudentMark[]) {
    setTests((prev) =>
      prev.map((t) => t.id === testId ? { ...t, marks, hasMarks: true } : t)
    );
    setTimeout(() => setView({ type: "detail", testId }), 100);
  }

  // ── Routing ──

  if (view.type === "create") {
    return (
      <TestFormView
        initial={emptyForm}
        mode="create"
        onBack={() => setView({ type: "list" })}
        onSubmit={(f, createdIds) => handleCreate(f, createdIds)}
      />
    );
  }

  if (view.type === "edit") {
    const test = tests.find((t) => t.id === view.testId);
    if (!test) { setView({ type: "list" }); return null; }
    const formInit: TestForm = {
      name: test.name,
      subject: test.subject,
      batches: [test.batchId],
      syllabus: test.syllabus,
      date: test.date,
      testTime: test.testTime ?? "",
      durationMinutes: test.durationMinutes ?? "",
      totalMarks: test.totalMarks,
      attachments: test.attachments,
    };
    return (
      <TestFormView
        initial={formInit}
        mode="edit"
        onBack={() => setView({ type: "detail", testId: test.id })}
        onSubmit={(f) => handleEdit(test.id, f)}
      />
    );
  }

  if (view.type === "marks") {
    const test = tests.find((t) => t.id === view.testId);
    if (!test) { setView({ type: "list" }); return null; }
    return (
      <MarksEntryView
        test={test}
        mode={view.mode}
        onBack={() => setView({ type: "detail", testId: test.id })}
        onSave={(marks) => handleSaveMarks(test.id, marks)}
      />
    );
  }

  if (view.type === "detail") {
    const test = tests.find((t) => t.id === view.testId);
    if (!test) { setView({ type: "list" }); return null; }
    return (
      <TestDetail
        test={test}
        onBack={() => setView({ type: "list" })}
        onEdit={() => setView({ type: "edit", testId: test.id })}
        onDelete={() => handleDelete(test.id)}
        onEnterMarks={() => setView({ type: "marks", testId: test.id, mode: "enter" })}
        onModifyMarks={() => setView({ type: "marks", testId: test.id, mode: "modify" })}
        onUploadMaterial={() => { /* wire to study materials flow */ }}
        canManage={canManage}
      />
    );
  }

  // ── List view ──

  const upcomingCount = tests.filter((t) => deriveStatus(t) === "Upcoming").length;
  const pendingCount  = tests.filter((t) => deriveStatus(t) === "Marks Pending").length;
  const doneCount     = tests.filter((t) => deriveStatus(t) === "Marks Submitted").length;

  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Tests
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {upcomingCount} upcoming · {pendingCount} marks pending · {doneCount} marks submitted
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setView({ type: "create" })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Create Test
          </button>
        )}
      </div>

{loadError && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-500" style={{ fontSize: "13px" }}>
          {loadError}
        </div>
      )}
      {loading && tests.length === 0 && (
        <div className="py-12 text-center text-gray-300" style={{ fontSize: "14px" }}>Loading tests…</div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests by name, subject, or batch…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm"
            style={{ fontSize: "13.5px" }}
          />
        </div>
        {["All", "Upcoming", "Marks Pending", "Marks Submitted"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2.5 rounded-xl border shadow-sm transition-colors whitespace-nowrap"
            style={{
              fontSize: "13px", fontWeight: 500,
              backgroundColor: filter === f ? "#0d9488" : "white",
              color: filter === f ? "white" : "#6b7280",
              borderColor: filter === f ? "#0d9488" : "#f3f4f6",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              {["Test Name", "Subject", "Batches", "Date", "Total Marks", "Created By", "Status"].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3 text-gray-400"
                  style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em" }}
                >
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((test) => {
              const sc = subjectColors[test.subject] ?? { color: "#0d9488", bg: "#f0fdfa" };
              const status = deriveStatus(test);
              const statusStyle = getStatusStyle(status);
              return (
                <tr
                  key={test.id}
                  onClick={() => setView({ type: "detail", testId: test.id })}
                  className="border-t border-gray-50 hover:bg-teal-50 transition-colors cursor-pointer group"
                >
                  {/* Name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: sc.bg }}>
                        <ClipboardList size={15} style={{ color: sc.color }} strokeWidth={2} />
                      </div>
                      <span className="text-gray-800 group-hover:text-teal-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                        {test.name}
                      </span>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: sc.color, backgroundColor: sc.bg }}>
                      {test.subject}
                    </span>
                  </td>

                  {/* Batch */}
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "11px", fontWeight: 500, backgroundColor: "#f0fdfa", color: "#0d9488" }}>
                      {test.batchName}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 500 }}>
                        {new Date(test.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </td>

                  {/* Total Marks */}
                  <td className="px-5 py-3.5">
                    <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{test.totalMarks}</span>
                  </td>

                  {/* Created by */}
                  <td className="px-5 py-3.5">
                    <span className="text-gray-400" style={{ fontSize: "12.5px" }}>{test.createdBy}</span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className="px-2.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{ fontSize: "11.5px", fontWeight: 600, color: statusStyle.color, backgroundColor: statusStyle.bg }}
                    >
                      {statusStyle.label}
                    </span>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <p className="text-gray-300" style={{ fontSize: "14px" }}>No tests found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}