// src/app/pages/Teacher/TeacherDashboard.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Users2,
  UserCheck,
  CheckSquare,
  ClipboardList,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import {
  fetchTeacherDashboardSummary,
  fetchTeacherDashboardUpcomingTests,
  fetchTeacherDashboardBatches,
  type TeacherDashboardSummary,
  type TeacherUpcomingTest,
  type TeacherBatchRow,
} from "../../../Lib/api/teacher-dashboard";
import { fetchMyProfile } from "../../../Lib/api/profile";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, subText, icon: Icon, color, bg }: {
  label: string; value: string; subText: string;
  icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-teal-100 transition-all">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon size={16} style={{ color }} strokeWidth={2} />
        </div>
        <span className="uppercase" style={{ fontSize: "10px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.07em" }}>
          {label}
        </span>
      </div>
      <div>
        <p className="text-gray-900" style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1.1 }}>{value}</p>
        <p className="text-gray-400 mt-1" style={{ fontSize: "12px" }}>{subText}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, viewAllPath }: { title: string; viewAllPath: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.01em", color: "#111827" }}>{title}</h2>
      <button
        onClick={() => navigate(viewAllPath)}
        className="flex items-center gap-1 text-teal-600 hover:text-teal-700 transition-colors"
        style={{ fontSize: "13px", fontWeight: 500 }}
      >
        View All <ArrowRight size={14} />
      </button>
    </div>
  );
}

function AttendanceStatusBanner({ status }: { status: "pending" | "done" }) {
  const navigate = useNavigate();
  const isPending = status === "pending";
  return (
    <div
      className="w-full rounded-2xl border p-5 flex items-center gap-5"
      style={{ backgroundColor: isPending ? "#fffbeb" : "#f0fdf4", borderColor: isPending ? "#fbbf24" : "#86efac" }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: isPending ? "#fef3c7" : "#dcfce7" }}
      >
        {isPending
          ? <AlertTriangle size={22} style={{ color: "#d97706" }} strokeWidth={2} />
          : <CheckSquare size={22} style={{ color: "#16a34a" }} strokeWidth={2} />
        }
      </div>
      <div className="flex-1">
        <p style={{ fontSize: "15px", fontWeight: 700, color: isPending ? "#92400e" : "#14532d" }}>
          {isPending ? "Today's Attendance — Pending" : "Today's Attendance — All Done"}
        </p>
        <p style={{ fontSize: "13px", color: isPending ? "#b45309" : "#166534", marginTop: "2px" }}>
          {isPending
            ? "Some batches still need attendance marked for today."
            : "All batches marked for today."}
        </p>
      </div>
      <button
        onClick={() => navigate("/teacher/attendance")}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 flex-shrink-0"
        style={{ backgroundColor: isPending ? "#d97706" : "#16a34a", fontSize: "13.5px", fontWeight: 600 }}
      >
        {isPending ? "Mark Attendance" : "View Attendance"}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

type BatchCardBatch = {
  id: number;
  name: string;
  subject: string;
  students: number;
  year: string;
  attendance: number;
  attendanceDone: boolean;
  subjectColor: string;
  subjectBg: string;
};

function BatchCard({ batch }: { batch: BatchCardBatch }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <p style={{ fontSize: "14.5px", fontWeight: 650, color: "#111827" }}>{batch.name}</p>
        <span className="px-2.5 py-0.5 rounded-full flex-shrink-0" style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#f0fdfa", color: "#0d9488" }}>
          {batch.students} students
        </span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: batch.subjectColor, backgroundColor: batch.subjectBg }}>
          {batch.subject}
        </span>
        {batch.year && (
          <span className="text-gray-400" style={{ fontSize: "12px" }}>{batch.year}</span>
        )}
      </div>
      {batch.attendance > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-gray-400" style={{ fontSize: "11.5px" }}>Attendance rate</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{batch.attendance}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${batch.attendance}%`,
                backgroundColor: batch.attendance >= 90 ? "#0d9488" : batch.attendance >= 80 ? "#d97706" : "#dc2626",
              }}
            />
          </div>
        </div>
      )}
      {batch.attendanceDone ? (
        <span className="flex items-center gap-1.5" style={{ fontSize: "12px", fontWeight: 600, color: "#16a34a" }}>
          <CheckSquare size={13} strokeWidth={2.5} />
          Today's attendance marked
        </span>
      ) : (
        <span className="flex items-center gap-1.5" style={{ fontSize: "12px", fontWeight: 600, color: "#d97706" }}>
          <AlertTriangle size={13} strokeWidth={2.5} />
          Attendance pending today
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function TeacherDashboard() {
  const [summary,       setSummary]       = useState<TeacherDashboardSummary | null>(null);
  const [upcomingTests, setUpcomingTests] = useState<TeacherUpcomingTest[]>([]);
  const [batches,       setBatches]       = useState<TeacherBatchRow[]>([]);
  const [teacherName,   setTeacherName]   = useState<string>("");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [prof, sum, tests, batchList] = await Promise.all([
          fetchMyProfile(),
          fetchTeacherDashboardSummary(),
          fetchTeacherDashboardUpcomingTests(5),
          fetchTeacherDashboardBatches(),
        ]);
        if (cancelled) return;
        setTeacherName(prof.full_name);
        setSummary(sum);
        setUpcomingTests(tests);
        setBatches(batchList);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "short", year: "numeric",
  });

  const stats = summary
    ? [
        {
          label: "My Batches",
          value: String(summary.active_batches),
          subText: `${summary.total_batches} total assigned`,
          icon: Users2,
          color: "#0d9488",
          bg: "#f0fdfa",
        },
        {
          label: "Total Students",
          value: String(summary.total_students),
          subText: "Across active batches",
          icon: UserCheck,
          color: "#7c3aed",
          bg: "#f5f3ff",
        },
        {
          label: "Attendance Today",
          value: summary.attendance_pending_count === 0 ? "Done" : "Pending",
          subText:
            summary.attendance_pending_count === 0
              ? "All batches marked"
              : `${summary.attendance_pending_count} batch${summary.attendance_pending_count > 1 ? "es" : ""} unmarked`,
          icon: summary.attendance_pending_count === 0 ? CheckCircle2 : CheckSquare,
          color: summary.attendance_pending_count === 0 ? "#16a34a" : "#d97706",
          bg: summary.attendance_pending_count === 0 ? "#f0fdf4" : "#fffbeb",
        },
        {
          label: "Upcoming Tests",
          value: String(summary.upcoming_tests_count),
          subText: "Tests you created",
          icon: ClipboardList,
          color: "#2563eb",
          bg: "#eff6ff",
        },
        {
          label: "Marks Pending",
          value: String(summary.marks_pending_count),
          subText: "Tests awaiting marks",
          icon: Award,
          color: "#dc2626",
          bg: "#fef2f2",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <span className="text-gray-400" style={{ fontSize: "14px" }}>Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center gap-3" style={{ minHeight: "60vh" }}>
        <AlertTriangle size={18} className="text-red-400" />
        <span style={{ fontSize: "14px", color: "#dc2626" }}>{error}</span>
      </div>
    );
  }

  return (
    <div className="p-8" style={{ maxWidth: "1200px", margin: "0 auto" }}>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            My Dashboard
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            Welcome back, {teacherName} · {today}
          </p>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Attendance Banner ── */}
      <div className="mb-8">
        <AttendanceStatusBanner
          status={summary?.attendance_pending_count === 0 ? "done" : "pending"}
        />
      </div>

      {/* ── Two-column body ── */}
      <div className="flex gap-6">

        {/* LEFT — Batches + Tests */}
        <div className="flex-[2] flex flex-col gap-8 min-w-0">

          <div>
            <SectionHeader title="My Assigned Batches" viewAllPath="/teacher/batches" />
            {batches.length === 0 ? (
              <p className="text-gray-400" style={{ fontSize: "13px" }}>No active batches assigned.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {batches.map((b) => (
                  <BatchCard
                    key={b.id}
                    batch={{
                      id:             Number(b.id),
                      name:           b.name,
                      subject:        "—",
                      students:       b.student_count,
                      year:           "",
                      attendance:     0,
                      attendanceDone: b.attendance_done,
                      subjectColor:   "#0d9488",
                      subjectBg:      "#f0fdfa",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionHeader title="Upcoming Tests" viewAllPath="/teacher/tests" />
            {upcomingTests.length === 0 ? (
              <p className="text-gray-400" style={{ fontSize: "13px" }}>No upcoming tests.</p>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#f9fafb" }}>
                      {["Test Name", "Subject", "Batch", "Date"].map((col) => (
                        <th
                          key={col}
                          className="text-left px-5 py-3"
                          style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.04em", color: "#9ca3af", textTransform: "uppercase" }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingTests.map((test) => (
                      <tr key={test.id} className="border-t border-gray-50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#eff6ff" }}>
                              <ClipboardList size={14} style={{ color: "#2563eb" }} strokeWidth={2} />
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{test.test_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: "#2563eb", backgroundColor: "#eff6ff" }}>
                            {test.subject}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-gray-500" style={{ fontSize: "12.5px" }}>{test.batch_name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-gray-400" />
                            <span style={{ fontSize: "12.5px", fontWeight: 500, color: "#374151" }}>
                              {new Date(test.test_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — placeholder for announcements (kept structurally) */}
        <div className="flex-[1] flex flex-col min-w-0" style={{ minWidth: "300px", maxWidth: "340px" }}>
          <SectionHeader title="Recent Announcements" viewAllPath="/teacher/announcements" />
          <div className="flex flex-col gap-3">
            {/* Announcements wiring in next step */}
          </div>
        </div>

      </div>
    </div>
  );
}