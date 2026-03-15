// src/app/pages/Students.tsx

import { useState, useEffect } from "react";
import {
  enrollStudentApi,
  fetchStudentsApi,
  fetchStudentStatsApi,
  type EnrolledStudent,
  type StudentRow,
  type StudentStats,
} from "../../Lib/api/students";
import { fetchAcademicYearsApi, fetchClassBatchesByYearApi } from "../../Lib/api/class-batches";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
  CheckCircle2,
  AlertTriangle,
  UserX,
  BookOpen,
  ClipboardList,
  CalendarDays,
  Phone,
  School,
  Users2,
  Copy,
  Check,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type EducationBoard = "CBSE" | "ICSE" | "Maharashtra State Board";

type Student = {
  id: string;
  name: string;
  fatherName: string;
  mobile: string;
  alternateMobile: string;
  batch: string;
  school: string;
  board: EducationBoard | string;
  attendance: number | null;
  joined: string;
  status: "Active" | "At Risk" | "Inactive";
};

function mapRowToStudent(row: StudentRow): Student {
  return {
    id: row.id,
    name: row.name ?? "—",
    fatherName: "",
    mobile: row.mobile ?? "",
    alternateMobile: "",
    batch: row.batch ?? "",
    school: "",
    board: (row.board as EducationBoard) ?? "CBSE",
    attendance: row.attendance_pct,
    joined: new Date(row.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
    status: row.is_active ? "Active" : "Inactive",
  };
}
// ─── Board Options ──────────────────────────────────────────────────────────────

const BOARD_OPTIONS: EducationBoard[] = ["CBSE", "ICSE", "Maharashtra State Board"];



// ─── Enroll Form State ─────────────────────────────────────────────────────────

type EnrollForm = {
  name: string;
  fatherName: string;
  batch: string;
  academicYearId: string;
  school: string;
  mobile: string;
  alternateMobile: string;
  board: EducationBoard | "";
};

const emptyForm: EnrollForm = {
  name: "", fatherName: "", batch: "", academicYearId: "",
  school: "", mobile: "", alternateMobile: "", board: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getBoardColor(board: EducationBoard | string) {
  if (board === "CBSE") return { color: "#2563eb", bg: "#eff6ff" };
  if (board === "ICSE") return { color: "#7c3aed", bg: "#f5f3ff" };
  return { color: "#d97706", bg: "#fffbeb" };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-gray-700 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function TextInput({
  value, onChange, placeholder, type = "text",
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
      style={{ fontSize: "13.5px" }}
    />
  );
}

// ─── Enroll Form View ──────────────────────────────────────────────────────────

function EnrollStudentForm({ onBack, onSubmit }: {
  onBack: () => void;
  onSubmit: (studentName: string, loginIdentifier: string, tempPassword: string) => void;
}) {
  const [form, setForm] = useState<EnrollForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof EnrollForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<EnrolledStudent | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Live data from backend
  const [academicYears, setAcademicYears] = useState<{ id: string; label: string; is_active: boolean }[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load academic years once on mount; auto-select the active one
  useEffect(() => {
    fetchAcademicYearsApi()
      .then((years) => {
        setAcademicYears(years);
        const active = years.find((y) => y.is_active);
        if (active) setForm((f) => ({ ...f, academicYearId: active.id }));
      })
      .catch(() => setApiError("Failed to load academic years."))
      .finally(() => setLoadingData(false));
  }, []);

  // Re-fetch batches whenever the selected academic year changes
  useEffect(() => {
    if (!form.academicYearId) {
      setBatches([]);
      setForm((f) => ({ ...f, batch: "" }));
      return;
    }
    fetchClassBatchesByYearApi(form.academicYearId)
      .then((batchList) => {
        setBatches(batchList);
        // Clear the batch selection if it no longer exists in the new year
        setForm((f) => ({
          ...f,
          batch: batchList.some((b) => b.id === f.batch) ? f.batch : "",
        }));
      })
      .catch(() => setApiError("Failed to load batches for the selected year."));
  }, [form.academicYearId]);

  const set = (key: keyof EnrollForm) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  function validate() {
    const e: Partial<Record<keyof EnrollForm, string>> = {};
    if (!form.name.trim()) e.name = "Student name is required.";
    if (!form.mobile.trim()) e.mobile = "Primary mobile number is required.";
    else if (!/^\d{10}$/.test(form.mobile)) e.mobile = "Enter a valid 10-digit number.";
    if (!form.school.trim()) e.school = "School name is required.";
    if (!form.board) e.board = "Education board is required.";
    if (form.alternateMobile && !/^\d{10}$/.test(form.alternateMobile))
      e.alternateMobile = "Enter a valid 10-digit number.";
    if (!form.academicYearId) e.academicYearId = "Academic year is required.";
    if (!form.batch) e.batch = "Batch selection is required.";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setApiError(null);
    try {
      const result = await enrollStudentApi({
        full_name: form.name.trim(),
        father_name: form.fatherName.trim() || undefined,
        mobile: form.mobile.trim(),
        alternate_mobile: form.alternateMobile.trim() || undefined,
        school_name: form.school.trim(),
        education_board: form.board,
        academic_year_id: form.academicYearId,
        class_batch_id: form.batch || undefined,
      });
      setCreatedStudent(result);
      onSubmit(form.name, result.login_identifier, result.temporary_password);
      setSubmitted(true);
    } catch (err: any) {
      setApiError(err.message ?? "Enrollment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy() {
    if (!createdStudent) return;
    navigator.clipboard.writeText(
      `${createdStudent.login_identifier}\n${createdStudent.temporary_password}`
    ).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (submitted && createdStudent) {
    return (
      <div className="p-8 max-w-[600px] mx-auto flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#f0fdfa" }}>
          <CheckCircle2 size={32} color="#0d9488" strokeWidth={2} />
        </div>
        <h2 className="text-gray-900 mb-2" style={{ fontSize: "20px", fontWeight: 700 }}>Student Enrolled!</h2>
        <p className="text-gray-400 text-center" style={{ fontSize: "14px" }}>
          {form.name}'s academic record has been created. Share these credentials now, because the password cannot be retrieved again.
        </p>
        <div className="w-full max-w-md mt-6 space-y-3">
          {[
            { label: "Login Identifier", value: createdStudent.login_identifier },
            { label: "Temporary Password", value: createdStudent.temporary_password },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-gray-400 mb-1.5" style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {label}
              </p>
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-gray-100" style={{ backgroundColor: "#f9fafb" }}>
                <span className="text-gray-800 font-mono" style={{ fontSize: "13.5px" }}>{value}</span>
                <button
                  onClick={handleCopy}
                  className="text-gray-400 hover:text-teal-600 transition-colors flex-shrink-0"
                  title="Copy credentials"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
          style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Create Student Academic Record
          </h1>
          <p className="text-gray-400 mt-0.5" style={{ fontSize: "13.5px" }}>
            Fill in the student's details to enroll them into the institute.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {/* Section: Personal Info */}
        <p className="text-gray-400 uppercase mb-5" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em" }}>
          Personal Information
        </p>

        <div className="grid grid-cols-2 gap-5 mb-6">
          <div>
            <FieldLabel required>Name of Student</FieldLabel>
            <TextInput value={form.name} onChange={set("name")} placeholder="e.g. Sneha Patel" />
            {errors.name && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.name}</p>}
          </div>
          <div>
            <FieldLabel>Father's Name</FieldLabel>
            <TextInput value={form.fatherName} onChange={set("fatherName")} placeholder="e.g. Rajesh Patel" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-6">
          <div>
            <FieldLabel required>Primary Mobile Number</FieldLabel>
            <TextInput value={form.mobile} onChange={set("mobile")} placeholder="10-digit number" type="tel" />
            {errors.mobile && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.mobile}</p>}
          </div>
          <div>
            <FieldLabel>Alternate Mobile Number</FieldLabel>
            <TextInput value={form.alternateMobile} onChange={set("alternateMobile")} placeholder="Optional" type="tel" />
            {errors.alternateMobile && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.alternateMobile}</p>}
          </div>
        </div>

        {/* Section: Academic Info */}
        <div className="border-t border-gray-50 pt-6 mt-2 mb-5">
          <p className="text-gray-400 uppercase mb-5" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em" }}>
            Academic Information
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-6">
          <div>
            <FieldLabel required>Name of School</FieldLabel>
            <TextInput value={form.school} onChange={set("school")} placeholder="e.g. Delhi Public School" />
            {errors.school && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.school}</p>}
          </div>
          <div>
            <FieldLabel required>Education Board</FieldLabel>
            <select
              value={form.board}
              onChange={(e) => set("board")(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white"
              style={{ fontSize: "13.5px", color: form.board ? "#1f2937" : "#d1d5db" }}
            >
              <option value="" disabled>Select a board</option>
              {BOARD_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {errors.board && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.board}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-6">
          <div>
            <FieldLabel required>Academic Year</FieldLabel>
            <select
              value={form.academicYearId}
              onChange={(e) => set("academicYearId")(e.target.value)}
              disabled={loadingData}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white disabled:opacity-50"
              style={{ fontSize: "13.5px", color: form.academicYearId ? "#1f2937" : "#d1d5db" }}
            >
              <option value="">{loadingData ? "Loading…" : "Select academic year"}</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.label}{y.is_active ? " (Active)" : ""}</option>
              ))}
            </select>
            {errors.academicYearId && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.academicYearId}</p>}
          </div>

          <div>
            <FieldLabel required>Batch</FieldLabel>
            <select
              value={form.batch}
              onChange={(e) => {
                set("batch")(e.target.value);
                setErrors((prev) => ({ ...prev, batch: undefined }));
              }}
              disabled={loadingData || !form.academicYearId}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white disabled:opacity-50"
              style={{ fontSize: "13.5px", color: form.batch ? "#1f2937" : "#d1d5db" }}
            >
              <option value="">
                {!form.academicYearId
                  ? "Select academic year first"
                  : batches.length === 0
                  ? "No batches for this year"
                  : "Select a batch"}
              </option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.batch && <p className="text-red-500 mt-1" style={{ fontSize: "12px" }}>{errors.batch}</p>}
          </div>
        </div>

        {apiError && (
          <p className="text-red-500 mb-4" style={{ fontSize: "12.5px" }}>{apiError}</p>
        )}

        {/* Required fields note */}
        <p className="text-gray-400 mb-6" style={{ fontSize: "12px" }}>
          <span className="text-red-400">*</span> Required fields
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingData}
            className="px-6 py-2.5 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {submitting ? "Enrolling…" : "Create Academic Record"}
          </button>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
            style={{ fontSize: "13.5px", fontWeight: 500 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Student Profile View ──────────────────────────────────────────────────────

function StudentProfile({ student, onBack, onDeactivate }: {
  student: Student;
  onBack: () => void;
  onDeactivate: (id: string) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const bc = getBoardColor(student.board);
  const initials = getInitials(student.name);
  const tests: { test: string; subject: string; marks: number; total: number; date: string }[] = [];
  const attendance: { month: string; present: number; total: number }[] = [];

  const isInactive = student.status === "Inactive";

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-6 transition-colors"
        style={{ fontSize: "13.5px", fontWeight: 500 }}
      >
        <ArrowLeft size={15} />
        Back to Students
      </button>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#f0fdfa" }}
            >
              <span style={{ fontSize: "22px", fontWeight: 800, color: "#0d9488" }}>{initials}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-gray-900" style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {student.name}
                </h1>
                <span
                  className="px-2.5 py-0.5 rounded-full"
                  style={{
                    fontSize: "11.5px", fontWeight: 600,
                    color: student.status === "Active" ? "#16a34a" : student.status === "At Risk" ? "#d97706" : "#6b7280",
                    backgroundColor: student.status === "Active" ? "#f0fdf4" : student.status === "At Risk" ? "#fffbeb" : "#f3f4f6",
                  }}
                >
                  {student.status}
                </span>
              </div>
              <p className="text-gray-400" style={{ fontSize: "13.5px" }}>
                Joined {student.joined}
              </p>
            </div>
          </div>

          {/* Deactivate button */}
          {!isInactive ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-300 transition-all"
              style={{ fontSize: "13px", fontWeight: 600 }}
            >
              <UserX size={15} />
              Deactivate Profile
            </button>
          ) : (
            <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 border border-gray-100" style={{ fontSize: "13px", fontWeight: 500 }}>
              Profile Deactivated
            </span>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-4 gap-4 mt-7 pt-6 border-t border-gray-50">
          {[
            { icon: Users2, label: "Batch", value: student.batch || "—" },
            { icon: School, label: "School", value: student.school || "—" },
            { icon: Phone, label: "Primary Mobile", value: student.mobile },
            { icon: Phone, label: "Alt. Mobile", value: student.alternateMobile || "—" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={13} className="text-gray-300" />
                <p className="text-gray-400" style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              </div>
              <p className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 500 }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { icon: BookOpen, label: "Education Board", value: student.board,
              badge: true, color: bc.color, bg: bc.bg },
            { icon: CalendarDays, label: "Father's Name", value: student.fatherName || "—" },
          ].map(({ icon: Icon, label, value, badge, color, bg }: any) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={13} className="text-gray-300" />
                <p className="text-gray-400" style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              </div>
              {badge ? (
                <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "12px", fontWeight: 600, color, backgroundColor: bg }}>
                  {value}
                </span>
              ) : (
                <p className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 500 }}>{value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom two panels */}
      <div className="grid grid-cols-2 gap-5">
        {/* Attendance Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays size={16} className="text-teal-500" />
            <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Attendance Summary</h2>
          </div>

          {/* Overall */}
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ backgroundColor: "#f0fdfa" }}>
            {student.attendance != null ? (
              <>
                <div>
                  <p className="text-gray-400" style={{ fontSize: "12px", fontWeight: 500 }}>Overall Attendance</p>
                  <p style={{ fontSize: "28px", fontWeight: 800, color: "#0d9488", lineHeight: 1.1 }}>
                    {student.attendance}%
                  </p>
                </div>
                <div className="flex-1 ml-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${student.attendance}%`,
                        backgroundColor: student.attendance >= 85 ? "#0d9488" : student.attendance >= 75 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <p className="text-gray-400 mt-1" style={{ fontSize: "11.5px" }}>
                    {student.attendance >= 75 ? "Attendance is satisfactory" : "Attendance below threshold"}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-400" style={{ fontSize: "13.5px" }}>No attendance data recorded yet.</p>
            )}
          </div>

          {/* Monthly breakdown */}
          <table className="w-full">
            <thead>
              <tr>
                {["Month", "Present", "Total", "%"].map((h) => (
                  <th key={h} className="text-left pb-2 text-gray-400" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendance.map(({ month, present, total }) => {
                const pct = Math.round((present / total) * 100);
                return (
                  <tr key={month} className="border-t border-gray-50">
                    <td className="py-2 text-gray-600" style={{ fontSize: "13px" }}>{month}</td>
                    <td className="py-2 text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{present}</td>
                    <td className="py-2 text-gray-400" style={{ fontSize: "13px" }}>{total}</td>
                    <td className="py-2">
                      <span style={{
                        fontSize: "12px", fontWeight: 700,
                        color: pct >= 85 ? "#0d9488" : pct >= 75 ? "#f59e0b" : "#ef4444",
                      }}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Test Results Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <ClipboardList size={16} className="text-teal-500" />
            <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>Test Results</h2>
          </div>

          <table className="w-full">
            <thead>
              <tr>
                {["Test", "Subject", "Score", "Date"].map((h) => (
                  <th key={h} className="text-left pb-2 text-gray-400" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tests.map((t, i) => {
                const pct = Math.round((t.marks / t.total) * 100);
                const color = pct >= 80 ? "#0d9488" : pct >= 60 ? "#2563eb" : "#d97706";
                const bg = pct >= 80 ? "#f0fdfa" : pct >= 60 ? "#eff6ff" : "#fffbeb";
                return (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="py-2.5 text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{t.test}</td>
                    <td className="py-2.5 text-gray-400" style={{ fontSize: "12.5px" }}>{t.subject}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "12px", fontWeight: 700, color, backgroundColor: bg }}>
                        {t.marks}/{t.total}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-400" style={{ fontSize: "12px" }}>{t.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {tests.length === 0 && (
            <p className="text-gray-300 text-center py-6" style={{ fontSize: "13px" }}>No test results yet</p>
          )}
        </div>
      </div>

      {/* Deactivate Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-[420px] mx-4">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fef2f2" }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-1" style={{ fontSize: "16px", fontWeight: 700 }}>Deactivate Student Profile</h3>
                <p className="text-gray-400" style={{ fontSize: "13.5px", lineHeight: 1.6 }}>
                  Are you sure you want to deactivate <strong className="text-gray-700">{student.name}</strong>'s profile?
                  This will revoke their access and mark them as inactive.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { onDeactivate(student.id); setShowConfirm(false); }}
                className="flex-1 py-2.5 rounded-xl text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#ef4444", fontSize: "13.5px", fontWeight: 600 }}
              >
                Yes, Deactivate
              </button>
              <button
                onClick={() => setShowConfirm(false)}
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

// ─── Main Students Page ────────────────────────────────────────────────────────

type View = "list" | "enroll" | "profile";

export function Students() {
  const [view, setView] = useState<View>("list");
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchStudentsApi({ limit: 100 }),
        fetchStudentStatsApi(),
      ]);
      setStudents(listRes.students.map(mapRowToStudent));
      setStats(statsRes);
    } catch (err: any) {
      setLoadError(err.message ?? "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.batch.toLowerCase().includes(search.toLowerCase())
  );

  function handleEnrollSubmit(_studentName: string, _loginIdentifier: string, _tempPassword: string) {
    // Refetch the full list so the new student appears with real data
    loadData();
  }

  function handleDeactivate(id: string) {
    setStudents((prev) =>
      prev.map((s) => s.id === id ? { ...s, status: "Inactive" as const } : s)
    );
    if (selectedStudent?.id === id) {
      setSelectedStudent((prev) => prev ? { ...prev, status: "Inactive" } : null);
    }
  }

  // ── Enroll view ──
  if (view === "enroll") {
    return (
      <EnrollStudentForm
        onBack={() => setView("list")}
        onSubmit={handleEnrollSubmit}
      />
    );
  }

  // ── Profile view ──
  if (view === "profile" && selectedStudent) {
    const live = students.find((s) => s.id === selectedStudent.id) ?? selectedStudent;
    return (
      <StudentProfile
        student={live}
        onBack={() => setView("list")}
        onDeactivate={handleDeactivate}
      />
    );
  }

  // ── List view ──
  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Students
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {students.length} total students enrolled
          </p>
        </div>
        <button
          onClick={() => setView("enroll")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
          style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Enroll Student
        </button>
      </div>

{loadError && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-500" style={{ fontSize: "13px" }}>
          {loadError}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active", value: stats ? String(stats.active_count) : "—", color: "#0d9488", bg: "#f0fdfa" },
          { label: "At Risk", value: String(students.filter((s) => s.status === "At Risk").length), color: "#d97706", bg: "#fffbeb" },
          { label: "New This Month", value: stats ? String(stats.new_this_month) : "—", color: "#7c3aed", bg: "#f5f3ff" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>{s.label}</p>
            <p style={{ fontSize: "22px", fontWeight: 750, letterSpacing: "-0.02em", color: s.color, lineHeight: 1.2, marginTop: "4px" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name, roll no, or batch…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm"
            style={{ fontSize: "13.5px" }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              {["Student", "Batch", "Attendance", "Board", "Status"].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3 text-gray-400"
                  style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em" }}
                >
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => {
              const bc = getBoardColor(student.board);
              const initials = getInitials(student.name);
              return (
                <tr
                  key={student.id}
                  onClick={() => { setSelectedStudent(student); setView("profile"); }}
                  className="border-t border-gray-50 hover:bg-teal-50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#f0fdfa" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#0d9488" }}>{initials}</span>
                      </div>
                      <div>
                        <p className="text-gray-800" style={{ fontSize: "13.5px", fontWeight: 600 }}>{student.name}</p>
                        <p className="text-gray-400" style={{ fontSize: "11.5px" }}>{student.mobile || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-gray-500" style={{ fontSize: "12.5px" }}>{student.batch || "—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {student.attendance != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${student.attendance}%`,
                              backgroundColor: student.attendance >= 85 ? "#0d9488" : student.attendance >= 75 ? "#f59e0b" : "#ef4444",
                            }}
                          />
                        </div>
                        <span className="text-gray-600" style={{ fontSize: "12.5px", fontWeight: 500 }}>{student.attendance}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-300" style={{ fontSize: "12.5px" }}>No data</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11.5px", fontWeight: 600, color: bc.color, backgroundColor: bc.bg }}>
                      {student.board}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="px-2.5 py-0.5 rounded-full"
                      style={{
                        fontSize: "11.5px", fontWeight: 600,
                        color: student.status === "Active" ? "#16a34a" : student.status === "At Risk" ? "#d97706" : "#6b7280",
                        backgroundColor: student.status === "Active" ? "#f0fdf4" : student.status === "At Risk" ? "#fffbeb" : "#f3f4f6",
                      }}
                    >
                      {student.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-gray-400" style={{ fontSize: "12.5px" }}>
            Showing {filtered.length} of {students.length} students
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              className="w-8 h-8 rounded-md border border-gray-100 flex items-center justify-center text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 rounded-md border transition-colors flex items-center justify-center"
                style={{
                  fontSize: "13px", fontWeight: 600,
                  borderColor: page === p ? "#0d9488" : "#f3f4f6",
                  color: page === p ? "white" : "#6b7280",
                  backgroundColor: page === p ? "#0d9488" : "white",
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(3, page + 1))}
              className="w-8 h-8 rounded-md border border-gray-100 flex items-center justify-center text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
