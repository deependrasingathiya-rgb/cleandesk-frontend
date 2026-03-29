// src/app/pages/Announcements.tsx

import { useState, useEffect } from "react";
import { AnnouncementModal, TYPE_STYLE, type AnnouncementType, type BatchOption } from "../components/shared/AnnouncementModal";
import {
  fetchAnnouncementsApi,
  createAnnouncementApi,
  updateAnnouncementApi,
  deleteAnnouncementApi,
  type AnnouncementRecord,
} from "../../Lib/api/announcements";
import { fetchBatchesDetailedApi } from "../../Lib/api/class-batches";
import { Plus, Search, X, Megaphone, Pencil, Trash2, AlertTriangle, CheckCircle2, ChevronDown, Users2, Calendar, User, Paperclip, Download } from "lucide-react";








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


type AnnouncementAttachmentDisplay = {
  id: string;
  file_url: string;
  name: string;
};

type Announcement = {
  id: string;
  type: AnnouncementType;
  title: string;
  body: string;
  createdBy: string;
  date: string;
  batches: string[];
  attachments: AnnouncementAttachmentDisplay[];
};

function mapRecord(record: AnnouncementRecord, batches: BatchOption[]): Announcement {
  
const displayType: AnnouncementType =
  DB_TYPE_MAP[record.announcement_type] ?? "General";
  const batchName = record.class_batch_id
    ? (batches.find(b => b.id === record.class_batch_id)?.name ?? record.class_batch_id)
    : "Universal";

  const d = new Date(record.created_at);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  const attachments: AnnouncementAttachmentDisplay[] = (record.attachments ?? []).map((a) => ({
    id:       a.id,
    file_url: a.file_url,
    name:     decodeURIComponent(a.file_url.split("/").pop() ?? a.id)
                .replace(/\.[^.]+$/, "")
                .replace(/-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/, ""),
  }));

  return {
    id: record.id,
    type: displayType,
    title: record.announcement_title,
    body: record.message,
    createdBy: record.created_by,
    date: dateStr,
    batches: [batchName],
    attachments,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function audienceLabel(batches: string[]): string {
  if (batches.includes("Universal")) return "All Batches";
  if (batches.length === 1) return batches[0];
  if (batches.length <= 2) return batches.join(", ");
  return `${batches.slice(0, 2).join(", ")} +${batches.length - 2} more`;
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
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "All">("All");
  const [selected, setSelected] = useState<Announcement | null>(null);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Load data on mount ──
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [records, batches] = await Promise.all([
          fetchAnnouncementsApi(),
          fetchBatchesDetailedApi(),
        ]);
        const batchOpts: BatchOption[] = batches.map((b) => ({ id: b.id, name: b.name }));
        setBatchOptions(batchOpts);
        setAnnouncements(records.map(r => mapRecord(r, batchOpts)));
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

  async function handleCreateSuccess(_announcementId: string) {
    const records = await fetchAnnouncementsApi();
    setAnnouncements(records.map((r) => mapRecord(r, batchOptions)));
    setCreateOpen(false);
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
                      onClick={async () => {
                        const newTitle = window.prompt("Edit title:", selected.title);
                        const newBody  = window.prompt("Edit message:", selected.body);
                        if (newTitle === null && newBody === null) return;
                        setSubmitting(true);
                        setApiError(null);
                        try {
                          await updateAnnouncementApi(selected.id, {
                            announcement_title: newTitle ?? selected.title,
                            message: newBody ?? selected.body,
                          });
                          const records = await fetchAnnouncementsApi();
                          const updated = records.map(r => mapRecord(r, batchOptions));
                          setAnnouncements(updated);
                          setSelected(updated.find(a => a.id === selected.id) ?? null);
                        } catch (err: any) {
                          setApiError(err.message ?? "Failed to update announcement.");
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      disabled={submitting}
                      className="w-8 h-8 rounded-md flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40"
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

                {selected.attachments.length > 0 && (
                  <div className="pt-3 mt-1 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                      <Paperclip size={12} />
                      <span style={{ fontSize: "12.5px" }}>
                        Attachments ({selected.attachments.length})
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {selected.attachments.map((att) => (
  <a
    key={att.id}
    href={att.file_url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition-all group"
    style={{ textDecoration: "none" }}
  >
    <div
      className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: "#f0fdfa" }}
    >
      <Paperclip size={11} color="#0d9488" strokeWidth={2} />
    </div>
    <span
      className="flex-1 text-gray-700 truncate group-hover:text-teal-700 transition-colors"
      style={{ fontSize: "12px", fontWeight: 500 }}
    >
      {att.name}
    </span>
    <Download size={11} className="text-gray-300 group-hover:text-teal-500 flex-shrink-0" />
  </a>
))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Create modal */}
      {createOpen && (
        <AnnouncementModal
          onClose={() => setCreateOpen(false)}
          onSuccess={handleCreateSuccess}
          preloadedBatchOptions={batchOptions}
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