// src/app/components/shared/AnnouncementModal.tsx

import { useState, useEffect } from "react";
import {
  X,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { createAnnouncementApi } from "../../../Lib/api/announcements";
import { fetchBatchesDetailedApi } from "../../../Lib/api/class-batches";

// ─── Constants ─────────────────────────────────────────────────────────────────

export const ANNOUNCEMENT_TYPES = [
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

export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];

export const TYPE_STYLE: Record<AnnouncementType, { color: string; bg: string }> = {
  "General":             { color: "#6b7280", bg: "#f9fafb" },
  "Holiday":             { color: "#d97706", bg: "#fffbeb" },
  "Test":                { color: "#2563eb", bg: "#eff6ff" },
  "Result":              { color: "#0d9488", bg: "#f0fdfa" },
  "Event":               { color: "#7c3aed", bg: "#f5f3ff" },
  "Trip":                { color: "#ea580c", bg: "#fff7ed" },
  "Exhibition":          { color: "#db2777", bg: "#fdf2f8" },
  "Parent-Teacher Meet": { color: "#16a34a", bg: "#f0fdf4" },
  "Schedule Change":     { color: "#0369a1", bg: "#f0f9ff" },
  "Emergency":           { color: "#dc2626", bg: "#fef2f2" },
};

// Map display type → DB enum value
const TYPE_TO_DB: Record<AnnouncementType, string> = {
  "General":             "GENERAL",
  "Holiday":             "HOLIDAY",
  "Test":                "TEST",
  "Result":              "RESULT",
  "Event":               "EVENT",
  "Trip":                "TRIP",
  "Exhibition":          "EXHIBITION",
  "Parent-Teacher Meet": "PTM",
  "Schedule Change":     "SCHEDULE_CHANGE",
  "Emergency":           "EMERGENCY",
};



// ─── Form state ────────────────────────────────────────────────────────────────

export type AnnouncementFormState = {
  type: AnnouncementType | "";
  title: string;
  body: string;
  batches: string[]; // batch names (for display); "Universal" = no batch filter
};

const emptyForm: AnnouncementFormState = {
  type: "", title: "", body: "", batches: [],
};

// ─── BatchSelector ─────────────────────────────────────────────────────────────

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
    const withoutUniversal = selected.filter((b) => b !== "Universal");
    if (withoutUniversal.includes(batch)) {
      onChange(withoutUniversal.filter((b) => b !== batch));
    } else {
      onChange([...withoutUniversal, batch]);
    }
  }

  function remove(batch: string) {
    onChange(selected.filter((b) => b !== batch));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white"
        style={{ fontSize: "13.5px" }}
      >
        <span style={{ color: selected.length === 0 ? "#d1d5db" : "#1f2937" }}>
          {selected.length === 0
            ? "Select audience…"
            : selected.includes("Universal")
            ? "All Batches (Universal)"
            : `${selected.length} batch${selected.length > 1 ? "es" : ""} selected`}
        </span>
        <ChevronDown
          size={14}
          className="text-gray-400 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1.5 w-full bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden"
          style={{ maxHeight: "240px", overflowY: "auto" }}
        >
          {options.map((batch) => {
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
                  <span
                    className="text-gray-700"
                    style={{ fontSize: "13px", fontWeight: isSelected ? 600 : 400 }}
                  >
                    {batch}
                  </span>
                  {isUniversal && (
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{ fontSize: "10px", fontWeight: 700, color: "#0d9488", backgroundColor: "#f0fdfa" }}
                    >
                      ALL
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((b) => (
            <span
              key={b}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
              style={{
                fontSize: "12px",
                fontWeight: 500,
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

// ─── Props ─────────────────────────────────────────────────────────────────────

/** Minimal shape needed — both ClassBatchOption and BatchDetailed satisfy this */
export type BatchOption = {
  id: string;
  name: string;
};

export type AnnouncementModalProps = {
  onClose: () => void;
  /** Called after successful creation with the created announcement id */
  onSuccess: (announcementId: string) => void;
  /** Pre-load batch options from parent if already fetched, otherwise fetched internally */
  preloadedBatchOptions?: BatchOption[];
};

// ─── Main Modal ────────────────────────────────────────────────────────────────

export function AnnouncementModal({
  onClose,
  onSuccess,
  preloadedBatchOptions,
}: AnnouncementModalProps) {
  const [form, setForm] = useState<AnnouncementFormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof AnnouncementFormState, string>>>({});
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>(preloadedBatchOptions ?? []);
  const [loadingBatches, setLoadingBatches] = useState(!preloadedBatchOptions);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (preloadedBatchOptions) return;
    fetchBatchesDetailedApi()
      .then((batches) => setBatchOptions(batches.map((b) => ({ id: b.id, name: b.name }))))
      .catch(() => setApiError("Failed to load batches"))
      .finally(() => setLoadingBatches(false));
  }, [preloadedBatchOptions]);

  const set = <K extends keyof AnnouncementFormState>(key: K) =>
    (val: AnnouncementFormState[K]) => setForm((f) => ({ ...f, [key]: val }));

  function validate() {
    const e: Partial<Record<keyof AnnouncementFormState, string>> = {};
    if (!form.type) e.type = "Please select an announcement type.";
    if (!form.body.trim()) e.body = "Announcement message cannot be empty.";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setApiError(null);

    try {
      // Resolve batch_id: Universal or empty → null (institute-wide)
      const resolvedBatchIds =
        form.batches.includes("Universal") || form.batches.length === 0
          ? []
          : batchOptions
              .filter((b) => form.batches.includes(b.name))
              .map((b) => b.id);

      const resolvedBatchId = resolvedBatchIds.length > 0 ? resolvedBatchIds[0] : null;

      // 1. Create the announcement
      const dbType = TYPE_TO_DB[form.type as AnnouncementType];

      const created = await createAnnouncementApi({
        announcement_type:  dbType,
        announcement_title: form.title.trim() || form.type,
        message:            form.body.trim(),
        class_batch_id:     resolvedBatchId,
        school_attribute:   null,
      });

      const announcementId = created.id;

      setSaved(true);
      setTimeout(() => {
        onSuccess(announcementId);
      }, 900);
    } catch (err: any) {
      setApiError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const typeStyle = form.type ? TYPE_STYLE[form.type as AnnouncementType] : null;
  const batchNames = ["Universal", ...batchOptions.map((b) => b.name)];

  // ── Success state ──
  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-10 flex flex-col items-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <CheckCircle2 size={28} color="#0d9488" strokeWidth={2} />
          </div>
          <p className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700 }}>
            Announcement Published!
          </p>
          
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* Fixed header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Create Announcement
            </h2>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "13px" }}>
              Publish a new announcement to your institute.
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

          {/* Type selector */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Announcement Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ANNOUNCEMENT_TYPES.map((t) => {
                const style = TYPE_STYLE[t];
                const isSelected = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { set("type")(t); setErrors((e) => ({ ...e, type: undefined })); }}
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
                    <span
                      style={{
                        fontSize: "12.5px",
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? style.color : "#6b7280",
                      }}
                    >
                      {t}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.type && (
              <p className="text-red-500 mt-1.5" style={{ fontSize: "12px" }}>{errors.type}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Announcement Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title")(e.target.value)}
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
              onChange={(e) => { set("body")(e.target.value); setErrors((er) => ({ ...er, body: undefined })); }}
              placeholder="Write your announcement message here…"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all resize-none"
              style={{ fontSize: "13.5px", lineHeight: 1.6 }}
            />
            {errors.body && (
              <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.body}</p>
            )}
          </div>

          {/* Audience */}
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Audience / Batches
            </label>
            {loadingBatches ? (
              <div className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-400" style={{ fontSize: "13.5px" }}>
                Loading batches…
              </div>
            ) : (
              <BatchSelector
                selected={form.batches}
                onChange={set("batches")}
                options={batchNames}
              />
            )}
            <p className="text-gray-400 mt-1.5" style={{ fontSize: "11.5px" }}>
              Choose "Universal" to broadcast to all batches, or select specific ones.
            </p>
          </div>

          

          {/* Preview pill */}
          {form.type && typeStyle && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
              <span className="text-gray-400" style={{ fontSize: "12px" }}>Tag preview:</span>
              <span
                className="px-2.5 py-0.5 rounded-full"
                style={{ fontSize: "11.5px", fontWeight: 700, color: typeStyle.color, backgroundColor: typeStyle.bg }}
              >
                {form.type}
              </span>
            </div>
          )}

          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>
            <span className="text-red-400">*</span> Required fields
          </p>

          {apiError && (
            <p className="text-red-500 text-center" style={{ fontSize: "12.5px" }}>{apiError}</p>
          )}
        </div>

        {/* Fixed footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            style={{ fontSize: "13.5px", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {submitting ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}