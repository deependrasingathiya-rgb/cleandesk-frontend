// src/app/pages/Teacher/MyBatches.tsx

import { useState, useEffect } from "react";
import { getToken } from "../../auth";
import {
  Search,
  Users,
  ChevronRight,
  X,
  BookOpen,
  GraduationCap,
  Users2,
  CheckSquare,
  ClipboardList,
  ArrowLeft,
  Mail,
  Phone,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type BatchStatus = "Active" | "Full" | "Upcoming" | "Archived";

type Student = {
  id: number;
  name: string;
  rollNo: string;
  email: string;
  phone: string;
  attendance: number;
  grade: string;
  status: "Active" | "At Risk" | "Inactive";
  joined: string;
};

type Batch = {
  id: number;
  name: string;
  subject: string;
  teacher: string;
  teacherEmail: string;
  students: number;
  capacity: number;
  year: string;
  status: BatchStatus;
  startDate: string;
  createdDate: string;
  createdBy: string;
  attendanceDoneToday: boolean;
  avgAttendance: number;
  upcomingTests: number;
  studentList: Student[];
};

// ─── API Types ─────────────────────────────────────────────────────────────────

type ApiBatch = {
  id: string;
  name: string;
  student_count: number;
  attendance_done: boolean;
  avg_attendance: number;
  start_date: string | null;
};

// ─── Hook: fetch teacher's assigned batches ─────────────────────────────────────

function useTeacherBatches() {
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const token = getToken();
    fetch("/api/teacher/dashboard/batches", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch batches");
        return res.json();
      })
      .then((data: { batches: ApiBatch[] }) => {
        if (!cancelled) {
          setBatches(data.batches ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[MyBatches] fetch error:", err);
          setError("Could not load batches.");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return { batches, loading, error };
}

// ─── Page-level summary hook ────────────────────────────────────────────────────

function useTeacherDashboardSummary() {
  const [summary, setSummary] = useState<{
    total_batches: number;
    total_students: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    fetch("/api/teacher/dashboard/summary", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSummary(data.summary ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return summary;
}

const subjectColors: Record<string, { color: string; bg: string }> = {
  Science:     { color: "#0d9488", bg: "#f0fdfa" },
  Commerce:    { color: "#7c3aed", bg: "#f5f3ff" },
  Arts:        { color: "#d97706", bg: "#fffbeb" },
  Mathematics: { color: "#2563eb", bg: "#eff6ff" },
  Physics:     { color: "#db2777", bg: "#fdf2f8" },
  Biology:     { color: "#16a34a", bg: "#f0fdf4" },
  Chemistry:   { color: "#ea580c", bg: "#fff7ed" },
  English:     { color: "#6b7280", bg: "#f9fafb" },
};

function getSubjectColor(subject: string) {
  return subjectColors[subject] ?? { color: "#6b7280", bg: "#f9fafb" };
}

function getStatusStyle(status: BatchStatus) {
  return {
    Active:   { color: "#0d9488", bg: "#f0fdfa" },
    Full:     { color: "#ea580c", bg: "#fff7ed" },
    Upcoming: { color: "#2563eb", bg: "#eff6ff" },
    Archived: { color: "#6b7280", bg: "#f9fafb" },
  }[status];
}

function getStudentStatusStyle(status: Student["status"]) {
  return {
    Active:    { color: "#16a34a", bg: "#f0fdf4" },
    "At Risk": { color: "#d97706", bg: "#fffbeb" },
    Inactive:  { color: "#6b7280", bg: "#f9fafb" },
  }[status];
}

function getGradeColor(grade: string) {
  if (grade.startsWith("A")) return "#0d9488";
  if (grade.startsWith("B")) return "#2563eb";
  return "#d97706";
}

// These are only the batches this teacher is assigned to


// ─── Student Profile Sub-Panel ─────────────────────────────────────────────────

function StudentProfilePanel({
  student,
  batchName,
  onBack,
}: {
  student: Student;
  batchName: string;
  onBack: () => void;
}) {
  const initials    = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const statusStyle = getStudentStatusStyle(student.status);
  const gradeColor  = getGradeColor(student.grade);

  return (
    <div className="flex flex-col h-full">
      {/* Back nav */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} strokeWidth={2.2} />
        </button>
        <span className="text-gray-500" style={{ fontSize: "13px" }}>Back to batch</span>
      </div>

      {/* Student Identity */}
      <div className="px-6 py-5 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#0d9488" }}>{initials}</span>
          </div>
          <div>
            <p className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              {student.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-400" style={{ fontSize: "12px", fontFamily: "monospace" }}>
                {student.rollNo}
              </span>
              <span className="text-gray-200">·</span>
              <span
                className="px-2 py-0.5 rounded-full"
                style={{ fontSize: "11px", fontWeight: 600, color: statusStyle.color, backgroundColor: statusStyle.bg }}
              >
                {student.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Batch tag */}
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#f0fdfa", border: "1px solid #ccfbf1" }}>
          <Users2 size={14} style={{ color: "#0d9488" }} strokeWidth={2} />
          <span className="text-teal-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{batchName}</span>
        </div>

        {/* Contact */}
        <div>
          <p className="text-gray-400 uppercase mb-2" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
            Contact
          </p>
          <div className="space-y-2.5">
            {[
              { icon: Mail,  value: student.email },
              { icon: Phone, value: student.phone },
            ].map(({ icon: Icon, value }) => (
              <div key={value} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
                  <Icon size={13} className="text-gray-400" strokeWidth={2} />
                </div>
                <span className="text-gray-600" style={{ fontSize: "13px" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance */}
        <div>
          <p className="text-gray-400 uppercase mb-3" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
            Performance
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
              <p style={{ fontSize: "22px", fontWeight: 750, letterSpacing: "-0.02em", color: gradeColor }}>
                {student.grade}
              </p>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: "11px" }}>Grade</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
              <p style={{
                fontSize: "22px", fontWeight: 750, letterSpacing: "-0.02em",
                color: student.attendance >= 90 ? "#0d9488" : student.attendance >= 75 ? "#d97706" : "#dc2626",
              }}>
                {student.attendance}%
              </p>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: "11px" }}>Attendance</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${student.attendance}%`,
                  backgroundColor: student.attendance >= 90 ? "#0d9488" : student.attendance >= 75 ? "#d97706" : "#dc2626",
                }}
              />
            </div>
          </div>
        </div>

        {/* Joined */}
        <div className="flex items-center justify-between py-3 border-t border-gray-50">
          <span className="text-gray-400" style={{ fontSize: "12.5px" }}>Joined</span>
          <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{student.joined}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Detail Side Panel ───────────────────────────────────────────────────

function BatchDetailPanel({
  batch,
  onClose,
}: {
  batch: ApiBatch;
  onClose: () => void;
}) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 bg-white flex flex-col"
        style={{ width: "420px", borderLeft: "1px solid #f3f4f6", boxShadow: "-8px 0 32px rgba(0,0,0,0.08)" }}
      >
        {selectedStudent ? (
          <StudentProfilePanel
            student={selectedStudent}
            batchName={batch.name}
            onBack={() => setSelectedStudent(null)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                Batch Details
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* Identity */}
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#f0fdfa" }}
                  >
                    <BookOpen size={22} style={{ color: "#0d9488" }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                      {batch.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      
                      
                      {/* Attendance today indicator */}
                      <span
                        className="px-2.5 py-0.5 rounded-full"
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: batch.attendance_done ? "#16a34a" : "#d97706",
                          backgroundColor: batch.attendance_done ? "#f0fdf4" : "#fffbeb",
                        }}
                      >
                        {batch.attendance_done ? "Attendance Done" : "Attendance Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Batch Info */}
              <div className="px-6 py-4 border-b border-gray-50">
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  {[
                    { label: "Start Date", value: batch.start_date ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-gray-400" style={{ fontSize: "12.5px", fontWeight: 500 }}>{label}</span>
                      <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats for teacher */}
              <div className="px-6 py-4 border-b border-gray-50">
                <p className="text-gray-400 uppercase mb-3" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                  At a Glance
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Avg. Attendance", value: `${batch.avg_attendance}%`, color: batch.avg_attendance >= 85 ? "#0d9488" : "#d97706", icon: TrendingUp },
                    { label: "Students",        value: String(batch.student_count), color: "#7c3aed", icon: Users },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                      <Icon size={14} style={{ color }} strokeWidth={2} className="mx-auto mb-1" />
                      <p style={{ fontSize: "16px", fontWeight: 750, color, letterSpacing: "-0.01em" }}>{value}</p>
                      <p className="text-gray-400 mt-0.5" style={{ fontSize: "10px" }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              

              {/* Student List */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                    Student List
                  </p>
                  <span className="text-gray-400" style={{ fontSize: "12px" }}>
                    —
                  </span>
                </div>

                <div className="py-8 text-center">
                  <Users size={28} className="text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-gray-400" style={{ fontSize: "13px" }}>Student list — coming soon</p>
                </div>
              </div>
            </div>

            {/* Footer — quick actions the teacher can do */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700"
                style={{ borderColor: "#e5e7eb", color: "#374151", fontSize: "13px", fontWeight: 600 }}
              >
                <CheckSquare size={14} strokeWidth={2.5} />
                Mark Attendance
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                style={{ borderColor: "#e5e7eb", color: "#374151", fontSize: "13px", fontWeight: 600 }}
              >
                <ClipboardList size={14} strokeWidth={2.5} />
                Add Test
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function MyBatches() {
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [detailBatch, setDetailBatch]   = useState<ApiBatch | null>(null);

  const { batches, loading, error } = useTeacherBatches();
  const summary                     = useTeacherDashboardSummary();

  const filtered = batches.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const statusFilters = ["All"];

  const totalStudents      = summary?.total_students ?? batches.reduce((s, b) => s + b.student_count, 0);
  const pendingCount       = batches.filter((b) => !b.attendance_done).length;
  const avgBatchAttendance = batches.length > 0
    ? Math.round(batches.reduce((s, b) => s + b.avg_attendance, 0) / batches.length)
    : 0;
  const atRiskCount = 0; // placeholder — at-risk logic not yet implemented

  return (
    <div className="p-8 max-w-[1100px] mx-auto">
{error && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm text-red-600" style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
          {error}
        </div>
      )}
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            My Batches
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {batches.length} assigned batch{batches.length !== 1 ? "es" : ""}
          </p>
        </div>

        {/* Attendance pending nudge */}
        {pendingCount > 0 && (
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <AlertTriangle size={15} style={{ color: "#d97706" }} strokeWidth={2.5} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#92400e" }}>
              {pendingCount} batch{pendingCount > 1 ? "es" : ""} pending attendance today
            </span>
          </div>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* My Batches */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f0fdfa" }}>
            <Users2 size={18} style={{ color: "#0d9488" }} strokeWidth={1.8} />
          </div>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>My Batches</p>
            <p style={{ fontSize: "20px", fontWeight: 750, letterSpacing: "-0.02em", color: "#0d9488", lineHeight: 1.2, marginTop: "2px" }}>
              {loading ? "—" : String(batches.length)}
            </p>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f5f3ff" }}>
            <Users size={18} style={{ color: "#7c3aed" }} strokeWidth={1.8} />
          </div>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>Total Students</p>
            <p style={{ fontSize: "20px", fontWeight: 750, letterSpacing: "-0.02em", color: "#7c3aed", lineHeight: 1.2, marginTop: "2px" }}>
              {loading ? "—" : String(totalStudents)}
            </p>
          </div>
        </div>

        {/* Avg. Attendance — coming soon placeholder */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 opacity-40">
          <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: "#f9fafb" }} />
          <div>
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>Avg. Attendance</p>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#d1d5db", marginTop: "2px" }}>Coming soon</p>
          </div>
        </div>

        {/* At-Risk Students — logic pending */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fef2f2" }}>
            <AlertTriangle size={18} style={{ color: "#dc2626" }} strokeWidth={1.8} />
          </div>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>At-Risk Students</p>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#d1d5db", marginTop: "2px" }}>Coming soon</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by batch name or subject…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm transition-all"
            style={{ fontSize: "13.5px" }}
          />
        </div>
        <div className="flex gap-1.5">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className="px-3.5 py-2 rounded-xl border transition-all"
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                borderColor: filterStatus === f ? "#0d9488" : "#f3f4f6",
                backgroundColor: filterStatus === f ? "#f0fdfa" : "white",
                color: filterStatus === f ? "#0d9488" : "#9ca3af",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Batch Grid ── */}
      <div className="grid grid-cols-2 gap-4">
        {loading && (
          <div className="col-span-2 py-16 text-center text-gray-400" style={{ fontSize: "14px" }}>
            Loading batches…
          </div>
        )}
        {filtered.map((batch) => (
          <div
            key={batch.id}
            onClick={() => setDetailBatch(batch)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-teal-200 transition-all group"
          >
            {/* Top row */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f0fdfa" }}>
                  <BookOpen size={16} style={{ color: "#0d9488" }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-gray-900 group-hover:text-teal-700 transition-colors" style={{ fontSize: "14px", fontWeight: 650 }}>
                    {batch.name}
                  </p>
                </div>
              </div>
              <span
                className="px-2.5 py-0.5 rounded-full"
                style={{
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: batch.attendance_done ? "#16a34a" : "#d97706",
                  backgroundColor: batch.attendance_done ? "#f0fdf4" : "#fffbeb",
                }}
              >
                {batch.attendance_done ? "✓ Attendance Done" : "⚠ Attendance Pending"}
              </span>
            </div>

            {/* Mid row — students + avg attendance */}
            <div className="flex items-center gap-2 mb-4 mt-3">
              <span className="text-gray-500" style={{ fontSize: "12.5px" }}>
                {batch.student_count} students
              </span>
              <span className="text-gray-400" style={{ fontSize: "12px" }}>·</span>
              <span style={{ fontSize: "12.5px", fontWeight: 500, color: batch.avg_attendance >= 85 ? "#0d9488" : "#d97706" }}>
                {batch.avg_attendance}% avg attendance
              </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <span className="text-gray-400" style={{ fontSize: "12px" }}>Started {batch.start_date ?? "—"}</span>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <GraduationCap size={36} className="text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-gray-400" style={{ fontSize: "14px" }}>No batches match your search</p>
        </div>
      )}

      {/* Detail Panel */}
      {detailBatch && (
        <BatchDetailPanel
          batch={detailBatch}
          onClose={() => setDetailBatch(null)}
        />
      )}
    </div>
  );
}