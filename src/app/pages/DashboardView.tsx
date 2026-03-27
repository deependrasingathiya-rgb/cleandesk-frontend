// src/app/pages/DashboardView.tsx
// Shared dashboard UI used by both Admin and Management dashboards.
// Pass `config` to control title and nav paths — everything else is identical.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AnnouncementModal, type BatchOption } from "../components/shared/AnnouncementModal";
import {
  fetchAcademicYearsApi,
  fetchClassBatchesByYearApi,
} from "../../Lib/api/class-batches";
import { fetchBatchesDetailedApi } from "../../Lib/api/class-batches";
import {
  fetchDashboardSummary,
  fetchUpcomingTests,
  fetchAttendanceSummary,
  type DashboardSummary,
  type UpcomingTest,
  type AttendanceSummaryRow,
} from "../../Lib/api/dashboard";
import { getToken } from "../auth";
import {
  fetchNotificationsApi,
  markNotificationsReadApi,
  type NotificationRecord,
} from "../../Lib/api/notifications";
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
  BookOpen,
} from "lucide-react";

// ─── Config type — the only thing that differs between Admin and Management ────

export type DashboardConfig = {
  title: string;
  attendancePath: string;
  testsPath: string;
  announcementsPath: string;
};

// ─── Stat card display config ──────────────────────────────────────────────────

const STAT_CONFIG = [
  { label: "Total Students",   icon: Users,         color: "#0d9488", bg: "#f0fdfa" },
  { label: "Active Batches",   icon: Users2,        color: "#d97706", bg: "#fffbeb" },
  { label: "Upcoming Tests",   icon: ClipboardList, color: "#2563eb", bg: "#eff6ff" },
  { label: "Attendance Today", icon: CheckSquare,   color: "#16a34a", bg: "#f0fdf4" },
];

// ─── Notification helpers ──────────────────────────────────────────────────────

function getNotificationStyle(eventType: string): {
  icon: React.ElementType;
  color: string;
  bg: string;
} {
  const map: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    STUDENT_ACCOUNT_CREATED:  { icon: Users,         color: "#0d9488", bg: "#f0fdfa" },
    STUDENT_ABSENT:           { icon: CheckSquare,   color: "#dc2626", bg: "#fef2f2" },
    STUDENT_LATE:             { icon: CheckSquare,   color: "#d97706", bg: "#fffbeb" },
    STUDENT_EARLY_LEAVE:      { icon: CheckSquare,   color: "#7c3aed", bg: "#f5f3ff" },
    TEST_CREATED:             { icon: ClipboardList, color: "#2563eb", bg: "#eff6ff" },
    TEST_DATE_UPDATED:        { icon: ClipboardList, color: "#d97706", bg: "#fffbeb" },
    TEST_RESULT_PUBLISHED:    { icon: TrendingUp,    color: "#16a34a", bg: "#f0fdf4" },
    HOLIDAY_DECLARED:         { icon: Megaphone,     color: "#d97706", bg: "#fffbeb" },
    GENERAL_ANNOUNCEMENT:     { icon: Megaphone,     color: "#0d9488", bg: "#f0fdfa" },
    STUDY_MATERIAL_UPLOADED:  { icon: BookOpen,      color: "#7c3aed", bg: "#f5f3ff" },
    PARENT_TEACHER_MEETING:   { icon: Users,         color: "#2563eb", bg: "#eff6ff" },
    TEST_DAY_ANNOUNCED:       { icon: ClipboardList, color: "#db2777", bg: "#fdf2f8" },
  };
  return map[eventType] ?? { icon: Bell, color: "#6b7280", bg: "#f9fafb" };
}

function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins} min${mins > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}


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
  options,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);

  function toggle(batch: string) {
    if (batch === "Universal") { onChange(["Universal"]); setOpen(false); return; }
    const withoutUniversal = selected.filter((b) => b !== "Universal");
    if (withoutUniversal.includes(batch)) onChange(withoutUniversal.filter((b) => b !== batch));
    else onChange([...withoutUniversal, batch]);
  }

  function remove(batch: string) { onChange(selected.filter((b) => b !== batch)); }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white"
        style={{ fontSize: "13.5px" }}
      >
        <span style={{ color: selected.length === 0 ? "#d1d5db" : "#1f2937" }}>
          {selected.length === 0 ? "Select audience…" : selected.includes("Universal") ? "All Batches (Universal)" : `${selected.length} batch${selected.length > 1 ? "es" : ""} selected`}
        </span>
        <ChevronDown size={14} className="text-gray-400 transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden" style={{ maxHeight: "240px", overflowY: "auto" }}>
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
                  style={{ border: isSelected ? "none" : "2px solid #d1d5db", backgroundColor: isSelected ? "#0d9488" : "transparent" }}
                >
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: isSelected ? 600 : 400 }}>{batch}</span>
                  {isUniversal && (
                    <span className="px-1.5 py-0.5 rounded" style={{ fontSize: "10px", fontWeight: 700, color: "#0d9488", backgroundColor: "#f0fdfa" }}>ALL</span>
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
              style={{ fontSize: "12px", fontWeight: 500, backgroundColor: b === "Universal" ? "#f0fdfa" : "#f3f4f6", color: b === "Universal" ? "#0d9488" : "#374151" }}
            >
              {b}
              <button type="button" onClick={() => remove(b)} className="hover:opacity-70"><X size={10} strokeWidth={2.5} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}




// ─── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-gray-800" style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.01em" }}>{title}</h2>
      {actionLabel && (
        <button onClick={onAction} className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
          {actionLabel}<ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Main shared DashboardView ─────────────────────────────────────────────────

export function DashboardView({ config }: { config: DashboardConfig }) {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

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
  const [announcements, setAnnouncements]   = useState<{ id: string; title: string; preview: string; createdBy: string; date: string; tag: string; tagColor: string; tagBg: string }[]>([]);
  const [batchOptions, setBatchOptions]     = useState<string[]>(["Universal"]);
  const [batchObjects, setBatchObjects]     = useState<BatchOption[]>([]);
  const [notifications, setNotifications]   = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount]       = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadSummary = async () => {
      setSummaryLoading(true); setSummaryError(null);
      try {
        const data = await fetchDashboardSummary();
        if (!isActive) return;
        setSummary(data);
      } catch (err) {
        if (!isActive) return;
        setSummaryError(err instanceof Error ? err.message : "Failed to fetch dashboard summary");
      } finally { if (isActive) setSummaryLoading(false); }
    };

    const loadTests = async () => {
      setTestsLoading(true); setTestsError(null);
      try {
        const data = await fetchUpcomingTests(5);
        if (!isActive) return;
        setUpcomingTests(data);
      } catch (err) {
        if (!isActive) return;
        setTestsError(err instanceof Error ? err.message : "Failed to fetch upcoming tests");
      } finally { if (isActive) setTestsLoading(false); }
    };

    const loadAttendance = async () => {
      setAttendanceLoading(true); setAttendanceError(null);
      try {
        const years = await fetchAcademicYearsApi();
        const activeYear = years.find((year) => year.is_active);
        if (!activeYear) {
          if (!isActive) return;
          setAttendanceRows([]); setAttendanceDate(""); setAttendanceScopeLabel("");
          return;
        }
        const [data, activeBatches] = await Promise.all([fetchAttendanceSummary(), fetchClassBatchesByYearApi(activeYear.id)]);
        if (!isActive) return;
        const activeBatchNames = new Set(activeBatches.map((batch) => batch.name.trim().toLowerCase()));
        setAttendanceRows(data.rows.filter((row) => activeBatchNames.has(row.batch_name.trim().toLowerCase())));
        setAttendanceDate(data.date);
        setAttendanceScopeLabel(activeYear.label);
      } catch (err) {
        if (!isActive) return;
        setAttendanceError(err instanceof Error ? err.message : "Failed to fetch attendance summary");
      } finally { if (isActive) setAttendanceLoading(false); }
    };

    const loadAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements", { headers: { Authorization: `Bearer ${getToken()}` } });
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.data)) return;
        const mapped = (data.data as any[]).slice(0, 5).map((a) => {
          const typeKey = a.announcement_type as string;
          const DB_TO_DISPLAY: Record<string, string> = {
            GENERAL: "General", HOLIDAY: "Holiday", TEST: "Test",
            RESULT: "Result", EVENT: "Event", TRIP: "Trip",
            EXHIBITION: "Exhibition", PTM: "Parent-Teacher Meet",
            SCHEDULE_CHANGE: "Schedule Change", EMERGENCY: "Emergency",
          };
          const displayType = DB_TO_DISPLAY[typeKey] ?? "General";
          const style = (TYPE_STYLE as any)[displayType] ?? { color: "#6b7280", bg: "#f9fafb" };
          const d = new Date(a.created_at);
          const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          return {
            id: a.id,
            title: a.announcement_title || typeKey,
            preview: a.message,
            createdBy: a.created_by ?? "—",
            date: `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
            tag: displayType,
            tagColor: style.color,
            tagBg: style.bg,
          };
        });
        if (isActive) setAnnouncements(mapped);
      } catch { /* fail silently */ }
    };

    const loadBatches = async () => {
      try {
        const batches = await fetchBatchesDetailedApi();
        if (isActive) {
          const batchOpts: BatchOption[] = batches.map((b) => ({ id: b.id, name: b.name }));
          setBatchObjects(batchOpts);
          setBatchOptions(["Universal", ...batchOpts.map((b) => b.name)]);
        }
      } catch { /* fail silently */ }
    };

    const loadNotifications = async () => {
      try {
        const result = await fetchNotificationsApi({ limit: 5 });
        if (isActive) {
          setNotifications(result.notifications);
          setUnreadCount(result.unread_count);
        }
      } catch { /* fail silently */ }
    };


    const refreshDashboard = async () => {
      await Promise.allSettled([loadSummary(), loadTests(), loadAttendance(), loadAnnouncements(), loadBatches(), loadNotifications()]);
      if (isActive) setLastUpdated(new Date().toISOString());
    };

    refreshDashboard();
    const intervalId = window.setInterval(refreshDashboard, 60_000);
    return () => { isActive = false; window.clearInterval(intervalId); };
  }, []);

  const stats = summary
    ? [
        { ...STAT_CONFIG[0], value: summary.total_students.toLocaleString("en-IN"), change: `+${summary.new_this_week} this week` },
        { ...STAT_CONFIG[1], value: String(summary.active_batches), change: "Active this academic year" },
        { ...STAT_CONFIG[2], value: String(summary.upcoming_tests), change: "From today onwards" },
        { ...STAT_CONFIG[3], value: summary.attendance_today_pct !== null ? `${summary.attendance_today_pct}%` : "—",
          change: summary.attendance_total_marked > 0 ? `${summary.attendance_marked_present} present of ${summary.attendance_total_marked} total` : "No attendance marked yet today" },
      ]
    : STAT_CONFIG.map((c) => ({ ...c, value: summaryLoading ? "—" : "N/A", change: summaryLoading ? "Loading…" : summaryError ?? "Summary unavailable" }));

  const pageDateLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null;
  const dashboardErrors = [summaryError, attendanceError, testsError].filter(Boolean);

  function handleCreateSuccess() {
    setShowCreateModal(false);
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>{config.title}</h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>Overview of institute activity — {pageDateLabel}</p>
          {lastUpdatedLabel && <p className="text-gray-300 mt-1" style={{ fontSize: "12px" }}>Auto-refreshing every minute. Last updated at {lastUpdatedLabel}.</p>}
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}>
          <Plus size={16} strokeWidth={2.5} />
          Create Announcement
        </button>
      </div>

      {showCreateModal && (
        <AnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          preloadedBatchOptions={batchObjects}
        />
      )}

      {dashboardErrors.length > 0 && (
        <div className="mb-6 rounded-2xl border px-4 py-3" style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}>
          <p className="text-red-600" style={{ fontSize: "13px", fontWeight: 600 }}>Some dashboard sections could not be refreshed.</p>
          <p className="text-red-500 mt-1" style={{ fontSize: "12.5px" }}>{dashboardErrors.join(" ")}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, change, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400" style={{ fontSize: "12px", fontWeight: 500 }}>{label}</p>
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon size={16} style={{ color }} strokeWidth={2} />
              </div>
            </div>
            <p className="text-gray-900" style={{ fontSize: "26px", fontWeight: 750, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
            <p className="text-gray-400 mt-2" style={{ fontSize: "11px" }}>{change}</p>
          </div>
        ))}
      </div>

      {/* Attendance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <SectionHeader title="Attendance Overview" actionLabel="View All" onAction={() => navigate(config.attendancePath)} />
        {attendanceScopeLabel && <p className="text-gray-400 mb-4" style={{ fontSize: "12px" }}>Showing active batches from {attendanceScopeLabel}.</p>}
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {["Batch", "Present", "Absent", "Late", "Date"].map((col) => (
                  <th key={col} className="text-left text-gray-400 px-4 py-3" style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em" }}>{col.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceLoading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400" style={{ fontSize: "13px" }}>Loading attendance summary…</td></tr>
              ) : attendanceError ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-red-400" style={{ fontSize: "13px" }}>{attendanceError}</td></tr>
              ) : attendanceRows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400" style={{ fontSize: "13px" }}>No attendance marked yet for today.</td></tr>
              ) : attendanceRows.map((row) => {
                const pct = row.total_marked > 0 ? Math.round((row.present / row.total_marked) * 100) : 0;
                return (
                  <tr key={row.batch_name} className="border-t border-gray-50">
                    <td className="px-4 py-3.5"><span className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 500 }}>{row.batch_name}</span></td>
                    <td className="px-4 py-3.5"><div className="flex items-center gap-2"><span className="text-green-600" style={{ fontSize: "13.5px", fontWeight: 600 }}>{row.present}</span><span className="text-gray-300" style={{ fontSize: "12px" }}>({pct}%)</span></div></td>
                    <td className="px-4 py-3.5"><span className="text-red-500" style={{ fontSize: "13.5px", fontWeight: 500 }}>{row.absent}</span></td>
                    <td className="px-4 py-3.5"><span className="text-amber-500" style={{ fontSize: "13.5px", fontWeight: 500 }}>{row.late}</span></td>
                    <td className="px-4 py-3.5"><span className="text-gray-400" style={{ fontSize: "13px" }}>{attendanceDate ? new Date(attendanceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Tests */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <SectionHeader title="Upcoming Tests" actionLabel="View All" onAction={() => navigate(config.testsPath)} />
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {["Test Name", "Subject", "Batch", "Test Date", "Created By"].map((col) => (
                  <th key={col} className="text-left text-gray-400 px-4 py-3" style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em" }}>{col.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {testsLoading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400" style={{ fontSize: "13px" }}>Loading upcoming tests…</td></tr>
              ) : testsError ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-red-400" style={{ fontSize: "13px" }}>{testsError}</td></tr>
              ) : upcomingTests.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400" style={{ fontSize: "13px" }}>No upcoming tests scheduled.</td></tr>
              ) : upcomingTests.map((test) => (
                <tr key={test.id} className="border-t border-gray-50">
                  <td className="px-4 py-3.5"><span className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 600 }}>{test.test_name}</span></td>
                  <td className="px-4 py-3.5"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, backgroundColor: "#f0fdfa", color: "#0d9488" }}>{test.subject}</span></td>
                  <td className="px-4 py-3.5"><span className="text-gray-500" style={{ fontSize: "13px" }}>{test.batch_name}</span></td>
                  <td className="px-4 py-3.5"><span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 500 }}>{new Date(test.test_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></td>
                  <td className="px-4 py-3.5"><span className="text-gray-400" style={{ fontSize: "13px" }}>{test.created_by ?? "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Announcements + Notifications */}
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader title="Announcements" actionLabel="View All" onAction={() => navigate(config.announcementsPath)} />
            <div className="space-y-4 overflow-y-auto" style={{ maxHeight: "320px" }}>
              {announcements.length === 0 ? (
                <p className="text-gray-300 text-center py-6" style={{ fontSize: "13px" }}>No announcements yet.</p>
              ) : announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-xl border border-gray-100">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-gray-800" style={{ fontSize: "14px", fontWeight: 650, lineHeight: 1.4 }}>{ann.title}</h3>
                    <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: ann.tagColor, backgroundColor: ann.tagBg }}>{ann.tag}</span>
                  </div>
                  <p className="text-gray-400 mb-3 leading-relaxed" style={{ fontSize: "12.5px" }}>{ann.preview}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#f0fdfa" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#0d9488" }}>{ann.createdBy.charAt(0)}</span>
                    </div>
                    <span className="text-gray-400" style={{ fontSize: "12px" }}>{ann.createdBy}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-gray-400" style={{ fontSize: "12px" }}>{ann.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-800" style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.01em" }}>Notifications</h2>
              {unreadCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: "#f0fdfa" }}>
                  <Bell size={12} style={{ color: "#0d9488" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#0d9488" }}>{unreadCount} new</span>
                </div>
              )}
            </div>
            <div className="space-y-1 overflow-y-auto" style={{ maxHeight: "320px" }}>
              {notifications.length === 0 ? (
                <p className="text-gray-300 text-center py-6" style={{ fontSize: "13px" }}>No notifications yet.</p>
              ) : (
                notifications.map((notif) => {
                  const style = getNotificationStyle(notif.event_type);
                  const Icon  = style.icon;
                  const relativeTime = getRelativeTime(notif.created_at);
                  return (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                      style={{ backgroundColor: notif.is_read ? "transparent" : "#f0fdfa22" }}
                      onClick={() => {
                        if (!notif.is_read) {
                          markNotificationsReadApi([notif.id]).catch(() => {});
                          setNotifications(prev =>
                            prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
                          );
                          setUnreadCount(c => Math.max(0, c - 1));
                        }
                      }}
                    >
                      <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: style.bg }}>
                        <Icon size={15} style={{ color: style.color }} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 leading-snug" style={{ fontSize: "12.5px", fontWeight: notif.is_read ? 400 : 600 }}>
                          {notif.message}
                        </p>
                        <p className="text-gray-300 mt-1" style={{ fontSize: "11px" }}>{relativeTime}</p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "#0d9488" }} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  markNotificationsReadApi().catch(() => {});
                  setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                  setUnreadCount(0);
                }}
                className="w-full mt-4 py-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-colors"
                style={{ fontSize: "12.5px", fontWeight: 500 }}
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}