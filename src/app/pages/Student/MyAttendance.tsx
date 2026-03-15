// src/app/pages/Student/MyAttendance.tsx

import { useState, useEffect } from "react";
import {
  CheckSquare,
  X,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Info,
} from "lucide-react";
import {
  fetchStudentAttendancePage,
  type StudentAttendancePageData,
  type AttendanceDayRecord,
  type MonthSummary,
} from "../../../Lib/api/student-attendance";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DayStatus = "present" | "absent" | "late" | "early_leave" | "none";

// Derived DayRecord used by calendar/log — built from API AttendanceDayRecord
type DayRecord = {
  date: string;
  status: DayStatus;
  createdByName?: string;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
  wasEdited: boolean; // true if updated_at differs meaningfully from created_at
};

function toDayRecord(r: AttendanceDayRecord): DayRecord {
  let status: DayStatus;
  if (r.status === "absent") {
    status = "absent";
  } else if (r.early_leave) {
    status = "early_leave";
  } else if (r.late) {
    status = "late";
  } else {
    status = "present";
  }

  // Consider record "edited" if updated_at is more than 60 seconds after created_at
  const wasEdited =
    !!r.updated_at &&
    !!r.created_at &&
    Math.abs(new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) > 60_000;

  return {
    date: r.date,
    status,
    createdByName: r.created_by_name ?? undefined,
    updatedByName: r.updated_by_name ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    wasEdited,
  };
}
// ─── Helpers ────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function parseIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}



// ─── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DayStatus, { label: string; color: string; bg: string; ring: string }> = {
  present:     { label: "Present",          color: "#16a34a", bg: "#dcfce7", ring: "#16a34a" },
  absent:      { label: "Absent",           color: "#dc2626", bg: "#fee2e2", ring: "#dc2626" },
  late:        { label: "Late",             color: "#d97706", bg: "#fef9c3", ring: "#d97706" },
  early_leave: { label: "Early Leave",      color: "#7c3aed", bg: "#f5f3ff", ring: "#7c3aed" },
  none:        { label: "—",               color: "#d1d5db", bg: "#f9fafb", ring: "#e5e7eb" },
};

// ─── Day Tooltip ────────────────────────────────────────────────────────────────

function DayCell({
  iso,
  isCurrentMonth,
  recordMap,
}: {
  iso: string;
  isCurrentMonth: boolean;
  recordMap: Map<string, DayRecord>;
}) {
  const [hovered, setHovered] = useState(false);
  const record = recordMap.get(iso);
  const status = record?.status ?? "none";
  const cfg    = STATUS_CONFIG[status];
  const { d }  = parseIso(iso);
  const isToday = iso === "2026-03-08";

  if (!isCurrentMonth) {
    return <div className="aspect-square rounded-md" style={{ backgroundColor: "transparent" }} />;
  }

  return (
    <div
      className="relative aspect-square rounded-xl flex items-center justify-center cursor-default transition-transform hover:scale-110"
      style={{
        backgroundColor: cfg.bg,
        border: isToday ? `2px solid ${cfg.ring}` : "2px solid transparent",
        opacity: status === "none" ? 0.35 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: isToday ? 800 : 600,
          color: status === "none" ? "#9ca3af" : cfg.color,
        }}
      >
        {d}
      </span>

      {/* Tooltip */}
      {hovered && status !== "none" && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none"
          style={{ minWidth: "140px" }}
        >
          <div
            className="rounded-xl shadow-lg px-3 py-2.5 text-center"
            style={{
              backgroundColor: "white",
              border: "1px solid #f3f4f6",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <p style={{ fontSize: "11px", fontWeight: 700, color: cfg.color }}>
              {cfg.label}
            </p>
            {record?.wasEdited && record.updatedByName && (
              <p className="text-gray-400 mt-0.5" style={{ fontSize: "10px" }}>
                Updated by {record.updatedByName}
              </p>
            )}
            {!record?.wasEdited && record?.createdByName && (
              <p className="text-gray-400 mt-0.5" style={{ fontSize: "10px" }}>
                By {record.createdByName}
              </p>
            )}
            {record?.createdAt && (
              <p className="text-gray-400 mt-0.5" style={{ fontSize: "10px" }}>
                {new Date(record.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          {/* Arrow */}
          <div
            className="mx-auto"
            style={{
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid white",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Monthly Calendar ────────────────────────────────────────────────────────────

function MonthCalendar({
  year,
  month,
  recordMap,
  monthSummary,
}: {
  year: number;
  month: number; // 0-indexed (UI convention kept)
  recordMap: Map<string, DayRecord>;
  monthSummary: MonthSummary | undefined;
}) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // month+1 because MonthSummary uses 1-indexed month
  const presentCount  = monthSummary?.present     ?? 0;
  const lateCount     = monthSummary?.late         ?? 0;
  const earlyCount    = monthSummary?.early_leave  ?? 0;
  const absentCount   = monthSummary?.absent       ?? 0;
  const pct           = monthSummary?.attendance_pct ?? 0;

  // Build 6-row grid cells
  const cells: Array<{ iso: string; inMonth: boolean }> = [];
  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    cells.push({ iso: "", inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toIso(year, month, d), inMonth: true });
  }
  // Trailing empty cells to fill 6 rows
  while (cells.length % 7 !== 0) {
    cells.push({ iso: "", inMonth: false });
  }

  return (
    <div>
      {/* Month summary row */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {[
          { label: "Present",     value: presentCount, color: "#16a34a", bg: "#dcfce7" },
          { label: "Late",        value: lateCount,    color: "#d97706", bg: "#fef9c3" },
          { label: "Early Leave", value: earlyCount,   color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Absent",      value: absentCount,  color: "#dc2626", bg: "#fee2e2" },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
            style={{ backgroundColor: bg }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: "11px", color, opacity: 0.8 }}>{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-gray-400" style={{ fontSize: "12px" }}>Attendance:</span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: pct >= 90 ? "#16a34a" : pct >= 75 ? "#d97706" : "#dc2626",
            }}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center">
            <span className="text-gray-400" style={{ fontSize: "10.5px", fontWeight: 600 }}>
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, idx) =>
          cell.inMonth ? (
            <DayCell key={idx} iso={cell.iso} isCurrentMonth recordMap={recordMap} />
          ) : (
            <div key={idx} className="aspect-square" />
          )
        )}
      </div>
    </div>
  );
}

// ─── Streak Calculator ──────────────────────────────────────────────────────────



// ─── Main Component ────────────────────────────────────────────────────────────

export function MyAttendance() {
  const todayDate   = new Date();
  const todayYear   = todayDate.getFullYear();
  const todayMonth  = todayDate.getMonth(); // 0-indexed

  const [viewYear,  setViewYear]  = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);
  const [activeTab, setActiveTab] = useState<"calendar" | "log">("calendar");

  const [data,    setData]    = useState<StudentAttendancePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchStudentAttendancePage()
      .then(setData)
      .catch(e => setError(e.message ?? "Failed to load attendance"))
      .finally(() => setLoading(false));
  }, []);

  // Build a fast lookup map from date string → DayRecord
  const recordMap = new Map<string, DayRecord>();
  if (data) {
    for (const r of data.day_records) {
      recordMap.set(r.date, toDayRecord(r));
    }
  }

  // Build monthly trend lookup keyed by "YYYY-M" (1-indexed month)
  const monthSummaryMap = new Map<string, MonthSummary>();
  if (data) {
    for (const ms of data.monthly_trend) {
      monthSummaryMap.set(`${ms.year}-${ms.month}`, ms);
    }
  }

  const currentMonthSummary = monthSummaryMap.get(`${viewYear}-${viewMonth + 1}`);

  // Stats from API
  const overallPct       = data?.overall_pct       ?? 0;
  const REQUIRED_PCT     = data?.min_required_pct  ?? 75;
  const isEligible       = data?.min_required_met  ?? false;
  const daysNeeded       = data?.days_needed_for_eligibility ?? 0;
  const totalPresent     = data?.overall_present     ?? 0;
  const totalAbsent      = data?.overall_absent      ?? 0;
  const totalLate        = data?.overall_late        ?? 0;
  const totalEarlyLeave  = data?.overall_early_leave ?? 0;
  const totalWorking     = data?.overall_total_marked ?? 0;
  const currentStreak    = data?.current_streak      ?? 0;
  const longestStreak    = data?.longest_streak      ?? 0;

  // Log: already sorted desc by backend
  const logEntries = data?.day_records.map(toDayRecord) ?? [];

  // Monthly trend for bar chart — sorted asc (backend returns desc)
  const monthTrend = (data?.monthly_trend ?? [])
    .slice()
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const canGoNext = viewYear < todayYear || (viewYear === todayYear && viewMonth < todayMonth);

  if (loading) {
    return (
      <div className="p-8 max-w-[1100px] mx-auto flex items-center justify-center" style={{ minHeight: "300px" }}>
        <span className="text-gray-400" style={{ fontSize: "14px" }}>Loading attendance…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1100px] mx-auto">
        <p className="text-red-500" style={{ fontSize: "14px" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1100px] mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            My Attendance
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {data?.batch_name ?? "—"} · {data?.login_identifier ?? "—"}
          </p>
        </div>

        {/* Eligibility badge */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
          style={{
            backgroundColor: isEligible ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${isEligible ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {isEligible ? (
            <CheckSquare size={16} style={{ color: "#16a34a" }} strokeWidth={2.5} />
          ) : (
            <AlertTriangle size={16} style={{ color: "#dc2626" }} strokeWidth={2.5} />
          )}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: isEligible ? "#15803d" : "#dc2626" }}>
              {isEligible ? "Attendance Eligible" : "Below Required Attendance"}
            </p>
            <p style={{ fontSize: "11px", color: isEligible ? "#16a34a" : "#ef4444" }}>
              {isEligible
                ? `${overallPct}% · Above ${REQUIRED_PCT}% requirement`
                : `Need ${daysNeeded} more present day${daysNeeded > 1 ? "s" : ""} to reach ${REQUIRED_PCT}%`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          {
            label: "Overall",
            value: `${overallPct}%`,
            icon: TrendingUp,
            color: overallPct >= 90 ? "#0d9488" : overallPct >= 75 ? "#d97706" : "#dc2626",
            bg:    overallPct >= 90 ? "#f0fdfa" : overallPct >= 75 ? "#fffbeb" : "#fef2f2",
            sub:   `of ${totalWorking} working days`,
          },
          {
            label: "Present",
            value: String(totalPresent),
            icon: UserCheck,
            color: "#16a34a",
            bg:    "#f0fdf4",
            sub:   "incl. late arrivals",
          },
          {
            label: "Absent",
            value: String(totalAbsent),
            icon: X,
            color: "#dc2626",
            bg:    "#fef2f2",
            sub:   totalWorking > 0 ? `${Math.round((totalAbsent / totalWorking) * 100)}% of total days` : "—",
          },
          {
            label: "Late / Early Leave",
            value: String(totalLate + totalEarlyLeave),
            icon: Clock,
            color: "#d97706",
            bg:    "#fffbeb",
            sub:   `${totalLate} late · ${totalEarlyLeave} early leave`,
          },
          {
            label: "Current Streak",
            value: `${currentStreak}d`,
            icon: CalendarDays,
            color: "#2563eb",
            bg:    "#eff6ff",
            sub:   `Best: ${longestStreak} days`,
          },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400" style={{ fontSize: "11.5px", fontWeight: 500 }}>{label}</p>
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon size={14} style={{ color }} strokeWidth={2} />
              </div>
            </div>
            <p style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.03em", color, lineHeight: 1 }}>
              {value}
            </p>
            <p className="text-gray-400 mt-1.5" style={{ fontSize: "10.5px" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Month Trend Bar Chart ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>
            Monthly Trend
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#0d9488" }} />
            <span className="text-gray-400" style={{ fontSize: "12px" }}>Attendance %</span>
          </div>
        </div>

        <div className="flex items-end gap-6 h-28">
          {monthTrend.map((m, i) => {
            const pct       = m.attendance_pct ?? 0;
            const isLast    = m.is_current_month;
            const barColor  = pct >= 90 ? "#0d9488" : pct >= 75 ? "#f59e0b" : "#ef4444";
            const barHeight = Math.max(8, Math.round((pct / 100) * 96));
            const prev      = i > 0 ? (monthTrend[i - 1].attendance_pct ?? 0) : null;
            const delta     = prev !== null ? pct - prev : null;

            return (
              <div key={`${m.year}-${m.month}`} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: "12px", fontWeight: 700, color: barColor }}>
                    {pct}%
                  </span>
                  {delta !== null && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: delta >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {delta >= 0 ? "↑" : "↓"}{Math.abs(delta)}
                    </span>
                  )}
                </div>
                <div
                  className="w-full rounded-t-xl transition-all"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: isLast ? barColor : `${barColor}55`,
                  }}
                />
                <span className="text-gray-500" style={{ fontSize: "12.5px", fontWeight: 500 }}>
                  {m.month_label.slice(0, 3)}
                  {m.is_current_month && (
                    <span style={{ fontSize: "9px", color: "#0d9488", display: "block", textAlign: "center" }}>
                      ongoing
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Threshold line label */}
        <div className="mt-4 flex items-center gap-2 px-1">
          <div className="flex-1 h-px border-t border-dashed" style={{ borderColor: "#fca5a5" }} />
          <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 500 }}>
            {REQUIRED_PCT}% minimum required
          </span>
          <div className="flex-1 h-px border-t border-dashed" style={{ borderColor: "#fca5a5" }} />
        </div>
      </div>

      {/* ── Calendar + Log Tabs ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Tab bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#f3f4f6" }}>
            {(["calendar", "log"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-md capitalize transition-all"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: activeTab === tab ? "white" : "transparent",
                  color: activeTab === tab ? "#111827" : "#9ca3af",
                  boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {tab === "calendar" ? "Calendar View" : "Attendance Log"}
              </button>
            ))}
          </div>

          {/* Legend (calendar tab only) */}
          {activeTab === "calendar" && (
            <div className="flex items-center gap-3">
{(["present", "late", "early_leave", "absent"] as DayStatus[]).map((s) => {                const cfg = STATUS_CONFIG[s];
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: cfg.bg, border: `1.5px solid ${cfg.color}` }} />
                    <span className="text-gray-500" style={{ fontSize: "11px" }}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calendar View */}
        {activeTab === "calendar" && (
          <div className="p-6">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={16} strokeWidth={2.2} />
              </button>
              <h3 className="text-gray-900" style={{ fontSize: "16px", fontWeight: 700 }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h3>
              <button
                onClick={nextMonth}
                disabled={!canGoNext}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} strokeWidth={2.2} />
              </button>
            </div>

            <MonthCalendar
              year={viewYear}
              month={viewMonth}
              recordMap={recordMap}
              monthSummary={currentMonthSummary}
            />
          </div>
        )}

        {/* Attendance Log */}
        {activeTab === "log" && (
          <div>
            {logEntries.length === 0 ? (
              <div className="py-16 text-center">
                <BookOpen size={32} className="text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-gray-400" style={{ fontSize: "14px" }}>No records yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    {["Date", "Status", "By", "At"].map((col) => (
                      <th
                        key={col}
                        className="text-left px-6 py-3 text-gray-400"
                        style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}
                      >
                        {col.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logEntries.map((entry) => {
                    const cfg = STATUS_CONFIG[entry.status];
                    const { y, m, d } = parseIso(entry.date);
                    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                    const display = `${months[m]} ${d}, ${y}`;
                    const todayIso = new Date().toISOString().split("T")[0];
                    const isToday = entry.date === todayIso;

                    // Use updated_at+updatedBy if record was edited, else created_at+createdBy
                    const displayName = entry.wasEdited
                      ? (entry.updatedByName ?? entry.createdByName ?? "—")
                      : (entry.createdByName ?? "—");
                    const displayTime = entry.wasEdited
                      ? (entry.updatedAt
                          ? new Date(entry.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                          : "—")
                      : (entry.createdAt
                          ? new Date(entry.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                          : "—");

                    return (
                      <tr
                        key={entry.date}
                        className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-gray-700"
                              style={{ fontSize: "13px", fontWeight: isToday ? 700 : 500 }}
                            >
                              {display}
                            </span>
                            {isToday && (
                              <span
                                className="px-1.5 py-0.5 rounded"
                                style={{ fontSize: "10px", fontWeight: 700, backgroundColor: "#f0fdfa", color: "#0d9488" }}
                              >
                                Today
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className="px-2.5 py-0.5 rounded-full"
                            style={{
                              fontSize: "11.5px",
                              fontWeight: 600,
                              color: cfg.color,
                              backgroundColor: cfg.bg,
                            }}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500" style={{ fontSize: "13px" }}>
                              {displayName}
                            </span>
                            {entry.wasEdited && (
                              <span
                                className="px-1 py-0.5 rounded"
                                style={{ fontSize: "9px", fontWeight: 700, backgroundColor: "#eff6ff", color: "#2563eb" }}
                              >
                                edited
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-gray-500" style={{ fontSize: "13px" }}>
                            {displayTime}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

    </div>
  );
}