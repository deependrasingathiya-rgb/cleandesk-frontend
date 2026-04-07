// src/app/pages/Student/StudentAnnouncements.tsx

import { useState, useEffect } from "react";
import {
  TYPE_STYLE,
  type AnnouncementType,
} from "../../components/shared/AnnouncementModal";
import {
  fetchAnnouncementsApi,
  type AnnouncementRecord,
} from "../../../Lib/api/announcements";
import {
  Search,
  Megaphone,
  X,
  Users2,
  Calendar,
  User,
  Paperclip,
  Download,
} from "lucide-react";

// ─── DB → display type map (mirrors Announcements.tsx exactly) ────────────────

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

// ─── Local types ──────────────────────────────────────────────────────────────

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
  audienceLabel: string;
  attachments: AnnouncementAttachmentDisplay[];
};

// ─── Mapper (no batch lookup needed — student sees pre-scoped data) ───────────

function mapRecord(record: AnnouncementRecord): Announcement {
  const displayType: AnnouncementType =
    DB_TYPE_MAP[record.announcement_type] ?? "General";

  const audienceLabel = record.class_batch_id ? "Your Batch" : "All Batches";

  const d = new Date(record.created_at);
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  const dateStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  const attachments: AnnouncementAttachmentDisplay[] = (
    record.attachments ?? []
  ).map((a) => ({
    id: a.id,
    file_url: a.file_url,
    name: decodeURIComponent(a.file_url.split("/").pop() ?? a.id)
      .replace(/\.[^.]+$/, "")
      .replace(
        /-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        ""
      ),
  }));

  return {
    id: record.id,
    type: displayType,
    title: record.announcement_title,
    body: record.message,
    createdBy: record.created_by,
    date: dateStr,
    audienceLabel,
    attachments,
  };
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function AnnouncementDetailPanel({
  announcement,
  onClose,
}: {
  announcement: Announcement;
  onClose: () => void;
}) {
  const ts = TYPE_STYLE[announcement.type];
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit sticky top-8 flex-1"
      style={{ minWidth: "0" }}
    >
      {/* Panel top bar */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: ts.bg }}
          >
            <Megaphone size={18} style={{ color: ts.color }} />
          </div>
          <span
            className="px-2.5 py-1 rounded-full"
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              color: ts.color,
              backgroundColor: ts.bg,
            }}
          >
            {announcement.type}
          </span>
        </div>
        {/* Close only — no edit, no delete */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-md flex items-center justify-center border border-gray-200 text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-all"
          title="Close"
        >
          <X size={15} />
        </button>
      </div>

      {/* Title */}
      <h2
        className="text-gray-900 mb-3"
        style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.4 }}
      >
        {announcement.title || announcement.type}
      </h2>

      {/* Body */}
      <p
        className="text-gray-500 leading-relaxed mb-6"
        style={{ fontSize: "14px", lineHeight: 1.75 }}
      >
        {announcement.body}
      </p>

      {/* Meta */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400">
            <User size={12} />
            <span style={{ fontSize: "12.5px" }}>Posted by</span>
          </div>
          <span
            className="text-gray-700"
            style={{ fontSize: "12.5px", fontWeight: 600 }}
          >
            {announcement.createdBy}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Calendar size={12} />
            <span style={{ fontSize: "12.5px" }}>Date</span>
          </div>
          <span
            className="text-gray-700"
            style={{ fontSize: "12.5px", fontWeight: 600 }}
          >
            {announcement.date}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Users2 size={12} />
            <span style={{ fontSize: "12.5px" }}>Audience</span>
          </div>
          <span
            className="px-2 py-0.5 rounded-md"
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              backgroundColor:
                announcement.audienceLabel === "All Batches"
                  ? "#f0fdfa"
                  : "#f3f4f6",
              color:
                announcement.audienceLabel === "All Batches"
                  ? "#0d9488"
                  : "#374151",
            }}
          >
            {announcement.audienceLabel}
          </span>
        </div>

        {announcement.attachments.length > 0 && (
          <div className="pt-3 mt-1 border-t border-gray-50">
            <div className="flex items-center gap-1.5 text-gray-400 mb-2">
              <Paperclip size={12} />
              <span style={{ fontSize: "12.5px" }}>
                Attachments ({announcement.attachments.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {announcement.attachments.map((att) => (
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
                  <Download
                    size={11}
                    className="text-gray-300 group-hover:text-teal-500 flex-shrink-0"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// ─── StudentAnnouncements ─────────────────────────────────────────────────────

export function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "All">("All");
  const [selected, setSelected] = useState<Announcement | null>(null);

  // ── Load on mount ──
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const records = await fetchAnnouncementsApi();
        setAnnouncements(records.map(mapRecord));
      } catch (err: any) {
        setLoadError(err.message ?? "Failed to load announcements");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = announcements.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.body.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || a.type === typeFilter;
    return matchSearch && matchType;
  });

  // Filter pill options — only types present in the student's actual data
  const typeOptions: (AnnouncementType | "All")[] = [
    "All",
    ...Array.from(new Set(announcements.map((a) => a.type))).filter(
      (t): t is AnnouncementType => t in TYPE_STYLE
    ),
  ];

  // ── Loading / error states ──
  if (loading) {
    return (
      <div
        className="p-8 max-w-[1200px] mx-auto flex items-center justify-center"
        style={{ minHeight: "300px" }}
      >
        <p className="text-gray-400" style={{ fontSize: "14px" }}>
          Loading announcements…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="p-8 max-w-[1200px] mx-auto flex items-center justify-center"
        style={{ minHeight: "300px" }}
      >
        <p className="text-red-400" style={{ fontSize: "14px" }}>
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-gray-900"
          style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          Announcements
        </h1>
        <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
          {announcements.length} announcement
          {announcements.length !== 1 ? "s" : ""} for you
        </p>
      </div>

      {/* Search + Type filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 relative" style={{ minWidth: "260px" }}>
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm"
            style={{ fontSize: "13.5px" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {typeOptions.map((t) => {
            const isActive = typeFilter === t;
            const style = t !== "All" ? TYPE_STYLE[t as AnnouncementType] : null;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="px-3.5 py-2.5 rounded-xl border shadow-sm transition-all"
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  backgroundColor: isActive
                    ? (style?.color ?? "#0d9488")
                    : "white",
                  color: isActive ? "white" : (style?.color ?? "#6b7280"),
                  borderColor: isActive
                    ? (style?.color ?? "#0d9488")
                    : "#f3f4f6",
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
        <div
          className={`space-y-3 transition-all duration-300 ${
            selected ? "w-[52%]" : "w-full"
          }`}
        >
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-gray-300" style={{ fontSize: "14px" }}>
                No announcements found.
              </p>
            </div>
          )}
          {filtered.map((ann) => {
            const ts = TYPE_STYLE[ann.type];
            const isSelected = selected?.id === ann.id;
            return (
              <div
                key={ann.id}
                onClick={() => setSelected(isSelected ? null : ann)}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all cursor-pointer group ${
                  isSelected
                    ? "border-teal-300 shadow-md"
                    : "border-gray-100 hover:border-teal-200 hover:shadow-md"
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
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: ts.color,
                      backgroundColor: ts.bg,
                    }}
                  >
                    {ann.type}
                  </span>
                </div>
                <p
                  className="text-gray-400 mb-4 leading-relaxed"
                  style={{ fontSize: "13px" }}
                >
                  {ann.body.slice(0, 120)}
                  {ann.body.length > 120 ? "…" : ""}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#f0fdfa" }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#0d9488",
                        }}
                      >
                        {ann.createdBy.charAt(0)}
                      </span>
                    </div>
                    <span className="text-gray-400" style={{ fontSize: "12.5px" }}>
                      {ann.createdBy}
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="text-gray-400" style={{ fontSize: "12.5px" }}>
                      {ann.date}
                    </span>
                  </div>
                  <span
                    className="text-gray-400 truncate max-w-[140px]"
                    style={{ fontSize: "12px" }}
                  >
                    → {ann.audienceLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel — read-only, no edit/delete controls */}
        {selected && (
          <AnnouncementDetailPanel
            announcement={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}
