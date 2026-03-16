// src/app/pages/TeacherProfilePage.tsx

import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { fetchTeachersApi, unassignTeacherBatchApi, type TeacherListItem, type TeacherBatch } from "../../Lib/api/teachers";
import {
  ArrowLeft,
  Phone,
  Mail,
  CalendarDays,
  BookOpen,
  FlaskConical,
  TrendingUp,
  Users2,
  ClipboardList,
  BarChart2,
  GraduationCap,
  ExternalLink,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Teacher = {
  id: string;
  name: string;
  loginIdentifier: string;
  mobile: string | null;
  email: string | null;
  assignedBatches: TeacherBatch[];
  active: boolean;
  createdDate: string;
};

function mapApiTeacher(t: TeacherListItem): Teacher {
  return {
    id: t.id,
    name: t.full_name,
    loginIdentifier: t.login_identifier,
    mobile: t.mobile ?? null,
    email: t.email ?? null,
    assignedBatches: t.assigned_batches,
    active: t.is_active,
    createdDate: new Date(t.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}

// ─── Placeholder Section Card ─────────────────────────────────────────────────

function PlaceholderCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon size={15} className="text-teal-500" strokeWidth={2} />
        <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>
          {title}
        </h2>
      </div>
      <div
        className="flex flex-col items-center justify-center py-10 rounded-xl"
        style={{ backgroundColor: "#f9fafb" }}
      >
        <Icon size={28} className="text-gray-200 mb-3" strokeWidth={1.5} />
        <p className="text-gray-400" style={{ fontSize: "13.5px", fontWeight: 500 }}>
          {description}
        </p>
        <p className="text-gray-300 mt-1" style={{ fontSize: "12px" }}>
          Data will appear here once wired
        </p>
      </div>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 shadow-sm p-5"
      style={{ backgroundColor: "white" }}
    >
      <p style={{ fontSize: "28px", fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </p>
      <p className="text-gray-400 mt-1.5" style={{ fontSize: "11.5px", fontWeight: 500 }}>
        {label}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TeacherProfilePage() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) { setError("No teacher ID provided"); setLoading(false); return; }

    setLoading(true);
    fetchTeachersApi()
      .then((rows) => {
        const match = rows.find((r) => r.id === teacherId);
        if (!match) { setError("Teacher not found"); return; }
        setTeacher(mapApiTeacher(match));
      })
      .catch((e: any) => setError(e.message ?? "Failed to load teacher"))
      .finally(() => setLoading(false));
  }, [teacherId]);

  if (loading) {
    return (
      <div className="p-8 max-w-[1100px] mx-auto flex items-center justify-center h-64">
        <p className="text-gray-400" style={{ fontSize: "14px" }}>Loading teacher profile…</p>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="p-8 max-w-[1100px] mx-auto flex items-center justify-center h-64">
        <p className="text-red-400" style={{ fontSize: "14px" }}>{error ?? "Teacher not found."}</p>
      </div>
    );
  }

  const initials = teacher.name
    .split(" ")
    .filter((w) => /^[A-Z]/i.test(w))
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <div className="p-8 max-w-[1100px] mx-auto">

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

          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#2563eb" }}>{initials}</span>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-gray-900" style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {teacher.name}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full"
                style={{ fontSize: "11.5px", fontWeight: 600, color: "#2563eb", backgroundColor: "#eff6ff" }}
              >
                Teacher
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full"
                style={{
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: teacher.active ? "#16a34a" : "#9ca3af",
                  backgroundColor: teacher.active ? "#f0fdf4" : "#f9fafb",
                }}
              >
                {teacher.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
              {teacher.loginIdentifier}
            </p>

            {/* Contact row */}
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              {teacher.mobile && (
                <div className="flex items-center gap-1.5 text-gray-500" style={{ fontSize: "13px" }}>
                  <Phone size={13} strokeWidth={2} className="text-gray-400" />
                  {teacher.mobile}
                </div>
              )}
              {teacher.email && (
                <div className="flex items-center gap-1.5 text-gray-500" style={{ fontSize: "13px" }}>
                  <Mail size={13} strokeWidth={2} className="text-gray-400" />
                  {teacher.email}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-gray-400" style={{ fontSize: "13px" }}>
                <CalendarDays size={13} strokeWidth={2} />
                Joined {teacher.createdDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats row ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatPill
          label="Batches Assigned"
          value={teacher.assignedBatches.length}
          color="#2563eb"
          bg="#eff6ff"
        />
        <StatPill label="Tests Conducted"  value="—" color="#0d9488" bg="#f0fdfa" />
        <StatPill label="Students Taught"  value="—" color="#7c3aed" bg="#f5f3ff" />
        <StatPill label="Avg. Class Score" value="—" color="#d97706" bg="#fffbeb" />
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Left col — batches (1 col) */}
        <div className="col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-teal-500" strokeWidth={2} />
                <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 700 }}>
                  Assigned Batches
                </h2>
              </div>
              <span className="text-gray-400" style={{ fontSize: "12px" }}>
                {teacher.assignedBatches.length} total
              </span>
            </div>

            {teacher.assignedBatches.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10 rounded-xl"
                style={{ backgroundColor: "#f9fafb" }}
              >
                <BookOpen size={24} className="text-gray-200 mb-2" strokeWidth={1.5} />
                <p className="text-gray-400" style={{ fontSize: "13px" }}>No batches assigned</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teacher.assignedBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100"
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#eff6ff" }}
                    >
                      <BookOpen size={14} style={{ color: "#2563eb" }} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                        {batch.name}
                      </p>
                      {batch.subject && (
                        <p style={{ fontSize: "11.5px", color: "#6b7280", marginTop: "1px" }}>
                          {batch.subject}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        await unassignTeacherBatchApi(teacher.id, batch.id);
                        setTeacher((prev) =>
                          prev
                            ? { ...prev, assignedBatches: prev.assignedBatches.filter((b) => b.id !== batch.id) }
                            : prev
                        );
                      }}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                      title="Remove from batch"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col — placeholders (2 cols) */}
        <div className="col-span-2 flex flex-col gap-6">

          <PlaceholderCard
            icon={FlaskConical}
            title="Tests Conducted"
            description="Tests created and assigned by this teacher"
          />

          <PlaceholderCard
            icon={TrendingUp}
            title="Student Performance"
            description="Average scores across batches over time"
          />

        </div>
      </div>

      {/* ── Bottom row — more placeholders ── */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <PlaceholderCard
          icon={Users2}
          title="Student Roster"
          description="Students across all assigned batches"
        />
        <PlaceholderCard
          icon={BarChart2}
          title="Subject Performance"
          description="Breakdown by subject taught"
        />
      </div>

    </div>
  );
}