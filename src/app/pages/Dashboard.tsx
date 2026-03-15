import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { createAnnouncementApi } from "../../Lib/api/announcements";
import {
  fetchAcademicYearsApi,
  fetchClassBatchesByYearApi,
} from "../../Lib/api/class-batches";
import {
  fetchDashboardSummary,
  fetchUpcomingTests,
  fetchAttendanceSummary,
  type DashboardSummary,
  type UpcomingTest,
  type AttendanceSummaryRow,
} from "../../Lib/api/dashboard";
import {
  Users,
  Users2,
  ClipboardList,
  CheckSquare,
  Bell,
  ArrowRight,
  TrendingUp,
  Megaphone,
  Plus,
  X,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

// ─── Stat card display config (styling only) ──────────────────────────────────

const STAT_CONFIG = [
  { label: "Total Students",   icon: Users,         color: "#0d9488", bg: "#f0fdfa" },
  { label: "Active Batches",   icon: Users2,        color: "#d97706", bg: "#fffbeb" },
  { label: "Upcoming Tests",   icon: ClipboardList, color: "#2563eb", bg: "#eff6ff" },
  { label: "Attendance Today", icon: CheckSquare,   color: "#16a34a", bg: "#f0fdf4" },
];
// ─── Announcement Modal Dependencies ─────────────────────────────────────────

const ANNOUNCEMENT_TYPES = [
  "To Staff",
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
  "General":             { color: "#6b7280", bg: "#f9fafb" },
  "To Staff":            { color: "#6b7822", bg: "#f9fafb" },
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

const BATCH_OPTIONS = [
  "Universal",
  "Science – Batch A",
  "Commerce – Batch B",
  "Arts – Batch C",
  "Math – Batch D",
  "Physics – Batch E",
  "Biology – Batch F",
];

type FormState = {
  type: AnnouncementType | "";
  title: string;
  body: string;
  batches: string[];
};

const emptyForm: FormState = { type: "", title: "", body: "", batches: [] };

function BatchSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
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
          {BATCH_OPTIONS.map((batch) => {
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
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
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
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#0d9488",
                        backgroundColor: "#f0fdfa",
                      }}
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

function AnnouncementModal({
  onClose,
  onSubmit,
  submitting = false,
  apiError = null,
}: {
  onClose: () => void;
  onSubmit: (f: FormState) => void;
  submitting?: boolean;
  apiError?: string | null;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof FormState>(key: K) =>
    (val: FormState[K]) => setForm((f) => ({ ...f, [key]: val }));

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

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-7"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2
              className="text-gray-900"
              style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}
            >
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

        <div className="space-y-5">
          {/* Announcement Type */}
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
            <BatchSelector selected={form.batches} onChange={set("batches")} />
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
                style={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: typeStyle!.color,
                  backgroundColor: typeStyle!.bg,
                }}
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
          {/* Actions */}
          {apiError && (
            <p className="text-red-500 text-center" style={{ fontSize: "12.5px" }}>
              {apiError}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
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
    </div>
  );
}


const announcements = [
  {
    id: 1,
    title: "Annual Sports Day – Registration Open",
    preview:
      "All students are invited to register for the Annual Sports Day event scheduled for March 20th. Multiple track and field events are available.",
    createdBy: "Admin Office",
    date: "Mar 5, 2026",
    tag: "Event",
    tagColor: "#7c3aed",
    tagBg: "#f5f3ff",
  },
  {
    id: 2,
    title: "Mid-Term Exam Schedule Released",
    preview:
      "The mid-term examination schedule for all batches has been published. Students are advised to check their respective batch portals.",
    createdBy: "Exam Department",
    date: "Mar 4, 2026",
    tag: "Academic",
    tagColor: "#2563eb",
    tagBg: "#eff6ff",
  },
  {
    id: 3,
    title: "Holiday Notice – Holi Festival",
    preview:
      "The institute will remain closed on March 14th on account of the Holi festival. Online classes will resume from March 15th.",
    createdBy: "Principal's Office",
    date: "Mar 3, 2026",
    tag: "Holiday",
    tagColor: "#d97706",
    tagBg: "#fffbeb",
  },
];

const notifications = [
  {
    id: 1,
    icon: Users,
    text: "New student enrolled: Sneha Patel in Science Batch A",
    time: "10 mins ago",
    color: "#0d9488",
    bg: "#f0fdfa",
  },
  {
    id: 2,
    icon: TrendingUp,
    text: "Marks uploaded for Mid-Term Chemistry – Batch A",
    time: "42 mins ago",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    id: 3,
    icon: CheckSquare,
    text: "Attendance marked for Commerce Batch B – Mar 6",
    time: "1 hr ago",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    id: 4,
    icon: ClipboardList,
    text: "New test added: Algebra Unit Test – Math Batch D",
    time: "2 hrs ago",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    id: 5,
    icon: Megaphone,
    text: "Announcement posted: Sports Day Registration Open",
    time: "3 hrs ago",
    color: "#d97706",
    bg: "#fffbeb",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2
        className="text-gray-800"
        style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.01em" }}
      >
        {title}
      </h2>
      {actionLabel && (
        <button
          onClick={onAction}
          className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 transition-colors"
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          {actionLabel}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── Live data state ──
  const [summary, setSummary]               = useState<DashboardSummary | null>(null);
  const [upcomingTests, setUpcomingTests]   = useState<UpcomingTest[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceSummaryRow[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [testsLoading, setTestsLoading]     = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [summaryError, setSummaryError]     = useState<string | null>(null);
  const [testsError, setTestsError]         = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated]       = useState<string | null>(null);
  const [attendanceScopeLabel, setAttendanceScopeLabel] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const data = await fetchDashboardSummary();
        if (!isActive) return;
        setSummary(data);
      } catch (err) {
        if (!isActive) return;
        setSummaryError(err instanceof Error ? err.message : "Failed to fetch dashboard summary");
      } finally {
        if (isActive) setSummaryLoading(false);
      }
    };

    const loadTests = async () => {
      setTestsLoading(true);
      setTestsError(null);
      try {
        const data = await fetchUpcomingTests(5);
        if (!isActive) return;
        setUpcomingTests(data);
      } catch (err) {
        if (!isActive) return;
        setTestsError(err instanceof Error ? err.message : "Failed to fetch upcoming tests");
      } finally {
        if (isActive) setTestsLoading(false);
      }
    };

    const loadAttendance = async () => {
      setAttendanceLoading(true);
      setAttendanceError(null);
      try {
        const years = await fetchAcademicYearsApi();
        const activeYear = years.find((year) => year.is_active);

        if (!activeYear) {
          if (!isActive) return;
          setAttendanceRows([]);
          setAttendanceDate("");
          setAttendanceScopeLabel("");
          return;
        }

        const [data, activeBatches] = await Promise.all([
          fetchAttendanceSummary(),
          fetchClassBatchesByYearApi(activeYear.id),
        ]);

        if (!isActive) return;
        const activeBatchNames = new Set(
          activeBatches.map((batch) => batch.name.trim().toLowerCase())
        );

        setAttendanceRows(
          data.rows.filter((row) => activeBatchNames.has(row.batch_name.trim().toLowerCase()))
        );
        setAttendanceDate(data.date);
        setAttendanceScopeLabel(activeYear.label);
      } catch (err) {
        if (!isActive) return;
        setAttendanceError(err instanceof Error ? err.message : "Failed to fetch attendance summary");
      } finally {
        if (isActive) setAttendanceLoading(false);
      }
    };

    const refreshDashboard = async () => {
      await Promise.allSettled([loadSummary(), loadTests(), loadAttendance()]);
      if (isActive) setLastUpdated(new Date().toISOString());
    };

    refreshDashboard();
    const intervalId = window.setInterval(refreshDashboard, 60_000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  // Build stat cards from live summary
  const stats = summary
    ? [
        {
          ...STAT_CONFIG[0],
          value: summary.total_students.toLocaleString("en-IN"),
          change: `+${summary.new_this_week} this week`,
        },
        {
          ...STAT_CONFIG[1],
          value: String(summary.active_batches),
          change: "Active this academic year",
        },
        {
          ...STAT_CONFIG[2],
          value: String(summary.upcoming_tests),
          change: "From today onwards",
        },
        {
          ...STAT_CONFIG[3],
          value: summary.attendance_today_pct !== null
            ? `${summary.attendance_today_pct}%`
            : "—",
          change: summary.attendance_total_marked > 0
            ? `${summary.attendance_marked_present} present of ${summary.attendance_total_marked} marked`
            : "No attendance marked yet today",
        },
      ]
    : STAT_CONFIG.map((c) => ({
        ...c,
        value: summaryLoading ? "—" : "N/A",
        change: summaryLoading
          ? "Loading…"
          : summaryError ?? "Summary unavailable",
      }));

  const pageDateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const dashboardErrors = [summaryError, attendanceError, testsError].filter(Boolean);

  async function handleCreateAnnouncement(form: FormState) {
    setSubmitting(true);
    setApiError(null);
    try {
      await createAnnouncementApi({
        announcement_type: form.type.toUpperCase().replace(/ /g, "_"),
        announcement_title: form.title || form.type,
        message: form.body,
        class_batch_id: form.batches.includes("Universal") || form.batches.length === 0
          ? null
          : form.batches[0] ?? null,
        school_attribute: null,
      });
      setShowCreateModal(false);
    } catch (err: any) {
      setApiError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* ── 1. Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-gray-900"
            style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            Overview of institute activity — {pageDateLabel}
          </p>
          {lastUpdatedLabel && (
            <p className="text-gray-300 mt-1" style={{ fontSize: "12px" }}>
              Auto-refreshing every minute. Last updated at {lastUpdatedLabel}.
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Create Announcement
        </button>
      </div>

      {showCreateModal && (
  <AnnouncementModal
    onClose={() => { setShowCreateModal(false); setApiError(null); }}
    onSubmit={handleCreateAnnouncement}
    submitting={submitting}
    apiError={apiError}
  />
)}

      {dashboardErrors.length > 0 && (
        <div
          className="mb-6 rounded-2xl border px-4 py-3"
          style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}
        >
          <p className="text-red-600" style={{ fontSize: "13px", fontWeight: 600 }}>
            Some dashboard sections could not be refreshed.
          </p>
          <p className="text-red-500 mt-1" style={{ fontSize: "12.5px" }}>
            {dashboardErrors.join(" ")}
          </p>
        </div>
      )}

      {/* ── 2. Statistics Cards Row ── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, change, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400" style={{ fontSize: "12px", fontWeight: 500 }}>
                {label}
              </p>
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: bg }}
              >
                <Icon size={16} style={{ color }} strokeWidth={2} />
              </div>
            </div>
            <p
              className="text-gray-900"
              style={{ fontSize: "26px", fontWeight: 750, letterSpacing: "-0.03em", lineHeight: 1 }}
            >
              {value}
            </p>
            <p className="text-gray-400 mt-2" style={{ fontSize: "11px" }}>
              {change}
            </p>
          </div>
        ))}
      </div>

      {/* ── 3. Attendance Summary Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <SectionHeader
          title="Attendance Overview"
          actionLabel="View All"
          onAction={() => navigate("/attendance")}
        />
        {attendanceScopeLabel && (
          <p className="text-gray-400 mb-4" style={{ fontSize: "12px" }}>
            Showing active batches from {attendanceScopeLabel}.
          </p>
        )}
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {["Batch", "Present", "Absent", "Late", "Date"].map((col) => (
                  <th
                    key={col}
                    className="text-left text-gray-400 px-4 py-3"
                    style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em" }}
                  >
                    {col.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400" style={{ fontSize: "13px" }}>
                    Loading attendance summary…
                  </td>
                </tr>
              ) : attendanceError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-red-400" style={{ fontSize: "13px" }}>
                    {attendanceError}
                  </td>
                </tr>
              ) : attendanceRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400" style={{ fontSize: "13px" }}>
                    No attendance marked yet for today.
                  </td>
                </tr>
              ) : attendanceRows.map((row) => {
                const pct = row.total_marked > 0
                  ? Math.round((row.present / row.total_marked) * 100)
                  : 0;
                return (
                  <tr
                    key={row.batch_name}
                    className="border-t border-gray-50"
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 500 }}>
                        {row.batch_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                          {row.present}
                        </span>
                        <span className="text-gray-300" style={{ fontSize: "12px" }}>
                          ({pct}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-red-500" style={{ fontSize: "13.5px", fontWeight: 500 }}>
                        {row.absent}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-amber-500" style={{ fontSize: "13.5px", fontWeight: 500 }}>
                        {row.late}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-gray-400" style={{ fontSize: "13px" }}>
                        {attendanceDate
                          ? new Date(attendanceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. Upcoming Tests Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <SectionHeader
          title="Upcoming Tests"
          actionLabel="View All"
          onAction={() => navigate("/tests")}
        />
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {["Test Name", "Subject", "Batch", "Test Date", "Created By"].map((col) => (
                  <th
                    key={col}
                    className="text-left text-gray-400 px-4 py-3"
                    style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em" }}
                  >
                    {col.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {testsLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400" style={{ fontSize: "13px" }}>
                    Loading upcoming tests…
                  </td>
                </tr>
              ) : testsError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-red-400" style={{ fontSize: "13px" }}>
                    {testsError}
                  </td>
                </tr>
              ) : upcomingTests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400" style={{ fontSize: "13px" }}>
                    No upcoming tests scheduled.
                  </td>
                </tr>
              ) : upcomingTests.map((test) => (
                <tr key={test.id} className="border-t border-gray-50">
                  <td className="px-4 py-3.5">
                    <span className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                      {test.test_name}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                      style={{ fontSize: "11.5px", fontWeight: 600, backgroundColor: "#f0fdfa", color: "#0d9488" }}
                    >
                      {test.subject}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-gray-500" style={{ fontSize: "13px" }}>
                      {test.batch_name}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 500 }}>
                      {new Date(test.test_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-gray-400" style={{ fontSize: "13px" }}>
                      {test.created_by ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5 & 6. Announcements + Notifications ── */}
      <div className="grid grid-cols-5 gap-6">
        {/* Announcements Feed */}
        <div className="col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader
              title="Announcements"
              actionLabel="View All"
              onAction={() => navigate("/announcements")}
            />
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-xl border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3
                      className="text-gray-800"
                      style={{ fontSize: "14px", fontWeight: 650, lineHeight: 1.4 }}
                    >
                      {ann.title}
                    </h3>
                    <span
                      className="flex-shrink-0 px-2.5 py-0.5 rounded-full"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: ann.tagColor,
                        backgroundColor: ann.tagBg,
                      }}
                    >
                      {ann.tag}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-3 leading-relaxed" style={{ fontSize: "12.5px" }}>
                    {ann.preview}
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#f0fdfa" }}
                    >
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#0d9488" }}>
                        {ann.createdBy.charAt(0)}
                      </span>
                    </div>
                    <span className="text-gray-400" style={{ fontSize: "12px" }}>
                      {ann.createdBy}
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="text-gray-400" style={{ fontSize: "12px" }}>
                      {ann.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications Panel */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-gray-800"
                style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.01em" }}
              >
                Notifications
              </h2>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#f0fdfa" }}
              >
                <Bell size={12} style={{ color: "#0d9488" }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#0d9488" }}>
                  {notifications.length} new
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {notifications.map((notif) => {
                const Icon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: notif.bg }}
                    >
                      <Icon size={15} style={{ color: notif.color }} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-gray-700 leading-snug"
                        style={{ fontSize: "12.5px", fontWeight: 450 }}
                      >
                        {notif.text}
                      </p>
                      <p className="text-gray-300 mt-1" style={{ fontSize: "11px" }}>
                        {notif.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="w-full mt-4 py-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-colors"
              style={{ fontSize: "12.5px", fontWeight: 500 }}
            >
              View all notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
