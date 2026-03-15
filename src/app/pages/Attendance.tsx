// src/app/pages/Attendance.tsx

import { useState, useRef, useEffect, useCallback } from "react";
import {
  fetchAttendanceBatchSummaryApi,
  fetchAttendanceBatchDetailApi,
  markBatchAttendanceApi,
  updateBatchAttendanceApi,
  type BatchSummaryItem,
  type StudentDetailItem,
} from "../../Lib/api/attendance";
import {
  CheckSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ArrowLeft,
  CalendarDays,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Users2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

// Local UI types (derived from API data)
type StudentAttendanceEntry = {
  studentId: string;   // UUID from DB
  fullName: string;
  attendanceId: string | null; // null = not yet marked
  present: boolean;
  lateArrival: boolean;
  earlyLeave: boolean;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

function getTodayIso(): string {
  return new Date().toISOString().split("T")[0];
}
function getYesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}
const TODAY = getTodayIso();
const YESTERDAY = getYesterdayIso();

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

function isoToLabel(iso: string): string {
  if (iso === TODAY) return "Today";
  if (iso === YESTERDAY) return "Yesterday";
  return formatDisplayDate(iso);
}


// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({
  value,
  onChange,
  color = "#0d9488",
  size = "md",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
  size?: "sm" | "md";
}) {
  const isSmall = size === "sm";
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative inline-flex items-center rounded-full transition-all duration-200 flex-shrink-0"
      style={{
        width: isSmall ? "32px" : "44px",
        height: isSmall ? "18px" : "24px",
        backgroundColor: value ? color : "#e5e7eb",
      }}
    >
      <span
        className="inline-block rounded-full bg-white shadow transition-transform duration-200"
        style={{
          width: isSmall ? "12px" : "18px",
          height: isSmall ? "12px" : "18px",
          transform: value
            ? `translateX(${isSmall ? "16px" : "22px"})`
            : "translateX(2px)",
        }}
      />
    </button>
  );
}

// ─── Calendar Picker ───────────────────────────────────────────────────────────

function CalendarPicker({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (d: string) => void;
  onClose: () => void;
}) {
  const [yr, setYr] = useState(() => parseInt(value.split("-")[0]));
  const [mo, setMo] = useState(() => parseInt(value.split("-")[1]) - 1);
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function pad(n: number) { return String(n).padStart(2, "0"); }

  function prevMonth() {
    if (mo === 0) { setMo(11); setYr(y => y - 1); }
    else setMo(m => m - 1);
  }
  function nextMonth() {
    if (mo === 11) { setMo(0); setYr(y => y + 1); }
    else setMo(m => m + 1);
  }

  return (
    <div
      className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50"
      style={{ width: "280px" }}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
          <ChevronLeft size={14} />
        </button>
        <p className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 700 }}>
          {MONTHS[mo]} {yr}
        </p>
        <button onClick={nextMonth} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-gray-400 py-1" style={{ fontSize: "11px", fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const iso = `${yr}-${pad(mo + 1)}-${pad(day)}`;
          const isSelected = iso === value;
          const isToday = iso === TODAY;
          return (
            <button
              key={iso}
              onClick={() => { onChange(iso); onClose(); }}
              className="w-8 h-8 rounded-md mx-auto flex items-center justify-center transition-all"
              style={{
                fontSize: "12.5px",
                fontWeight: isSelected ? 700 : 500,
                backgroundColor: isSelected ? "#0d9488" : isToday ? "#f0fdfa" : "transparent",
                color: isSelected ? "white" : isToday ? "#0d9488" : "#374151",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mark / Modify Attendance Page ────────────────────────────────────────────

function MarkAttendancePage({
  batchId,
  batchName,
  date,
  onBack,
  onSave,
}: {
  batchId: string;
  batchName: string;
  date: string;
  onBack: () => void;
  onSave: () => void;
}) {
  const [entries, setEntries] = useState<StudentAttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const isModify = entries.some(e => e.attendanceId !== null);

  useEffect(() => {
    setLoading(true);
    fetchAttendanceBatchDetailApi(batchId, date)
      .then((rows) => {
        setEntries(rows.map(r => ({
          studentId: r.student_id,
          fullName: r.full_name,
          attendanceId: r.attendance_id,
          present: r.status === "present" || r.status === null, // default present for new
          lateArrival: r.late,
          earlyLeave: r.early_leave,
        })));
      })
      .catch((err) => setApiError(err.message))
      .finally(() => setLoading(false));
  }, [batchId, date]);

  function setEntry(id: string, patch: Partial<StudentAttendanceEntry>) {
    setEntries(prev => prev.map(e => e.studentId === id ? { ...e, ...patch } : e));
  }

  const presentCount = entries.filter(e => e.present).length;
  const absentCount = entries.filter(e => !e.present).length;
  const lateCount = entries.filter(e => e.lateArrival).length;
  const earlyCount = entries.filter(e => e.earlyLeave).length;

  function handleMarkAll(present: boolean) {
    setEntries(prev => prev.map(e => ({
      ...e, present,
      lateArrival: present ? e.lateArrival : false,
      earlyLeave: present ? e.earlyLeave : false,
    })));
  }

  async function handleSave() {
    setSaving(true);
    setApiError(null);
    try {
      if (isModify) {
        // Update existing records
        await updateBatchAttendanceApi(
          entries
            .filter(e => e.attendanceId !== null)
            .map(e => ({
              attendanceId: e.attendanceId!,
              present: e.present,
              late: e.lateArrival,
              earlyLeave: e.earlyLeave,
            }))
        );
      } else {
        // Create new records
        await markBatchAttendanceApi(
          batchId,
          date,
          entries.map(e => ({
            studentId: e.studentId,
            present: e.present,
            late: e.lateArrival,
            earlyLeave: e.earlyLeave,
          }))
        );
      }
      setSaved(true);
      setTimeout(() => onSave(), 1000);
    } catch (err: any) {
      setApiError(err.message ?? "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-[860px] mx-auto flex items-center justify-center" style={{ minHeight: "50vh" }}>
        <p className="text-gray-400" style={{ fontSize: "14px" }}>Loading students…</p>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="p-8 max-w-[600px] mx-auto flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#f0fdfa" }}>
          <CheckCircle2 size={32} color="#0d9488" strokeWidth={2} />
        </div>
        <h2 className="text-gray-900 mb-2" style={{ fontSize: "20px", fontWeight: 700 }}>
          Attendance {isModify ? "Updated" : "Marked"}!
        </h2>
        <p className="text-gray-400 text-center" style={{ fontSize: "14px" }}>
          {batchName} · {formatDisplayDate(date)}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[860px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {isModify ? "Modify Attendance" : "Mark Attendance"}
          </h1>
          <p className="text-gray-400 mt-0.5" style={{ fontSize: "13.5px" }}>
            {batchName} · {formatDisplayDate(date)}
          </p>
        </div>
      </div>

      {/* Live summary bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Present",      value: presentCount, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Absent",       value: absentCount,  color: "#ef4444", bg: "#fef2f2" },
          { label: "Late Arrival", value: lateCount,    color: "#d97706", bg: "#fffbeb" },
          { label: "Early Leave",  value: earlyCount,   color: "#7c3aed", bg: "#f5f3ff" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p style={{ fontSize: "11.5px", fontWeight: 500, color: "#9ca3af" }}>{label}</p>
            <p style={{ fontSize: "26px", fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: "4px" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 mb-4">
        <p className="text-gray-400 mr-2" style={{ fontSize: "12.5px" }}>Quick mark:</p>
        <button
          onClick={() => handleMarkAll(true)}
          className="px-3.5 py-1.5 rounded-md text-green-700 hover:bg-green-50 border border-green-100 transition-colors"
          style={{ fontSize: "12.5px", fontWeight: 600 }}
        >
          All Present
        </button>
        <button
          onClick={() => handleMarkAll(false)}
          className="px-3.5 py-1.5 rounded-md text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
          style={{ fontSize: "12.5px", fontWeight: 600 }}
        >
          All Absent
        </button>
      </div>

      {/* Student list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Column headers */}
        <div
          className="grid px-6 py-3 border-b border-gray-100"
          style={{ gridTemplateColumns: "1fr 120px 130px 130px", backgroundColor: "#f9fafb" }}
        >
          <p className="text-gray-400" style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.05em" }}>STUDENT</p>
          <p className="text-gray-400 text-center" style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.05em" }}>PRESENT</p>
          <p className="text-gray-400 text-center" style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.05em" }}>LATE ARRIVAL</p>
          <p className="text-gray-400 text-center" style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.05em" }}>EARLY LEAVE</p>
        </div>

        <div className="divide-y divide-gray-50">
          {entries.map((entry) => {
            const initials = entry.fullName.split(" ").map(n => n[0]).join("").slice(0, 2);
            return (
              <div
                key={entry.studentId}
                className="grid px-6 py-4 items-center transition-colors"
                style={{
                  gridTemplateColumns: "1fr 120px 130px 130px",
                  backgroundColor: !entry.present ? "#fef9f9" : "white",
                }}
              >
                {/* Student */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ backgroundColor: entry.present ? "#f0fdfa" : "#fef2f2" }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, color: entry.present ? "#0d9488" : "#ef4444" }}>
                      {initials}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 600 }}>{entry.fullName}</p>
                    <p className="text-gray-400" style={{ fontSize: "11.5px", fontFamily: "monospace" }}>{entry.studentId.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Present toggle */}
                <div className="flex justify-center">
                  <Toggle
                    value={entry.present}
                    onChange={(v) => setEntry(entry.studentId, {
                      present: v,
                      lateArrival: v ? entry.lateArrival : false,
                      earlyLeave: v ? entry.earlyLeave : false,
                    })}
                    color="#16a34a"
                  />
                </div>

                {/* Late Arrival */}
                <div className="flex flex-col items-center gap-1">
                  <Toggle
                    value={entry.lateArrival}
                    onChange={(v) => setEntry(entry.studentId, { lateArrival: v, present: v ? true : entry.present })}
                    color="#d97706"
                    size="sm"
                  />
                  {entry.lateArrival && (
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#d97706" }}>Marked</span>
                  )}
                </div>

                {/* Early Leave */}
                <div className="flex flex-col items-center gap-1">
                  <Toggle
                    value={entry.earlyLeave}
                    onChange={(v) => setEntry(entry.studentId, { earlyLeave: v, present: v ? true : entry.present })}
                    color="#7c3aed"
                    size="sm"
                  />
                  {entry.earlyLeave && (
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#7c3aed" }}>Marked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save */}
      {apiError && (
        <p className="text-red-500 mb-4" style={{ fontSize: "13px" }}>{apiError}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-7 py-3 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-60"
          style={{ backgroundColor: "#0d9488", fontSize: "14px", fontWeight: 700 }}
        >
          {saving ? "Saving…" : isModify ? "Save Changes" : "Mark Attendance"}
        </button>
        <button
          onClick={onBack}
          className="px-7 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
          style={{ fontSize: "14px", fontWeight: 500 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Batch Attendance Summary Page ────────────────────────────────────────────

function BatchSummaryPage({
  batchId,
  batchName,
  date,
  summary,
  onBack,
  onModify,
  onDelete,
  onMarkAttendance,
  canManage,
}: {
  batchId: string;
  batchName: string;
  date: string;
  summary: BatchSummaryItem | null; // null = pending
  onBack: () => void;
  onModify: () => void;
  onDelete: () => void;
  onMarkAttendance: () => void;
  canManage: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [detailRows, setDetailRows] = useState<StudentDetailItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const isPending = !summary?.is_marked;
  const presentCount = summary?.present_count ?? 0;
  const absentCount = summary?.absent_count ?? 0;
  const lateCount = summary?.late_count ?? 0;
  const earlyCount = summary?.early_leave_count ?? 0;
  const totalStudents = summary?.total_students ?? 0;
  const pct = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  useEffect(() => {
    if (!isPending) {
      setLoadingDetail(true);
      fetchAttendanceBatchDetailApi(batchId, date)
        .then(setDetailRows)
        .finally(() => setLoadingDetail(false));
    }
  }, [batchId, date, isPending]);

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors"
        style={{ fontSize: "13.5px", fontWeight: 500 }}
      >
        <ArrowLeft size={15} />
        Back to Attendance
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#f0fdfa" }}>
              <ClipboardList size={22} color="#0d9488" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-gray-900" style={{ fontSize: "21px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {batchName}
                </h1>
                <span
                  className="px-2.5 py-0.5 rounded-full"
                  style={{
                    fontSize: "11.5px", fontWeight: 600,
                    color: isPending ? "#d97706" : "#16a34a",
                    backgroundColor: isPending ? "#fffbeb" : "#f0fdf4",
                  }}
                >
                  {isPending ? "Pending" : "Completed"}
                </span>
              </div>
              <p className="text-gray-400" style={{ fontSize: "13.5px" }}>
                {formatDisplayDate(date)}
                {!isPending && summary?.marked_by_name && (
                  <> · Marked by <strong className="text-gray-600">{summary.marked_by_name}</strong></>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          {!isPending ? (
            canManage ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onModify}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  <Pencil size={13} strokeWidth={2} />
                  Modify Attendance
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition-all"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  <Trash2 size={13} strokeWidth={2} />
                  Delete Record
                </button>
              </div>
            ) : null
          ) : (
            canManage ? (
              <button
                onClick={onMarkAttendance}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
                style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
              >
                <CheckSquare size={15} strokeWidth={2} />
                Mark Attendance
              </button>
            ) : null
          )}

        </div>

        {/* Stats row — only when completed */}
        {!isPending && (
          <div className="grid grid-cols-5 gap-4 mt-7 pt-6 border-t border-gray-50">
            {[
              { label: "Total Students", value: totalStudents, color: "#374151" },
              { label: "Present",        value: presentCount,    color: "#16a34a" },
              { label: "Absent",         value: absentCount,     color: "#ef4444" },
              { label: "Late Arrival",   value: lateCount,       color: "#d97706" },
              { label: "Early Leave",    value: earlyCount,      color: "#7c3aed" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                  {label}
                </p>
                <p style={{ fontSize: "26px", fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {!isPending && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-gray-400" style={{ fontSize: "12px", fontWeight: 500 }}>Attendance rate</p>
              <p style={{ fontSize: "13px", fontWeight: 700, color: pct >= 90 ? "#0d9488" : pct >= 75 ? "#f59e0b" : "#ef4444" }}>
                {pct}%
              </p>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct >= 90 ? "#0d9488" : pct >= 75 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Student table */}
      {isPending ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#fffbeb" }}>
            <AlertCircle size={24} color="#d97706" strokeWidth={2} />
          </div>
          <p className="text-gray-700 mb-1" style={{ fontSize: "16px", fontWeight: 700 }}>Attendance Not Marked Yet</p>
          <p className="text-gray-400 mb-6 text-center" style={{ fontSize: "13.5px" }}>
            No attendance record exists for {batchName} on {formatDisplayDate(date)}.
          </p>
          <button
            onClick={onMarkAttendance}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            <CheckSquare size={15} strokeWidth={2} />
            Mark Attendance Now
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: "#f9fafb" }}>
            <p className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 700 }}>
              Student Attendance Details
            </p>
            <p className="text-gray-400" style={{ fontSize: "12.5px" }}>
              {totalStudents} students
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {["Student", "Roll No", "Status", "Late Arrival", "Early Leave"].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-gray-400" style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.05em" }}>
                    {col.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingDetail ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400" style={{ fontSize: "13.5px" }}>Loading…</td></tr>
              ) : detailRows.map(row => {
                const initials = row.full_name.split(" ").map(n => n[0]).join("").slice(0, 2);
                const isPresent = row.status === "present";
                return (
                  <tr
                    key={row.student_id}
                    className="border-t border-gray-50"
                    style={{ backgroundColor: !isPresent ? "#fefcfc" : "white" }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: isPresent ? "#f0fdfa" : "#fef2f2" }}
                        >
                          <span style={{ fontSize: "11.5px", fontWeight: 700, color: isPresent ? "#0d9488" : "#ef4444" }}>
                            {initials}
                          </span>
                        </div>
                        <p className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 600 }}>{row.full_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-gray-500" style={{ fontSize: "12.5px", fontFamily: "monospace" }}>{row.student_id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-0.5 rounded-full"
                        style={{
                          fontSize: "12px", fontWeight: 700,
                          color: isPresent ? "#16a34a" : "#ef4444",
                          backgroundColor: isPresent ? "#f0fdf4" : "#fef2f2",
                        }}
                      >
                        {isPresent ? "Present" : "Absent"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {row.late ? (
                        <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: "#d97706", backgroundColor: "#fffbeb" }}>
                          Late
                        </span>
                      ) : (
                        <span className="text-gray-300" style={{ fontSize: "12px" }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {row.early_leave ? (
                        <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: "#7c3aed", backgroundColor: "#f5f3ff" }}>
                          Early Leave
                        </span>
                      ) : (
                        <span className="text-gray-300" style={{ fontSize: "12px" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                <h3 className="text-gray-900 mb-1" style={{ fontSize: "16px", fontWeight: 700 }}>Delete Attendance Record?</h3>
                <p className="text-gray-400" style={{ fontSize: "13.5px", lineHeight: 1.6 }}>
                  This will permanently remove the attendance record for{" "}
                  <strong className="text-gray-700">{batchName}</strong> on {formatDisplayDate(date)}. This cannot be undone.
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

// ─── Main Attendance Page ──────────────────────────────────────────────────────

type ViewState =
  | { type: "list" }
  | { type: "summary"; batch: string }
  | { type: "mark"; batch: string }
  | { type: "modify"; batch: string };

export function Attendance({ canManage = true }: { canManage?: boolean }) {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [showCalendar, setShowCalendar] = useState(false);
  const [view, setView] = useState<ViewState>({ type: "list" });
  const calendarRef = useRef<HTMLDivElement>(null);

  // Live batch summary state
  const [batchSummaries, setBatchSummaries] = useState<BatchSummaryItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadSummary = useCallback((date: string) => {
    setLoadingSummary(true);
    setSummaryError(null);
    fetchAttendanceBatchSummaryApi(date)
      .then(setBatchSummaries)
      .catch((err) => setSummaryError(err.message))
      .finally(() => setLoadingSummary(false));
  }, []);

  useEffect(() => {
    loadSummary(selectedDate);
  }, [selectedDate, loadSummary]);

  // Close calendar on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function getSummary(batchId: string): BatchSummaryItem | undefined {
    return batchSummaries.find(s => s.batch_id === batchId);
  }

  function handleAfterSave(batchId: string) {
    // Refresh the summary then go to summary view
    loadSummary(selectedDate);
    setView({ type: "summary", batch: batchId });
  }

  function handleDeleteRecord(_batchId: string) {
    // Re-fetch summary after deletion
    loadSummary(selectedDate);
    setView({ type: "list" });
  }

  // ── Sub-views ──

  if (view.type === "mark" || view.type === "modify") {
    const summary = getSummary(view.batch);
    return (
      <MarkAttendancePage
        batchId={view.batch}
        batchName={summary?.batch_name ?? view.batch}
        date={selectedDate}
        onBack={() => setView({ type: "summary", batch: view.batch })}
        onSave={() => handleAfterSave(view.batch)}
      />
    );
  }

  if (view.type === "summary") {
    const summary = getSummary(view.batch);
    return (
      <BatchSummaryPage
        batchId={view.batch}
        batchName={summary?.batch_name ?? view.batch}
        date={selectedDate}
        summary={summary ?? null}
        onBack={() => setView({ type: "list" })}
        onModify={() => setView({ type: "modify", batch: view.batch })}
        onDelete={() => handleDeleteRecord(view.batch)}
        onMarkAttendance={() => setView({ type: "mark", batch: view.batch })}
        canManage={canManage}
      />
    );
  }

  // ── List view ──

  const completedBatches = batchSummaries.filter(s => s.is_marked);
  const pendingBatches   = batchSummaries.filter(s => !s.is_marked);

  const totalStudents = batchSummaries.reduce((a, s) => a + s.total_students, 0);
  const totalPresent  = batchSummaries.reduce((a, s) => a + s.present_count, 0);
  const totalAbsent   = batchSummaries.reduce((a, s) => a + s.absent_count, 0);
  const totalLate     = batchSummaries.reduce((a, s) => a + s.late_count, 0);
  const overallPct    = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

  const weeklyTrend = [
    { day: "Mon", pct: 88 },
    { day: "Tue", pct: 91 },
    { day: "Wed", pct: 89 },
    { day: "Thu", pct: 94 },
    { day: "Fri", pct: 91 },
  ];

  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Attendance
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {isoToLabel(selectedDate)}'s attendance overview — {formatDisplayDate(selectedDate)}
          </p>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-2">
          {[TODAY, YESTERDAY].map(d => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className="px-4 py-2.5 rounded-xl border shadow-sm transition-all"
              style={{
                fontSize: "13px", fontWeight: 500,
                backgroundColor: selectedDate === d ? "#0d9488" : "white",
                color: selectedDate === d ? "white" : "#6b7280",
                borderColor: selectedDate === d ? "#0d9488" : "#f3f4f6",
              }}
            >
              {d === TODAY ? "Today" : "Yesterday"}
            </button>
          ))}
          <div ref={calendarRef} className="relative">
            <button
              onClick={() => setShowCalendar(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm transition-all"
              style={{
                fontSize: "13px", fontWeight: 500,
                backgroundColor: selectedDate !== TODAY && selectedDate !== YESTERDAY ? "#0d9488" : "white",
                color: selectedDate !== TODAY && selectedDate !== YESTERDAY ? "white" : "#6b7280",
                borderColor: selectedDate !== TODAY && selectedDate !== YESTERDAY ? "#0d9488" : "#f3f4f6",
              }}
            >
              <CalendarDays size={14} />
              {selectedDate !== TODAY && selectedDate !== YESTERDAY ? formatDisplayDate(selectedDate) : "Choose Date"}
              <ChevronDown size={13} style={{ transform: showCalendar ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            {showCalendar && (
              <CalendarPicker
                value={selectedDate}
                onChange={(d) => { setSelectedDate(d); }}
                onClose={() => setShowCalendar(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Pending alert */}
      {summaryError && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-6 border" style={{ backgroundColor: "#fef2f2", borderColor: "#fca5a5" }}>
          <AlertCircle size={18} color="#ef4444" className="flex-shrink-0 mt-0.5" />
          <p className="text-red-700" style={{ fontSize: "13.5px" }}>{summaryError}</p>
        </div>
      )}

      {!loadingSummary && pendingBatches.length > 0 && (
        <div
          className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-6 border"
          style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
        >
          <AlertCircle size={18} color="#d97706" className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 mb-1" style={{ fontSize: "13.5px", fontWeight: 700 }}>
              Attendance pending for {pendingBatches.length} {pendingBatches.length === 1 ? "batch" : "batches"}
            </p>
            <p className="text-amber-700" style={{ fontSize: "12.5px" }}>
              {pendingBatches.map(b => b.batch_name).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { label: "Overall Attendance", value: loadingSummary ? "—" : `${overallPct}%`, icon: TrendingUp, color: "#0d9488", bg: "#f0fdfa", sub: `${completedBatches.length}/${batchSummaries.length} batches marked` },
          { label: "Total Present",      value: String(totalPresent),       icon: UserCheck,    color: "#16a34a", bg: "#f0fdf4", sub: `of ${totalStudents} students` },
          { label: "Total Absent",       value: String(totalAbsent),        icon: UserX,        color: "#ef4444", bg: "#fef2f2", sub: "across all batches" },
          { label: "Late Arrivals",      value: String(totalLate),          icon: Clock,        color: "#d97706", bg: "#fffbeb", sub: "across all batches" },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400" style={{ fontSize: "12px", fontWeight: 500 }}>{label}</p>
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon size={16} style={{ color }} strokeWidth={2} />
              </div>
            </div>
            <p className="text-gray-900" style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {value}
            </p>
            <p className="text-gray-400 mt-2" style={{ fontSize: "11px" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Weekly Trend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-gray-800 mb-5" style={{ fontSize: "15px", fontWeight: 700 }}>Weekly Trend</h2>
        <div className="flex items-end gap-3 h-24">
          {weeklyTrend.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-gray-500" style={{ fontSize: "11px", fontWeight: 500 }}>{d.pct}%</span>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{ height: `${(d.pct / 100) * 72}px`, backgroundColor: d.day === "Fri" ? "#0d9488" : "#ccfbf1" }}
              />
              <span className="text-gray-400" style={{ fontSize: "11.5px" }}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Batch Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Batch-wise Attendance</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              {["Batch", "Teacher", "Present", "Absent", "Late", "Rate", "Status", "Action"].map(col => (
                <th key={col} className="text-left px-5 py-3 text-gray-400" style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.04em" }}>
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingSummary ? (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400" style={{ fontSize: "13.5px" }}>Loading batches…</td></tr>
            ) : batchSummaries.map(batch => {
              const present = batch.present_count;
              const absent  = batch.absent_count;
              const late    = batch.late_count;
              const pct     = batch.total_students > 0 ? Math.round((present / batch.total_students) * 100) : 0;
              const isDone  = batch.is_marked;

              return (
                <tr
                  key={batch.batch_id}
                  onClick={() => setView({ type: "summary", batch: batch.batch_id })}
                  className="border-t border-gray-50 hover:bg-teal-50 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4">
                    <p className="text-gray-800 group-hover:text-teal-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                      {batch.batch_name}
                    </p>
                    <p className="text-gray-400" style={{ fontSize: "11.5px" }}>
                      {batch.total_students} students
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-gray-400" style={{ fontSize: "12.5px" }}>{batch.teacher_name ?? "—"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-green-600" style={{ fontSize: "13.5px", fontWeight: 700 }}>
                      {isDone ? present : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-red-500" style={{ fontSize: "13.5px", fontWeight: 700 }}>
                      {isDone ? absent : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-amber-500" style={{ fontSize: "13.5px", fontWeight: 700 }}>
                      {isDone ? late : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {isDone ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? "#0d9488" : pct >= 75 ? "#f59e0b" : "#ef4444" }}
                          />
                        </div>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: pct >= 90 ? "#0d9488" : pct >= 75 ? "#f59e0b" : "#ef4444" }}>
                          {pct}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-300" style={{ fontSize: "12.5px" }}>—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {isDone ? (
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: "#16a34a", backgroundColor: "#f0fdf4" }}>
                          Completed
                        </span>
                        <p className="text-gray-400 mt-0.5" style={{ fontSize: "11px" }}>
                          {batch.marked_by_name ? `by ${batch.marked_by_name}` : ""}
                        </p>
                      </div>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: "#d97706", backgroundColor: "#fffbeb" }}>
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                    {!isDone ? (
                      canManage ? (
                        <button
                          onClick={() => setView({ type: "mark", batch: batch.batch_id })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white hover:opacity-90 transition-all"
                          style={{ backgroundColor: "#0d9488", fontSize: "12px", fontWeight: 600 }}
                        >
                          <CheckSquare size={12} strokeWidth={2.5} />
                          Mark
                        </button>
                      ) : (
                        <span className="text-gray-300" style={{ fontSize: "12px" }}>—</span>
                      )
                    ) : (
                      <button
                        onClick={() => setView({ type: "summary", batch: batch.batch_id })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                        style={{ fontSize: "12px", fontWeight: 600 }}
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}