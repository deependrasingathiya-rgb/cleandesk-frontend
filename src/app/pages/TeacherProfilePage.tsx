// src/app/pages/TeacherProfilePage.tsx

import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  fetchTeacherProfileApi,
  fetchTeacherTestsApi,
  type TeacherProfileData,
  type TeacherTestRow,
} from "../../Lib/api/teacher-profile";
import { unassignTeacherBatchSubjectApi } from "../../Lib/api/teachers";
import {
  ArrowLeft,
  Phone,
  Mail,
  CalendarDays,
  BookOpen,
  ClipboardList,
  Calendar,
  Users2,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// ─── Subject colour map (mirrors system-wide map) ─────────────────────────────

const subjectColors: Record<string, { color: string; bg: string }> = {
  Physics:            { color: "#db2777", bg: "#fdf2f8" },
  Mathematics:        { color: "#2563eb", bg: "#eff6ff" },
  Chemistry:          { color: "#ea580c", bg: "#fff7ed" },
  English:            { color: "#6b7280", bg: "#f9fafb" },
  Business:           { color: "#7c3aed", bg: "#f5f3ff" },
  Biology:            { color: "#16a34a", bg: "#f0fdf4" },
  Accounts:           { color: "#0d9488", bg: "#f0fdfa" },
  History:            { color: "#b45309", bg: "#fffbeb" },
  Geography:          { color: "#0369a1", bg: "#f0f9ff" },
  "Computer Science": { color: "#4f46e5", bg: "#eef2ff" },
  Economics:          { color: "#be185d", bg: "#fdf2f8" },
};

function getSubjectColor(subject: string | null) {
  if (!subject) return { color: "#6b7280", bg: "#f9fafb" };
  return subjectColors[subject] ?? { color: "#0d9488", bg: "#f0fdfa" };
}

function fmtDate(iso: string, short = false): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: short ? "short" : "long",
    year: "numeric",
  });
}

// ─── Tests "View All" modal ────────────────────────────────────────────────────

function AllTestsModal({
  teacherId,
  teacherName,
  onClose,
}: {
  teacherId: string;
  teacherName: string;
  onClose: () => void;
}) {
  const [tests,   setTests]   = useState<TeacherTestRow[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const PAGE_SIZE = 15;

  useEffect(() => {
    setLoading(true);
    fetchTeacherTestsApi(teacherId, {
      limit:  PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    })
      .then(({ data, total }) => { setTests(data); setTotal(total); })
      .catch((e: any) => setError(e.message ?? "Failed to load tests"))
      .finally(() => setLoading(false));
  }, [teacherId, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full flex flex-col"
        style={{ maxWidth: "780px", maxHeight: "85vh", border: "1px solid #f3f4f6" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              All Tests Conducted
            </h2>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "13px" }}>
              {teacherName} · {total} test{total !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span style={{ fontSize: "14px" }}>Loading tests…</span>
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-red-400" style={{ fontSize: "13.5px" }}>{error}</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardList size={28} className="text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-gray-400" style={{ fontSize: "13.5px" }}>No tests found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  {["Test Name", "Subject", "Batch", "Date", "Total Marks", "Status"].map((col) => (
                    <th
                      key={col}
                      className="text-left px-6 py-3 text-gray-400"
                      style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => {
                  const sc = getSubjectColor(test.subject);
                  return (
                    <tr key={test.id} className="border-t border-gray-50">
                      <td className="px-6 py-3.5">
                        <p className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 600 }}>{test.test_name}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: sc.color, backgroundColor: sc.bg }}>
                          {test.subject}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-gray-500" style={{ fontSize: "13px" }}>{test.batch_name}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-gray-400" />
                          <span className="text-gray-700" style={{ fontSize: "13px" }}>{fmtDate(test.test_date, true)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>{test.total_marks}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full"
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: test.has_marks ? "#16a34a" : "#d97706",
                            backgroundColor: test.has_marks ? "#f0fdf4" : "#fffbeb",
                          }}
                        >
                          {test.has_marks ? "Marks Done" : "Marks Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-7 py-4 border-t border-gray-100 flex-shrink-0">
            <span className="text-gray-400" style={{ fontSize: "12.5px" }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-md border flex items-center justify-center text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-gray-600 px-2" style={{ fontSize: "13px", fontWeight: 500 }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-md border flex items-center justify-center text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TeacherProfilePage() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate      = useNavigate();

  const [profile,        setProfile]        = useState<TeacherProfileData | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [showAllTests,   setShowAllTests]   = useState(false);
  // batchId currently in edit mode
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  // key = `${batchId}::${subject}` awaiting confirm click
  const [confirmKey,     setConfirmKey]     = useState<string | null>(null);
  // key currently being removed (disables button during async call)
  const [removingKey,    setRemovingKey]    = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) { setError("No teacher ID provided"); setLoading(false); return; }

    setLoading(true);
    fetchTeacherProfileApi(teacherId)
      .then(setProfile)
      .catch((e: any) => setError(e.message ?? "Failed to load teacher profile"))
      .finally(() => setLoading(false));
  }, [teacherId]);

  async function handleUnassignSubject(batchId: string, subject: string) {
    if (!teacherId || !profile) return;
    const key = `${batchId}::${subject}`;

    if (confirmKey !== key) {
      // First click — request confirmation
      setConfirmKey(key);
      return;
    }

    // Second click — confirmed
    setConfirmKey(null);
    setRemovingKey(key);
    try {
      await unassignTeacherBatchSubjectApi(teacherId, batchId, subject);
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          assigned_batches: prev.assigned_batches
            .map((b) =>
              b.id !== batchId
                ? b
                : { ...b, subjects: b.subjects.filter((s) => s !== subject) }
            )
            // Drop the batch row entirely once it has no subjects left
            .filter((b) => b.id !== batchId || b.subjects.length > 0),
        };
      });
    } catch (err: any) {
      console.error("Unassign subject failed:", err.message);
    } finally {
      setRemovingKey(null);
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="p-8 max-w-[1000px] mx-auto flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-teal-500 mx-auto mb-3" />
          <p className="text-gray-400" style={{ fontSize: "14px" }}>Loading teacher profile…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !profile) {
    return (
      <div className="p-8 max-w-[1000px] mx-auto flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <AlertTriangle size={28} className="mx-auto mb-3" style={{ color: "#dc2626" }} strokeWidth={1.5} />
          <p className="text-gray-800 mb-1" style={{ fontSize: "15px", fontWeight: 600 }}>Could not load profile</p>
          <p className="text-gray-400" style={{ fontSize: "13px" }}>{error ?? "Teacher not found."}</p>
        </div>
      </div>
    );
  }

  const initials = profile.full_name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <div className="p-8 max-w-[1000px] mx-auto">

      {/* ── Back ── */}
      <button
        onClick={() => navigate("/teachers")}
        className="flex items-center gap-2 text-gray-400 hover:text-teal-600 transition-colors mb-6"
        style={{ fontSize: "13.5px", fontWeight: 600 }}
      >
        <ArrowLeft size={15} strokeWidth={2.5} />
        Back to Teachers
      </button>

      {/* ── Hero card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 mb-6">
        <div className="flex items-start gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#2563eb" }}>{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-gray-900" style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {profile.full_name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: "#2563eb", backgroundColor: "#eff6ff" }}>
                Teacher
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full"
                style={{
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: profile.is_active ? "#16a34a" : "#9ca3af",
                  backgroundColor: profile.is_active ? "#f0fdf4" : "#f9fafb",
                }}
              >
                {profile.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "13px", fontFamily: "monospace" }}>
              {profile.login_identifier}
            </p>
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              {profile.mobile && (
                <div className="flex items-center gap-1.5 text-gray-500" style={{ fontSize: "13px" }}>
                  <Phone size={13} strokeWidth={2} className="text-gray-400" />
                  {profile.mobile}
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-1.5 text-gray-500" style={{ fontSize: "13px" }}>
                  <Mail size={13} strokeWidth={2} className="text-gray-400" />
                  {profile.email}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-gray-400" style={{ fontSize: "13px" }}>
                <CalendarDays size={13} strokeWidth={2} />
                Joined {fmtDate(profile.created_at, true)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-50">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Batches Assigned</p>
            <p className="text-gray-900 mt-1" style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "#2563eb" }}>
              {profile.assigned_batches.length}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tests Conducted</p>
            <p className="text-gray-900 mt-1" style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "#0d9488" }}>
              {profile.tests_total}
            </p>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-5 gap-6">

        {/* Left — Assigned Batches (2 cols) */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <GraduationCap size={15} className="text-teal-500" strokeWidth={2} />
              <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Assigned Batches</h2>
              <span className="ml-auto text-gray-400" style={{ fontSize: "12px" }}>
                {profile.assigned_batches.length} total
              </span>
            </div>

            {profile.assigned_batches.length === 0 ? (
              <div className="py-10 flex flex-col items-center rounded-xl" style={{ backgroundColor: "#f9fafb" }}>
                <BookOpen size={24} className="text-gray-200 mb-2" strokeWidth={1.5} />
                <p className="text-gray-400" style={{ fontSize: "13px" }}>No batches assigned</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {profile.assigned_batches.map((batch) => {
                  const isEditing  = editingBatchId === batch.id;
                  // Use first subject for icon colour, fallback to neutral
                  const sc = getSubjectColor(batch.subjects[0] ?? null);
                  return (
                    <div key={batch.id} className="rounded-xl border border-gray-100 overflow-hidden">

                      {/* Batch header row */}
                      <div className="flex items-start gap-3 p-3.5">
                        <div
                          className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: sc.bg }}
                        >
                          <BookOpen size={15} style={{ color: sc.color }} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 600 }}>{batch.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {/* Subjects inline summary — hidden in edit mode */}
                            {!isEditing && batch.subjects.length > 0 && batch.subjects.map((s) => {
                              const ssc = getSubjectColor(s);
                              return (
                                <span key={s} className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: ssc.color, backgroundColor: ssc.bg }}>
                                  {s}
                                </span>
                              );
                            })}
                            {!isEditing && batch.subjects.length === 0 && (
                              <span className="text-gray-300" style={{ fontSize: "11.5px" }}>No subjects</span>
                            )}
                            <span className="text-gray-400" style={{ fontSize: "11.5px" }}>
                              {batch.academic_year_label}
                            </span>
                            <span className="text-gray-400" style={{ fontSize: "11.5px" }}>
                              · {batch.student_count} student{batch.student_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        {/* Edit / Done toggle */}
                        <button
                          onClick={() => {
                            setEditingBatchId(isEditing ? null : batch.id);
                            setConfirmKey(null);
                          }}
                          className="px-2.5 py-1 rounded-md border transition-all flex-shrink-0"
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            borderColor: isEditing ? "#0d9488" : "#e5e7eb",
                            color:       isEditing ? "#0d9488" : "#9ca3af",
                            backgroundColor: isEditing ? "#f0fdfa" : "transparent",
                          }}
                        >
                          {isEditing ? "Done" : "Edit"}
                        </button>
                      </div>

                      {/* Subject removal list — only in edit mode */}
                      {isEditing && (
                        <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: "1px solid #f3f4f6" }}>
                          <p className="text-gray-400 pt-2" style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.04em" }}>
                            REMOVE SUBJECTS
                          </p>
                          {batch.subjects.length === 0 ? (
                            <p style={{ fontSize: "12px", color: "#9ca3af" }}>No subjects assigned to this batch.</p>
                          ) : (
                            batch.subjects.map((subject) => {
                              const key              = `${batch.id}::${subject}`;
                              const isPendingConfirm = confirmKey === key;
                              const isBeingRemoved   = removingKey === key;
                              return (
                                <div
                                  key={subject}
                                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-all"
                                  style={{
                                    backgroundColor: isPendingConfirm ? "#fef2f2" : "#f9fafb",
                                    border: `1px solid ${isPendingConfirm ? "#fecaca" : "#f3f4f6"}`,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "12.5px",
                                      fontWeight: 500,
                                      color: isPendingConfirm ? "#dc2626" : "#374151",
                                    }}
                                  >
                                    {isPendingConfirm ? `Remove "${subject}"?` : subject}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {isPendingConfirm && (
                                      <button
                                        onClick={() => setConfirmKey(null)}
                                        className="px-2 py-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                        style={{ fontSize: "11px" }}
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      disabled={isBeingRemoved}
                                      onClick={() => handleUnassignSubject(batch.id, subject)}
                                      className="w-6 h-6 rounded flex items-center justify-center transition-all disabled:opacity-40"
                                      style={{
                                        backgroundColor: isPendingConfirm ? "#dc2626" : "transparent",
                                        color:           isPendingConfirm ? "white"    : "#d1d5db",
                                      }}
                                      title={isPendingConfirm ? "Confirm remove" : "Remove subject"}
                                    >
                                      {isBeingRemoved
                                        ? <span style={{ fontSize: "9px" }}>…</span>
                                        : <X size={12} strokeWidth={2.5} />}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — Tests Conducted (3 cols) */}
        <div className="col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
              <ClipboardList size={15} className="text-teal-500" strokeWidth={2} />
              <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Tests Conducted</h2>
              <span className="ml-auto text-gray-400" style={{ fontSize: "12px" }}>
                {profile.tests_total} total
              </span>
              {profile.tests_total > 5 && (
                <button
                  onClick={() => setShowAllTests(true)}
                  className="flex items-center gap-1 text-teal-600 hover:text-teal-700 transition-colors ml-2"
                  style={{ fontSize: "12.5px", fontWeight: 600 }}
                >
                  View All
                  <ChevronRight size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {profile.tests_conducted.length === 0 ? (
              <div className="py-14 flex flex-col items-center">
                <ClipboardList size={28} className="text-gray-200 mb-2" strokeWidth={1.5} />
                <p className="text-gray-400" style={{ fontSize: "13.5px" }}>No tests conducted yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    {["Test", "Subject", "Batch", "Date", "Status"].map((col) => (
                      <th
                        key={col}
                        className="text-left px-5 py-3 text-gray-400"
                        style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profile.tests_conducted.map((test) => {
                    const sc = getSubjectColor(test.subject);
                    return (
                      <tr key={test.id} className="border-t border-gray-50">
                        <td className="px-5 py-3.5">
                          <p className="text-gray-800" style={{ fontSize: "13px", fontWeight: 600 }}>{test.test_name}</p>
                          <p className="text-gray-400" style={{ fontSize: "11.5px" }}>{test.total_marks} marks</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: sc.color, backgroundColor: sc.bg }}>
                            {test.subject}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-gray-500" style={{ fontSize: "12.5px" }}>{test.batch_name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-gray-400" />
                            <span className="text-gray-700" style={{ fontSize: "12.5px" }}>{fmtDate(test.test_date, true)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="px-2.5 py-0.5 rounded-full"
                            style={{
                              fontSize: "11.5px",
                              fontWeight: 600,
                              color: test.has_marks ? "#16a34a" : "#d97706",
                              backgroundColor: test.has_marks ? "#f0fdf4" : "#fffbeb",
                            }}
                          >
                            {test.has_marks ? "Marks Done" : "Pending"}
                          </span>
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

      {/* ── All Tests Modal ── */}
      {showAllTests && (
        <AllTestsModal
          teacherId={teacherId!}
          teacherName={profile.full_name}
          onClose={() => setShowAllTests(false)}
        />
      )}
    </div>
  );
}