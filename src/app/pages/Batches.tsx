// src/app/pages/Batches.tsx

import { useState, useEffect } from "react";
import {
  fetchAcademicYearsApi,
  createClassBatchApi,
  fetchBatchesPageSummaryApi,
  fetchBatchesDetailedApi,
  fetchBatchStudentsApi,
  type AcademicYearOption,
  type BatchDetailed,
  type BatchStudent,
} from "../../Lib/api/class-batches";
import {
  Search,
  Plus,
  Users,
  ChevronRight,
  X,
  Users2,
  GraduationCap,
  ArrowLeft,
  Mail,
  BookOpen,
  Edit2,
  Loader2,
} from "lucide-react";

// ─── Subject Color Map ─────────────────────────────────────────────────────────

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







// ─── Create Batch Modal ────────────────────────────────────────────────────────

function CreateBatchModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName]                           = useState("");
  const [selectedYearId, setSelectedYearId]       = useState("");
  const [academicYears, setAcademicYears]         = useState<AcademicYearOption[]>([]);
  const [yearsLoading, setYearsLoading]           = useState(true);
  const [submitting, setSubmitting]               = useState(false);
  const [error, setError]                         = useState<string | null>(null);

  useEffect(() => {
    fetchAcademicYearsApi()
      .then((years) => {
        setAcademicYears(years);
        const active = years.find((y) => y.is_active);
        if (active) setSelectedYearId(active.id);
        else if (years.length > 0) setSelectedYearId(years[0].id);
      })
      .catch(() => setError("Could not load academic years."))
      .finally(() => setYearsLoading(false));
  }, []);

  const canSubmit = name.trim().length > 0 && selectedYearId !== "" && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await createClassBatchApi({ name: name.trim(), academic_year_id: selectedYearId });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7" style={{ border: "1px solid #f3f4f6" }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Create Batch
            </h2>
            <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
              Add a new class batch to the institute.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Batch Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Science – Batch A"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
              style={{ fontSize: "13.5px" }}
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>Academic Year</label>
            {yearsLoading ? (
              <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-400" style={{ fontSize: "13.5px" }}>
                Loading years…
              </div>
            ) : (
              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 bg-white transition-all"
                style={{ fontSize: "13.5px" }}
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}{y.is_active ? " (Active)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <p className="text-red-500" style={{ fontSize: "12.5px" }}>{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            style={{ fontSize: "13.5px", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {submitting ? "Creating…" : "Create Batch"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Student Profile Sub-Panel ─────────────────────────────────────────────────

function StudentProfilePanel({
  student,
  batchName,
  onBack,
}: {
  student: BatchStudent;
  batchName: string;
  onBack: () => void;
}) {
  const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-panel Header */}
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
            <p className="text-gray-400 mt-0.5" style={{ fontSize: "12px", fontFamily: "monospace" }}>
              {student.login_identifier}
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Batch tag */}
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#f0fdfa", border: "1px solid #ccfbf1" }}>
          <Users2 size={14} style={{ color: "#0d9488" }} strokeWidth={2} />
          <span className="text-teal-700" style={{ fontSize: "12.5px", fontWeight: 600 }}>{batchName}</span>
        </div>

        {/* Contact */}
        <div>
          <p className="text-gray-400 uppercase mb-2" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
            Identifier
          </p>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
              <Mail size={13} className="text-gray-400" strokeWidth={2} />
            </div>
            <span className="text-gray-600" style={{ fontSize: "13px" }}>{student.login_identifier}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Detail Side Panel ──────────────────────────────────────────────────

function BatchDetailPanel({
  batch,
  onClose,
}: {
  batch: BatchDetailed;
  onClose: () => void;
}) {
  const [selectedStudent, setSelectedStudent] = useState<BatchStudent | null>(null);
  const [students, setStudents]               = useState<BatchStudent[]>([]);
  const [totalStudents, setTotalStudents]     = useState(0);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingMore, setLoadingMore]         = useState(false);
  const [studentsError, setStudentsError]     = useState<string | null>(null);
  const [showAllStudents, setShowAllStudents] = useState(false);

  const PREVIEW_LIMIT = 5;

  // Load first 5 students on mount
  useEffect(() => {
    setLoadingStudents(true);
    setStudentsError(null);
    fetchBatchStudentsApi(batch.id, PREVIEW_LIMIT, 0)
      .then((res) => {
        setStudents(res.data);
        setTotalStudents(res.total);
      })
      .catch((e: any) => setStudentsError(e.message ?? "Failed to load students"))
      .finally(() => setLoadingStudents(false));
  }, [batch.id]);

  // Load all remaining students when "Show More" is clicked
  async function handleShowMore() {
    if (showAllStudents) return;
    setLoadingMore(true);
    try {
      const res = await fetchBatchStudentsApi(batch.id, 1000, 0);
      setStudents(res.data);
      setShowAllStudents(true);
    } catch (e: any) {
      setStudentsError(e.message ?? "Failed to load students");
    } finally {
      setLoadingMore(false);
    }
  }

  const sc = getSubjectColor(batch.name);

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
            {/* Panel Header */}
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
              {/* Batch Identity */}
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: sc.bg }}
                  >
                    <BookOpen size={22} style={{ color: sc.color }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                      {batch.name}
                    </p>
                    <p className="text-gray-400 mt-1" style={{ fontSize: "12.5px" }}>
                      {batch.academic_year_label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Batch Info Grid */}
              <div className="px-6 py-4 border-b border-gray-50">
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  {[
                    { label: "Academic Year", value: batch.academic_year_label },
                    { label: "Created Date",  value: new Date(batch.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                    { label: "Created By",    value: batch.created_by },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-gray-400" style={{ fontSize: "12.5px", fontWeight: 500 }}>{label}</span>
                      <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teachers */}
              <div className="px-6 py-4 border-b border-gray-50">
                <p className="text-gray-400 uppercase mb-3" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                  Assigned {batch.teachers.length === 1 ? "Teacher" : "Teachers"}
                </p>
                {batch.teachers.length === 0 ? (
                  <p className="text-gray-400" style={{ fontSize: "13px" }}>No teachers assigned yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {batch.teachers.map((teacher) => (
                      <div key={teacher} className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#f5f3ff" }}
                        >
                          <GraduationCap size={16} style={{ color: "#7c3aed" }} strokeWidth={2} />
                        </div>
                        <p className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 600 }}>{teacher}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch Strength */}
              <div className="px-6 py-4 border-b border-gray-50">
                <p className="text-gray-400 uppercase mb-3" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                  Batch Strength
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#f0fdfa" }}
                  >
                    <span style={{ fontSize: "20px", fontWeight: 750, color: "#0d9488" }}>
                      {batch.student_count}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-800" style={{ fontSize: "14px", fontWeight: 600 }}>
                      {batch.student_count} {batch.student_count === 1 ? "Student" : "Students"}
                    </p>
                    <p className="text-gray-400 mt-0.5" style={{ fontSize: "12px" }}>
                      currently enrolled in this batch
                    </p>
                  </div>
                </div>
              </div>

              {/* Student List */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                    Student List
                  </p>
                  {!loadingStudents && (
                    <span className="text-gray-400" style={{ fontSize: "12px" }}>
                      {showAllStudents ? `${totalStudents} total` : `Showing ${Math.min(students.length, PREVIEW_LIMIT)} of ${totalStudents}`}
                    </span>
                  )}
                </div>

                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span style={{ fontSize: "13px" }}>Loading students…</span>
                  </div>
                ) : studentsError ? (
                  <p className="text-red-400 text-center py-6" style={{ fontSize: "13px" }}>{studentsError}</p>
                ) : students.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users size={28} className="text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-gray-400" style={{ fontSize: "13px" }}>No students enrolled yet</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr style={{ backgroundColor: "#f9fafb" }}>
                            <th className="text-left px-4 py-2.5 text-gray-400" style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.05em" }}>
                              STUDENT NAME
                            </th>
                            <th className="px-4 py-2.5" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {students.map((student) => {
                            const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                            return (
                              <tr
                                key={student.id}
                                className="hover:bg-teal-50 transition-colors cursor-pointer group"
                                onClick={() => setSelectedStudent(student)}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{ backgroundColor: "#f0fdfa" }}
                                    >
                                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#0d9488" }}>
                                        {initials}
                                      </span>
                                    </div>
                                    <p className="text-gray-800 group-hover:text-teal-700 transition-colors" style={{ fontSize: "13px", fontWeight: 600 }}>
                                      {student.name}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <ChevronRight size={13} className="text-gray-300 group-hover:text-teal-400 transition-colors" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Show More */}
                    {!showAllStudents && totalStudents > PREVIEW_LIMIT && (
                      <button
                        onClick={handleShowMore}
                        disabled={loadingMore}
                        className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ fontSize: "13px", fontWeight: 600 }}
                      >
                        {loadingMore ? (
                          <><Loader2 size={13} className="animate-spin" /> Loading…</>
                        ) : (
                          `Show all ${totalStudents} students`
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 flex items-center justify-center gap-2 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all"
                style={{ fontSize: "13.5px", fontWeight: 600 }}
              >
                <Edit2 size={14} strokeWidth={2.5} />
                Edit Batch
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function Batches() {
  const [search, setSearch]             = useState("");
  const [showCreate, setShowCreate]     = useState(false);
  const [detailBatch, setDetailBatch]   = useState<BatchDetailed | null>(null);

  // Summary stats
  const [summary, setSummary]           = useState<{ active_batches: number; total_students: number } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Batch list
  const [batches, setBatches]           = useState<BatchDetailed[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [batchesError, setBatchesError] = useState<string | null>(null);

  function loadData() {
    setSummaryLoading(true);
    setBatchesLoading(true);
    setBatchesError(null);

    fetchBatchesPageSummaryApi()
      .then(setSummary)
      .catch(() => setSummary({ active_batches: 0, total_students: 0 }))
      .finally(() => setSummaryLoading(false));

    fetchBatchesDetailedApi()
      .then(setBatches)
      .catch((e: any) => setBatchesError(e.message ?? "Failed to load batches"))
      .finally(() => setBatchesLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  const filtered = batches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.teachers.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-[1100px] mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Batches
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {batchesLoading ? "Loading…" : `${batches.length} ${batches.length === 1 ? "batch" : "batches"} · active academic year`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Create Batch
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          {
            label: "Active Batches",
            value: summaryLoading ? "—" : (summary?.active_batches ?? 0).toString(),
            color: "#0d9488", bg: "#f0fdfa",
          },
          {
            label: "Total Students",
            value: summaryLoading ? "—" : (summary?.total_students ?? 0).toString(),
            color: "#7c3aed", bg: "#f5f3ff",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>{s.label}</p>
            <p style={{ fontSize: "22px", fontWeight: 750, letterSpacing: "-0.02em", color: s.color, lineHeight: 1.2, marginTop: "4px" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by batch name or teacher…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm transition-all"
            style={{ fontSize: "13.5px" }}
          />
        </div>
      </div>

      {/* ── Batch Grid ── */}
      {batchesLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontSize: "14px" }}>Loading batches…</span>
        </div>
      ) : batchesError ? (
        <div className="py-16 text-center">
          <p className="text-red-400" style={{ fontSize: "14px" }}>{batchesError}</p>
          <button
            onClick={loadData}
            className="mt-3 text-teal-600 underline"
            style={{ fontSize: "13px" }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((batch) => {
              const sc = getSubjectColor(batch.name);
              return (
                <div
                  key={batch.id}
                  onClick={() => setDetailBatch(batch)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-teal-200 transition-all group"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: sc.bg }}>
                        <BookOpen size={16} style={{ color: sc.color }} strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-gray-900 group-hover:text-teal-700 transition-colors" style={{ fontSize: "14px", fontWeight: 650 }}>
                          {batch.name}
                        </p>
                        <p className="text-gray-400" style={{ fontSize: "12px" }}>
                          {batch.academic_year_label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Teachers */}
                  <div className="flex items-center gap-2 mb-4 mt-3 flex-wrap">
                    {batch.teachers.length === 0 ? (
                      <span className="text-gray-400" style={{ fontSize: "12px" }}>No teacher assigned</span>
                    ) : (
                      batch.teachers.map((t) => (
                        <span key={t} className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: "#7c3aed", backgroundColor: "#f5f3ff" }}>
                          {t}
                        </span>
                      ))
                    )}
                  </div>

                  {/* Student count */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <Users size={12} className="text-gray-400" strokeWidth={2} />
                    <span className="text-gray-500" style={{ fontSize: "12px", fontWeight: 500 }}>
                      {batch.student_count} {batch.student_count === 1 ? "student" : "students"}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-gray-400" style={{ fontSize: "12px" }}>
                      Created by {batch.created_by}
                    </span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Users2 size={36} className="text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-gray-400" style={{ fontSize: "14px" }}>
                {search ? "No batches match your search" : "No active batches for this academic year"}
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Modals & Panels ── */}
      {showCreate && (
        <CreateBatchModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadData();
          }}
        />
      )}
      {detailBatch && (
        <BatchDetailPanel
          batch={detailBatch}
          onClose={() => setDetailBatch(null)}
        />
      )}
    </div>
  );
}
