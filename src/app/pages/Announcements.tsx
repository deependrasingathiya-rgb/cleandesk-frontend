// src/app/pages/Announcements.tsx

import { useState, useEffect } from "react";
import {
  fetchAnnouncementsApi,
  createAnnouncementApi,
  updateAnnouncementApi,
  deleteAnnouncementApi,
  type AnnouncementRecord,
} from "../../Lib/api/announcements";
import { fetchClassBatchesApi, type ClassBatchOption } from "../../Lib/api/teachers";
import { Plus, Search, X, Megaphone, Pencil, Trash2, AlertTriangle, CheckCircle2, ChevronDown, Users2, Calendar, User } from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ANNOUNCEMENT_TYPES = [
  "General",
  "Holiday",
  "Test",
  "Result",
  "Event",
  "Trip",
  "Exhibition",
  "Parent-Teacher Meet",
  "Schedule Change",
  "Emergency",
] as const;

type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];

const TYPE_STYLE: Record<AnnouncementType, { color: string; bg: string }> = {
  "General":            { color: "#6b7280", bg: "#f9fafb" },
  "Holiday":            { color: "#d97706", bg: "#fffbeb" },
  "Test":               { color: "#2563eb", bg: "#eff6ff" },
  "Result":             { color: "#0d9488", bg: "#f0fdfa" },
  "Event":              { color: "#7c3aed", bg: "#f5f3ff" },
  "Trip":               { color: "#ea580c", bg: "#fff7ed" },
  "Exhibition":         { color: "#db2777", bg: "#fdf2f8" },
  "Parent-Teacher Meet":{ color: "#16a34a", bg: "#f0fdf4" },
  "Schedule Change":    { color: "#0369a1", bg: "#f0f9ff" },
  "Emergency":          { color: "#dc2626", bg: "#fef2f2" },
};

// BATCH_OPTIONS is now loaded dynamically from the API

// ─── Types ─────────────────────────────────────────────────────────────────────

// ─── Types ─────────────────────────────────────────────────────────────────────
const DB_TYPE_MAP: Record<string, AnnouncementType> = {
  GENERAL: "General",
  HOLIDAY: "Holiday",
  TEST: "Test",
  RESULT: "Result",
  EVENT: "Event",
  TRIP: "Trip",
  EXHIBITION: "Exhibition",
  PTM: "Parent-Teacher Meet",
  SCHEDULE_CHANGE: "Schedule Change",
  EMERGENCY: "Emergency",
};


type Announcement = {
  id: string;
  type: AnnouncementType;
  title: string;
  body: string;
  createdBy: string;
  date: string;
  batches: string[]; // ["Universal"] or specific batch names
};

function mapRecord(record: AnnouncementRecord, batches: ClassBatchOption[]): Announcement {
  
const displayType: AnnouncementType =
  DB_TYPE_MAP[record.announcement_type] ?? "General";
  const batchName = record.class_batch_id
    ? (batches.find(b => b.id === record.class_batch_id)?.name ?? record.class_batch_id)
    : "Universal";

  const d = new Date(record.created_at);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  return {
    id: record.id,
    type: displayType,
    title: record.announcement_title,
    body: record.message,
    createdBy: record.created_by, // will be replaced with name join if needed
    date: dateStr,
    batches: [batchName],
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function audienceLabel(batches: string[]): string {
  if (batches.includes("Universal")) return "All Batches";
  if (batches.length === 1) return batches[0];
  if (batches.length <= 2) return batches.join(", ");
  return `${batches.slice(0, 2).join(", ")} +${batches.length - 2} more`;
}

// ─── Batch Multi-Select (inline chips) ────────────────────────────────────────

function BatchSelector({
  selected,
  onChange,
  options,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);

  function toggle(batch: string) {
    if (batch === "Universal") {
      onChange(["Universal"]);
      setOpen(false);
      return;
    }
    const withoutUniversal = selected.filter(b => b !== "Universal");
    if (withoutUniversal.includes(batch)) {
      onChange(withoutUniversal.filter(b => b !== batch));
    } else {
      onChange([...withoutUniversal, batch]);
    }
  }

  function remove(batch: string) {
    onChange(selected.filter(b => b !== batch));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white"
        style={{ fontSize: "13.5px" }}
      >
        <span style={{ color: selected.length === 0 ? "#d1d5db" : "#1f2937" }}>
          {selected.length === 0 ? "Select audience…" : selected.includes("Universal") ? "All Batches (Universal)" : `${selected.length} batch${selected.length > 1 ? "es" : ""} selected`}
        </span>
        <ChevronDown
          size={14}
          className="text-gray-400 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden" style={{ maxHeight: "240px", overflowY: "auto" }}>
          {options.map(batch => {
            const isSelected = selected.includes(batch);
            const isUniversal = batch === "Universal";
            return (
              <button
                key={batch}
                type="button"
                onClick={() => toggle(batch)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 transition-colors text-left"
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    border: isSelected ? "none" : "2px solid #d1d5db",
                    backgroundColor: isSelected ? "#0d9488" : "transparent",
                  }}
                >
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: isSelected ? 600 : 400 }}>
                    {batch}
                  </span>
                  {isUniversal && (
                    <span className="px-1.5 py-0.5 rounded" style={{ fontSize: "10px", fontWeight: 700, color: "#0d9488", backgroundColor: "#f0fdfa" }}>
                      ALL
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map(b => (
            <span
              key={b}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
              style={{
                fontSize: "12px", fontWeight: 500,
                backgroundColor: b === "Universal" ? "#f0fdfa" : "#f3f4f6",
                color: b === "Universal" ? "#0d9488" : "#374151",
              }}
            >
              {b}
              <button type="button" onClick={() => remove(b)} className="hover:opacity-70">
                <X size={10} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create / Edit Modal ───────────────────────────────────────────────────────

type FormState = {
  type: AnnouncementType | "";
  title: string;
  body: string;
  batches: string[];
};

const emptyForm: FormState = { type: "", title: "", body: "", batches: [] };

function AnnouncementModal({
  initial,
  mode,
  onClose,
  onSubmit,
  submitting = false,
  apiError = null,
  batchOptions,
}: {
  initial: FormState;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (f: FormState) => void;
  submitting?: boolean;
  apiError?: string | null;
  batchOptions: string[];
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof FormState>(key: K) => (val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  function validate() {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.type) e.type = "Please select an announcement type.";
    if (!form.body.trim()) e.body = "Announcement message cannot be empty.";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaved(true);
    setTimeout(() => { onSubmit(form); }, 900);
  }

  const typeStyle = form.type ? TYPE_STYLE[form.type as AnnouncementType] : null;

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#f0fdfa" }}>
            <CheckCircle2 size={28} color="#0d9488" strokeWidth={2} />
          </div>
          <p className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700 }}>
            {mode === "create" ? "Announcement Published!" : "Announcement Updated!"}
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-7" style={{ maxHeight: "92vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              {mode === "create" ? "Create Announcement" : "Edit Announcement"}
            </h2>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "13px" }}>
              {mode === "create" ? "Publish a new announcement to your institute." : "Update the announcement details."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Announcement Type */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Announcement Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ANNOUNCEMENT_TYPES.map(t => {
                const style = TYPE_STYLE[t];
                const isSelected = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { set("type")(t); setErrors(e => ({ ...e, type: undefined })); }}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all text-left"
                    style={{
                      borderColor: isSelected ? style.color : "#f3f4f6",
                      backgroundColor: isSelected ? style.bg : "white",
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: isSelected ? style.color : "#d1d5db" }}
                    />
                    <span style={{
                      fontSize: "12.5px", fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? style.color : "#6b7280",
                    }}>
                      {t}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.type && <p className="text-red-500 mt-1.5" style={{ fontSize: "12px" }}>{errors.type}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Announcement Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set("title")(e.target.value)}
              placeholder="e.g. Holiday Notice – Holi Festival"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
              style={{ fontSize: "13.5px" }}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={form.body}
              onChange={e => { set("body")(e.target.value); setErrors(er => ({ ...er, body: undefined })); }}
              placeholder="Write your announcement message here…"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all resize-none"
              style={{ fontSize: "13.5px", lineHeight: 1.6 }}
            />
            {errors.body && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.body}</p>}
          </div>

          {/* Audience */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Audience / Batches
            </label>
            <BatchSelector selected={form.batches} onChange={set("batches")} options={batchOptions} />
            <p className="text-gray-400 mt-1.5" style={{ fontSize: "11.5px" }}>
              Choose "Universal" to broadcast to all batches, or select specific ones.
            </p>
          </div>

          {/* Preview pill */}
          {form.type && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
              <span className="text-gray-400" style={{ fontSize: "12px" }}>Tag preview:</span>
              <span
                className="px-2.5 py-0.5 rounded-full"
                style={{ fontSize: "11.5px", fontWeight: 700, color: typeStyle!.color, backgroundColor: typeStyle!.bg }}
              >
                {form.type}
              </span>
            </div>
          )}

          {/* Required note */}
          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>
            <span className="text-red-400">*</span> Required fields
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ fontSize: "13.5px", fontWeight: 600 }}
            >
              Cancel
            </button>
            {apiError && (
  <p className="text-red-500 text-center" style={{ fontSize: "12px" }}>{apiError}</p>
)}
<button
  onClick={handleSubmit}
  disabled={submitting}
  className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
  style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
>
  {submitting ? "Publishing…" : mode === "create" ? "Publish" : "Save Changes"}
</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({
  title,
  onClose,
  onConfirm,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fef2f2" }}>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div>
            <h3 className="text-gray-900 mb-1" style={{ fontSize: "16px", fontWeight: 700 }}>Delete Announcement?</h3>
            <p className="text-gray-400" style={{ fontSize: "13.5px", lineHeight: 1.6 }}>
              Are you sure you want to delete{" "}
              <strong className="text-gray-700">"{title}"</strong>? This cannot be undone.
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

// ─── Main Announcements Page ───────────────────────────────────────────────────

export function Announcements({ canManage = true }: { canManage?: boolean }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [batchOptions, setBatchOptions] = useState<ClassBatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "All">("All");
  const [selected, setSelected] = useState<Announcement | null>(null);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  // ── Load data on mount ──
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [records, batches] = await Promise.all([
          fetchAnnouncementsApi(),
          fetchClassBatchesApi(),
        ]);
        setBatchOptions(batches);
        setAnnouncements(records.map(r => mapRecord(r, batches)));
      } catch (err: any) {
        setLoadError(err.message ?? "Failed to load announcements");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = announcements.filter(a => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.body.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || a.type === typeFilter;
    return matchSearch && matchType;
  });

  // ── CRUD ──

  async function handleCreate(form: FormState) {
    setSubmitting(true);
    setApiError(null);
    try {
      await createAnnouncementApi({
        announcement_type: form.type.toUpperCase().replace(/ /g, "_").replace("PARENT-TEACHER_MEET", "PTM"),
        announcement_title: form.title || form.type,
        message: form.body,
        class_batch_id:
          form.batches.includes("Universal") || form.batches.length === 0
            ? null
            : (batchOptions.find(b => b.name === form.batches[0])?.id ?? null),
        school_attribute: null,
      });
      // Refresh list from server
      const [records, batches] = await Promise.all([
        fetchAnnouncementsApi(),
        Promise.resolve(batchOptions),
      ]);
      setAnnouncements(records.map(r => mapRecord(r, batches)));
      setCreateOpen(false);
    } catch (err: any) {
      setApiError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(form: FormState) {
    if (!editTarget) return;
    setSubmitting(true);
    setApiError(null);
    try {
      await updateAnnouncementApi(editTarget.id, {
        announcement_title: form.title || form.type,
        message: form.body,
      });
      // Refresh from server to stay consistent
      const [records, batches] = await Promise.all([
        fetchAnnouncementsApi(),
        Promise.resolve(batchOptions),
      ]);
      const updated = records.map(r => mapRecord(r, batches));
      setAnnouncements(updated);
      // Keep detail panel in sync
      const freshSelected = updated.find(a => a.id === editTarget.id) ?? null;
      setSelected(freshSelected);
      setEditTarget(null);
    } catch (err: any) {
      setApiError(err.message ?? "Failed to update announcement.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAnnouncementApi(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err: any) {
      // surface error gracefully — don't crash the page
      console.error("Delete failed:", err.message);
    } finally {
      setDeleteTarget(null);
    }
  }

  // ── Active filter pills (top 5 most relevant types in data) ──
  const typeOptions: (AnnouncementType | "All")[] = [
    "All",
    ...Array.from(new Set(announcements.map(a => a.type))).filter(
      t => t in TYPE_STYLE
    ),
  ];
if (loading) {
    return (
      <div className="p-8 max-w-[1200px] mx-auto flex items-center justify-center" style={{ minHeight: "300px" }}>
        <p className="text-gray-400" style={{ fontSize: "14px" }}>Loading announcements…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 max-w-[1200px] mx-auto flex items-center justify-center" style={{ minHeight: "300px" }}>
        <p className="text-red-400" style={{ fontSize: "14px" }}>{loadError}</p>
      </div>
    );
  }
  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Announcements
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {announcements.length} announcement{announcements.length !== 1 ? "s" : ""} this month
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Create Announcement
          </button>
        )}
      </div>

      {/* Search + Type filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 relative" style={{ minWidth: "260px" }}>
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm"
            style={{ fontSize: "13.5px" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {typeOptions.map(t => {
            const isActive = typeFilter === t;
            const style = t !== "All" ? TYPE_STYLE[t as AnnouncementType] : null;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="px-3.5 py-2.5 rounded-xl border shadow-sm transition-all"
                style={{
                  fontSize: "12.5px", fontWeight: 600,
                  backgroundColor: isActive ? (style?.color ?? "#0d9488") : "white",
                  color: isActive ? "white" : (style?.color ?? "#6b7280"),
                  borderColor: isActive ? (style?.color ?? "#0d9488") : "#f3f4f6",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* List */}
        <div className={`space-y-3 transition-all duration-300 ${selected ? "w-[52%]" : "w-full"}`}>
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-gray-300" style={{ fontSize: "14px" }}>No announcements found.</p>
            </div>
          )}
          {filtered.map(ann => {
            const ts = TYPE_STYLE[ann.type];
            const isSelected = selected?.id === ann.id;
            return (
              <div
                key={ann.id}
                onClick={() => setSelected(isSelected ? null : ann)}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all cursor-pointer group ${
                  isSelected ? "border-teal-300 shadow-md" : "border-gray-100 hover:border-teal-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3
                    className="text-gray-800 group-hover:text-teal-700 transition-colors leading-snug"
                    style={{ fontSize: "15px", fontWeight: 650 }}
                  >
                    {ann.title || ann.type}
                  </h3>
                  <span
                    className="flex-shrink-0 px-2.5 py-0.5 rounded-full"
                    style={{ fontSize: "11px", fontWeight: 700, color: ts.color, backgroundColor: ts.bg }}
                  >
                    {ann.type}
                  </span>
                </div>
                <p className="text-gray-400 mb-4 leading-relaxed" style={{ fontSize: "13px" }}>
                  {ann.body.slice(0, 120)}{ann.body.length > 120 ? "…" : ""}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#f0fdfa" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#0d9488" }}>{ann.createdBy.charAt(0)}</span>
                    </div>
                    <span className="text-gray-400" style={{ fontSize: "12.5px" }}>{ann.createdBy}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-gray-400" style={{ fontSize: "12.5px" }}>{ann.date}</span>
                  </div>
                  <span
                    className="text-gray-400 truncate max-w-[140px]"
                    style={{ fontSize: "12px" }}
                  >
                    → {audienceLabel(ann.batches)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selected && (() => {
          const ts = TYPE_STYLE[selected.type];
          return (
            <div
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit sticky top-8 flex-1"
              style={{ minWidth: "0" }}
            >
              {/* Panel top bar */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: ts.bg }}>
                    <Megaphone size={18} style={{ color: ts.color }} />
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{ fontSize: "11.5px", fontWeight: 700, color: ts.color, backgroundColor: ts.bg }}
                  >
                    {selected.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Edit */}
                  {canManage && (
                    <button
                      onClick={() => setEditTarget(selected)}
                      className="w-8 h-8 rounded-md flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
                      title="Edit announcement"
                    >
                      <Pencil size={13} strokeWidth={2} />
                    </button>
                  )}
                  {/* Delete */}
                  {canManage && (
                    <button
                      onClick={() => setDeleteTarget(selected)}
                      className="w-8 h-8 rounded-md flex items-center justify-center border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition-all"
                      title="Delete announcement"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  )}
                  {/* Close */}
                  <button
                    onClick={() => setSelected(null)}
                    className="w-8 h-8 rounded-md flex items-center justify-center border border-gray-200 text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-all"
                    title="Close"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-gray-900 mb-3" style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.4 }}>
                {selected.title || selected.type}
              </h2>

              {/* Body */}
              <p className="text-gray-500 leading-relaxed mb-6" style={{ fontSize: "14px", lineHeight: 1.75 }}>
                {selected.body}
              </p>

              {/* Meta */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <User size={12} />
                    <span style={{ fontSize: "12.5px" }}>Created by</span>
                  </div>
                  <span className="text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{selected.createdBy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Calendar size={12} />
                    <span style={{ fontSize: "12.5px" }}>Date</span>
                  </div>
                  <span className="text-gray-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{selected.date}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
                    <Users2 size={12} />
                    <span style={{ fontSize: "12.5px" }}>Audience</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {selected.batches.map(b => (
                      <span
                        key={b}
                        className="px-2 py-0.5 rounded-md"
                        style={{
                          fontSize: "11.5px", fontWeight: 600,
                          backgroundColor: b === "Universal" ? "#f0fdfa" : "#f3f4f6",
                          color: b === "Universal" ? "#0d9488" : "#374151",
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Create modal */}
      {createOpen && (
        <AnnouncementModal
          initial={emptyForm}
          mode="create"
          onClose={() => { setCreateOpen(false); setApiError(null); }}
          onSubmit={handleCreate}
          submitting={submitting}
          apiError={apiError}
          batchOptions={["Universal", ...batchOptions.map(b => b.name)]}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <AnnouncementModal
          initial={{
            type: editTarget.type,
            title: editTarget.title,
            body: editTarget.body,
            batches: editTarget.batches,
          }}
          mode="edit"
          onClose={() => { setEditTarget(null); setApiError(null); }}
          onSubmit={handleEdit}
          submitting={submitting}
          apiError={apiError}
          batchOptions={["Universal", ...batchOptions.map(b => b.name)]}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteModal
          title={deleteTarget.title || deleteTarget.type}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}
    </div>
  );
}