// src/app/pages/student/StudentDashboard.tsx


import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Star,
  CheckSquare,
  ArrowRight,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Sun,
  Umbrella,
  ChevronRight,
} from "lucide-react";
import {
  fetchStudentDashboard,
  type StudentDashboardData,
  type TodayAttendanceStatus,
} from "../../../Lib/api/student-dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = TodayAttendanceStatus;


// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGradeColor(pct: number): { color: string; bg: string } {
  if (pct >= 90) return { color: "#0d9488", bg: "#f0fdfa" };
  if (pct >= 75) return { color: "#2563eb", bg: "#eff6ff" };
  return { color: "#d97706", bg: "#fffbeb" };
}

function getGradeLabel(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  return "C";
}

function getSubjectStyle(subject: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    Physics:     { color: "#2563eb", bg: "#eff6ff" },
    Mathematics: { color: "#0d9488", bg: "#f0fdfa" },
    Chemistry:   { color: "#16a34a", bg: "#f0fdf4" },
    English:     { color: "#d97706", bg: "#fffbeb" },
    Biology:     { color: "#7c3aed", bg: "#f5f3ff" },
  };
  return map[subject] ?? { color: "#6b7280", bg: "#f3f4f6" };
}

function getAnnouncementStyle(type: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    Academic: { color: "#2563eb", bg: "#eff6ff" },
    Holiday:  { color: "#d97706", bg: "#fffbeb" },
    Event:    { color: "#7c3aed", bg: "#f5f3ff" },
    General:  { color: "#6b7280", bg: "#f3f4f6" },
  };
  return map[type] ?? { color: "#6b7280", bg: "#f3f4f6" };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTodayLabel(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TodayAttendanceBanner({ status }: { status: AttendanceStatus }) {
  if (status === null) return null;

  const config = {
    present: {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      iconBg: "#dcfce7",
      iconColor: "#16a34a",
      icon: CheckCircle2,
      label: "You're marked Present today",
      sub: "Great — your attendance has been recorded for today's session.",
      badgeText: "Present",
      badgeColor: "#16a34a",
      badgeBg: "#dcfce7",
    },
    absent: {
      bg: "#fef2f2",
      border: "#fecaca",
      iconBg: "#fee2e2",
      iconColor: "#dc2626",
      icon: XCircle,
      label: "You were marked Absent today",
      sub: "Contact your batch coordinator if this is incorrect.",
      badgeText: "Absent",
      badgeColor: "#dc2626",
      badgeBg: "#fee2e2",
    },
    late: {
      bg: "#fffbeb",
      border: "#fde68a",
      iconBg: "#fef3c7",
      iconColor: "#d97706",
      icon: Clock,
      label: "You were marked Late today",
      sub: "Your attendance is recorded, but you arrived after the session started.",
      badgeText: "Late",
      badgeColor: "#d97706",
      badgeBg: "#fef3c7",
    },
    holiday: {
      bg: "#faf5ff",
      border: "#e9d5ff",
      iconBg: "#f3e8ff",
      iconColor: "#7c3aed",
      icon: Umbrella,
      label: `Holiday today`,
      sub: "The institute is closed today. Enjoy your day off!",
      badgeText: "Holiday",
      badgeColor: "#7c3aed",
      badgeBg: "#f3e8ff",
    },
    sunday: {
      bg: "#f9fafb",
      border: "#e5e7eb",
      iconBg: "#f3f4f6",
      iconColor: "#9ca3af",
      icon: Sun,
      label: "It's Sunday — no classes today",
      sub: "Rest up and get ready for the week ahead.",
      badgeText: "Sunday",
      badgeColor: "#6b7280",
      badgeBg: "#f3f4f6",
    },
  } as const;

  const c = config[status];
  const Icon = c.icon;

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-6"
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: c.iconBg }}
      >
        <Icon size={20} style={{ color: c.iconColor }} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: "14px", fontWeight: 650, color: "#111827", lineHeight: 1.3 }}>
          {c.label}
        </p>
        <p className="text-gray-400 mt-0.5" style={{ fontSize: "12.5px" }}>
          {c.sub}
        </p>
      </div>
      <span
        className="flex-shrink-0 px-3 py-1 rounded-full"
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: c.badgeColor,
          backgroundColor: c.badgeBg,
        }}
      >
        {c.badgeText}
      </span>
    </div>
  );
}


// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  viewAllPath,
}: {
  title: string;
  viewAllPath: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-4">
      <h2
        style={{
          fontSize: "15.5px",
          fontWeight: 650,
          letterSpacing: "-0.01em",
          color: "#111827",
        }}
      >
        {title}
      </h2>
      <button
        onClick={() => navigate(viewAllPath)}
        className="flex items-center gap-1 text-teal-600 hover:text-teal-700 transition-colors"
        style={{ fontSize: "13px", fontWeight: 500 }}
      >
        View All
        <ArrowRight size={14} />
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStudentDashboard()
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message ?? "Failed to load dashboard"); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="p-8" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-100 rounded-xl w-48" />
          <div className="h-4 bg-gray-100 rounded w-64" />
          <div className="h-16 bg-gray-100 rounded-2xl" />
          <div className="grid grid-cols-2 gap-5">
            <div className="h-36 bg-gray-100 rounded-2xl" />
            <div className="h-36 bg-gray-100 rounded-2xl" />
          </div>
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <div className="p-8" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl"
          style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <XCircle size={18} style={{ color: "#dc2626" }} />
          <p style={{ fontSize: "14px", color: "#dc2626" }}>
            {error ?? "Unable to load dashboard. Please refresh."}
          </p>
        </div>
      </div>
    );
  }

  const { profile, today_attendance, attendance_stats, recent_marks, recent_announcements } = data;

  // Derived values for the performance card
  const avgPct =
    recent_marks.length > 0
      ? Math.round(recent_marks.reduce((acc, m) => acc + m.percentage, 0) / recent_marks.length)
      : null;
  const aGradeCount = recent_marks.filter((m) => m.percentage >= 80).length;

  return (
    <div className="p-8" style={{ maxWidth: "1200px", margin: "0 auto" }}>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-gray-900"
            style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            My Dashboard
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            Welcome back, {profile.full_name ?? profile.login_identifier} · {formatTodayLabel()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {profile.batch_name && (
              <span
                className="px-2.5 py-0.5 rounded-full"
                style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "#f0fdfa", color: "#0d9488" }}
              >
                {profile.batch_name}
              </span>
            )}
            <span className="text-gray-300" style={{ fontSize: "12px" }}>·</span>
            <span className="text-gray-400" style={{ fontSize: "12px", fontFamily: "monospace" }}>
              {profile.login_identifier}
            </span>
          </div>
        </div>
      </div>

      {/* ── Today's Attendance Banner ── */}
      <TodayAttendanceBanner status={today_attendance} />

      {/* ── Performance + Attendance Summary Cards ── */}
      <div className="grid grid-cols-2 gap-5 mb-8">

        {/* Performance Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-teal-100 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p
                className="text-gray-400 uppercase"
                style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}
              >
                Performance Summary
              </p>
              <p
                className="text-gray-900 mt-1"
                style={{ fontSize: "32px", fontWeight: 750, letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                {avgPct !== null ? avgPct : "—"}
                <span className="text-gray-400" style={{ fontSize: "16px", fontWeight: 500 }}>
                  %
                </span>
              </p>
              <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
                Average Score
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#f0fdfa" }}
            >
              <Star size={22} style={{ color: "#0d9488" }} strokeWidth={2} />
            </div>
          </div>
          <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
            <div>
              <p className="text-gray-900" style={{ fontSize: "20px", fontWeight: 700 }}>
                {recent_marks.length}
              </p>
              <p className="text-gray-400" style={{ fontSize: "12px" }}>
                Recent Tests
              </p>
            </div>
            <div>
              <p className="text-gray-900" style={{ fontSize: "20px", fontWeight: 700 }}>
                {aGradeCount}
              </p>
              <p className="text-gray-400" style={{ fontSize: "12px" }}>
                A-Grade Results
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-teal-100 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p
                className="text-gray-400 uppercase"
                style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}
              >
                Attendance Summary
              </p>
              <p
                className="text-gray-900 mt-1"
                style={{ fontSize: "32px", fontWeight: 750, letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                {attendance_stats.percentage !== null ? attendance_stats.percentage : "—"}
                <span className="text-gray-400" style={{ fontSize: "16px", fontWeight: 500 }}>
                  %
                </span>
              </p>
              <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
                Attendance Percentage
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <CheckSquare size={22} style={{ color: "#16a34a" }} strokeWidth={2} />
            </div>
          </div>

          {/* Attendance bar */}
          <div className="mb-4">
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${attendance_stats.percentage ?? 0}%`,
                  backgroundColor:
                    (attendance_stats.percentage ?? 0) >= attendance_stats.min_required_pct
                      ? "#16a34a"
                      : "#dc2626",
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
            <div>
              <p className="text-gray-900" style={{ fontSize: "20px", fontWeight: 700 }}>
                {attendance_stats.present}
              </p>
              <p className="text-gray-400" style={{ fontSize: "12px" }}>
                Days Present
              </p>
            </div>
            <div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#dc2626" }}>
                {attendance_stats.absent}
              </p>
              <p className="text-gray-400" style={{ fontSize: "12px" }}>
                Total Absences
              </p>
            </div>
            {attendance_stats.min_required_met !== null && (
              <div>
                <p className="text-gray-400" style={{ fontSize: "12px" }}>
                  Min. required
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: attendance_stats.min_required_met ? "#16a34a" : "#dc2626",
                  }}
                >
                  {attendance_stats.min_required_pct}%{" "}
                  {attendance_stats.min_required_met ? "(met ✓)" : "(not met ✗)"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-Column Lower Layout ── */}
      <div className="flex gap-6">

        {/* LEFT COLUMN */}
        <div className="flex-[2] flex flex-col gap-8 min-w-0">

          {/* Recent Test Results Table */}
          <div>
            <SectionHeader title="Recent Test Results" viewAllPath="/student/results" />
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {recent_marks.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-gray-400" style={{ fontSize: "13px" }}>
                    No test results published yet.
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#f9fafb" }}>
                      {["Test", "Subject", "Score", "Grade", "Date"].map((col) => (
                        <th
                          key={col}
                          className="text-left px-5 py-3"
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            color: "#9ca3af",
                            textTransform: "uppercase",
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent_marks.map((test) => {
                      const gc = getGradeColor(test.percentage);
                      const sc = getSubjectStyle(test.subject);
                      return (
                        <tr key={test.test_id} className="border-t border-gray-50">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: sc.bg }}
                              >
                                <FileText size={13} style={{ color: sc.color }} strokeWidth={2} />
                              </div>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                                {test.test_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className="px-2.5 py-0.5 rounded-full"
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: sc.color,
                                backgroundColor: sc.bg,
                              }}
                            >
                              {test.subject}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${test.percentage}%`,
                                    backgroundColor:
                                      test.percentage >= 90
                                        ? "#0d9488"
                                        : test.percentage >= 75
                                        ? "#2563eb"
                                        : "#d97706",
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                                {test.score}/{test.total_marks}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className="px-2.5 py-0.5 rounded-full"
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: gc.color,
                                backgroundColor: gc.bg,
                              }}
                            >
                              {getGradeLabel(test.percentage)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-gray-400" />
                              <span style={{ fontSize: "12.5px", color: "#6b7280" }}>
                                {formatDate(test.test_date)}
                              </span>
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

        </div>

        {/* RIGHT COLUMN */}
        <div
          className="flex flex-col gap-8 flex-shrink-0"
          style={{ width: "300px" }}
        >

          {/* Latest Announcements */}
          <div>
            <SectionHeader title="Latest Announcements" viewAllPath="/student/announcements" />
            <div className="flex flex-col gap-2.5">
              {recent_announcements.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-8 text-center">
                  <p className="text-gray-400" style={{ fontSize: "13px" }}>
                    No announcements yet.
                  </p>
                </div>
              ) : (
                recent_announcements.map((ann) => {
                  const ac = getAnnouncementStyle(ann.announcement_type);
                  return (
                    <div
                      key={ann.id}
                      className="bg-white rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="px-2 py-0.5 rounded-full"
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                color: ac.color,
                                backgroundColor: ac.bg,
                              }}
                            >
                              {ann.announcement_type}
                            </span>
                            <span className="text-gray-300" style={{ fontSize: "11px" }}>
                              {formatDate(ann.created_at)}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: 650,
                              color: "#111827",
                              lineHeight: 1.35,
                            }}
                          >
                            {ann.announcement_title}
                          </p>
                          <p
                            className="text-gray-400 mt-1 overflow-hidden"
                            style={{
                              fontSize: "11.5px",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical" as const,
                            }}
                          >
                            {ann.message}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}