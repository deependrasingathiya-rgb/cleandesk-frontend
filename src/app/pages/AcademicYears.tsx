// src/app/pages/AcademicYears.tsx

import { useState, useEffect } from "react";
import { getToken } from "../../app/auth";
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  X,
  Edit2,
  Power,

  ChevronRight,
  Users2,
  Users,
  MoreHorizontal,
  AlertTriangle,
  Check,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AcademicYearStatus = "Active" | "Completed" | "Upcoming";

type AcademicYear = {
  id: string;
  label: string;
  batches: number;
  students: number;
  status: AcademicYearStatus;
  createdDate: string;
  createdByName: string;
  createdBy: string;
};



// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AcademicYearStatus }) {
  const config = {
    Active: {
      color: "#0d9488",
      bg: "#f0fdfa",
      icon: CheckCircle2,
      label: "Active",
    },
    Completed: {
      color: "#6b7280",
      bg: "#f9fafb",
      icon: Check,
      label: "Completed",
    },
    Upcoming: {
      color: "#2563eb",
      bg: "#eff6ff",
      icon: Clock,
      label: "Upcoming",
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ fontSize: "12px", fontWeight: 600, color: config.color, backgroundColor: config.bg }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

function AcademicYearModal({
  mode,
  year,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  year?: AcademicYear;
  onClose: () => void;
  onSave: (label: string) => void;
}) {
  const [label, setLabel] = useState(year?.label ?? "");
  const isEdit = mode === "edit";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7 relative"
        style={{ border: "1px solid #f3f4f6" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              {isEdit ? "Edit Academic Year" : "Create Academic Year"}
            </h2>
            <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
              {isEdit ? "Update the label for this academic year." : "Add a new academic session to the institute."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Field */}
        <div className="mb-6">
          <label
            className="block text-gray-600 mb-2"
            style={{ fontSize: "13px", fontWeight: 600 }}
          >
            Academic Year Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. 2027–2028"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
            style={{ fontSize: "14px" }}
          />
          <p className="text-gray-400 mt-2" style={{ fontSize: "12px" }}>
            Use the format YYYY–YYYY (e.g. 2027–2028)
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ fontSize: "13.5px", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={() => { if (label.trim()) { onSave(label.trim()); onClose(); } }}
            disabled={!label.trim()}
            className="flex-1 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {isEdit ? "Save Changes" : "Create Academic Year"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Detail Side Panel ────────────────────────────────────────────────────────

function DetailPanel({
  year,
  onClose,
  onEdit,
  onActivate,
}: {
  year: AcademicYear;
  onClose: () => void;
  onEdit: () => void;
  onActivate: () => void;
}) {
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
        style={{ width: "400px", borderLeft: "1px solid #f3f4f6", boxShadow: "-8px 0 32px rgba(0,0,0,0.08)" }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
            Academic Year Details
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* Year Identity */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#f0fdfa" }}>
              <CalendarDays size={26} style={{ color: "#0d9488" }} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-gray-900" style={{ fontSize: "22px", fontWeight: 750, letterSpacing: "-0.02em" }}>
                {year.label}
              </p>
              <StatusBadge status={year.status} />
            </div>
          </div>

          {/* Info Grid */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400" style={{ fontSize: "12.5px", fontWeight: 500 }}>Created On</span>
              <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{year.createdDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400" style={{ fontSize: "12.5px", fontWeight: 500 }}>Created By</span>
              <div className="text-right">
                <p className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{year.createdByName}</p>
                <p className="text-gray-400" style={{ fontSize: "11px" }}>{year.createdBy}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-md mx-auto mb-2" style={{ backgroundColor: "#eff6ff" }}>
                <Users2 size={16} style={{ color: "#2563eb" }} strokeWidth={2} />
              </div>
              <p className="text-gray-900" style={{ fontSize: "22px", fontWeight: 750, letterSpacing: "-0.02em" }}>{year.batches}</p>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: "12px" }}>Batches</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-md mx-auto mb-2" style={{ backgroundColor: "#f0fdfa" }}>
                <Users size={16} style={{ color: "#0d9488" }} strokeWidth={2} />
              </div>
              <p className="text-gray-900" style={{ fontSize: "22px", fontWeight: 750, letterSpacing: "-0.02em" }}>{year.students.toLocaleString()}</p>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: "12px" }}>Students</p>
            </div>
          </div>

          {/* Activate button for any non-active year */}
          {year.status !== "Active" && (
            <div className="bg-blue-50 rounded-2xl p-4 mb-5 border border-blue-100">
              <p className="text-blue-700 mb-3" style={{ fontSize: "13px", fontWeight: 600 }}>
                This year is not active. Activate it to make it the current academic year.
              </p>
              <button
                onClick={onActivate}
                className="w-full py-2.5 rounded-xl text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                style={{ backgroundColor: "#2563eb", fontSize: "13.5px", fontWeight: 600 }}
              >
                <Power size={14} strokeWidth={2.5} />
                Activate This Year
              </button>
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-2.5">
          <button
            onClick={onEdit}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 flex items-center justify-center gap-2 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all"
            style={{ fontSize: "13.5px", fontWeight: 600 }}
          >
            <Edit2 size={14} strokeWidth={2.5} />
            Edit Academic Year
          </button>
          
        </div>
      </div>
    </>
  );
}
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}
// ─── Main Component ────────────────────────────────────────────────────────────

function mapYear(raw: any): AcademicYear {
  return {
    id: raw.id,
    label: raw.label,
    batches: raw.batches ?? 0,
    students: raw.students ?? 0,
    status: raw.is_active ? "Active" : "Upcoming",   // "Completed" not yet in DB; derive below
    createdDate: raw.created_at
      ? new Date(raw.created_at).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        })
      : "—",
    createdByName: raw.created_by_name ?? "—",
    createdBy: raw.created_by_identifier ?? "—",
  };
}

export function AcademicYears() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [totalAlumni, setTotalAlumni] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [detailYear, setDetailYear] = useState<AcademicYear | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const activeYear = years.find((y) => y.status === "Active");

  // ── Load years ────────────────────────────────────────────────────────────

  async function fetchYears() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/academic-years");
      if (!res.ok) throw new Error("Failed to load academic years");
      const json = await res.json();
      // Rows without is_active=true and with batches > 0 are treated as Completed
      const mapped: AcademicYear[] = (json.data as any[]).map((raw) => {
        const base = mapYear(raw);
        if (!raw.is_active && raw.batches > 0) base.status = "Completed";
        return base;
      });
      setYears(mapped);
      setTotalAlumni(typeof json.total_alumni === "number" ? json.total_alumni : null);
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchYears(); }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleCreate(label: string) {
    try {
      const res = await authFetch("/api/academic-years", {
        method: "POST",
        body: JSON.stringify({ label }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create academic year");
      }
      await fetchYears();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleEdit(label: string) {
    if (!selectedYear) return;
    try {
      const res = await authFetch(`/api/academic-years/${selectedYear.id}`, {
        method: "PATCH",
        body: JSON.stringify({ label }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update academic year");
      }
      await fetchYears();
    } catch (e: any) {
      alert(e.message);
    }
  }

  

  async function handleActivate(id: string) {
    try {
      const res = await authFetch(`/api/academic-years/${id}/activate`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to activate academic year");
      }
      await fetchYears();
    } catch (e: any) {
      alert(e.message);
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const statsCards = [
    {
      label: "Current Year",
      value: activeYear?.label ?? "—",
      sub: "Active session",
    },
    {
      label: "Total Years",
      value: years.length.toString(),
      sub: `${years.filter((y) => y.status === "Completed").length} completed`,
    },
    {
      label: "Total Alumni",
      value: totalAlumni !== null ? totalAlumni.toLocaleString("en-IN") : "—",
      sub: "Across completed sessions",
    },
  ];

  if (loading) {
    return (
      <div className="p-8 max-w-[1100px] mx-auto flex items-center justify-center h-64">
        <p className="text-gray-400" style={{ fontSize: "14px" }}>Loading academic years…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1100px] mx-auto flex items-center justify-center h-64">
        <p className="text-red-400" style={{ fontSize: "14px" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1100px] mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-gray-900"
            style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Academic Years
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            Manage and view all academic sessions
          </p>
        </div>
        <button
          onClick={() => setModalMode("create")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
        >
          <Plus size={16} strokeWidth={2.5} />
          New Academic Year
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {statsCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-400 mb-1" style={{ fontSize: "12px", fontWeight: 500 }}>
              {s.label}
            </p>
            <p
              className="text-gray-900"
              style={{ fontSize: "26px", fontWeight: 750, letterSpacing: "-0.03em", lineHeight: 1 }}
            >
              {s.value}
            </p>
            <p className="text-gray-400 mt-1.5" style={{ fontSize: "11.5px" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table header bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-gray-800" style={{ fontSize: "15px", fontWeight: 650 }}>
            All Academic Years
          </h2>
          <span className="text-gray-400" style={{ fontSize: "12.5px" }}>
            {years.length} total
          </span>
        </div>

        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              {["Academic Year", "Active", "Created Date", "Created By", ""].map((col) => (
                <th
                  key={col}
                  className="text-left px-6 py-3"
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: "#9ca3af",
                    textTransform: "uppercase",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {years.map((yr) => (
              <tr
                key={yr.id}
                className="hover:bg-teal-50 transition-colors cursor-pointer group"
                onClick={() => setDetailYear(yr)}
              >
                {/* Academic Year */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#f0fdfa" }}
                    >
                      <CalendarDays size={17} style={{ color: "#0d9488" }} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-gray-800" style={{ fontSize: "14px", fontWeight: 650 }}>
                        {yr.label}
                      </p>
                      <p className="text-gray-400 mt-0.5" style={{ fontSize: "12px" }}>
                        Created {yr.createdDate}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Active status */}
                <td className="px-6 py-4">
                  <StatusBadge status={yr.status} />
                </td>

                {/* Created Date */}
                <td className="px-6 py-4">
                  <span className="text-gray-500" style={{ fontSize: "13.5px" }}>
                    {yr.createdDate}
                  </span>
                </td>

                {/* Created By */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#0d9488" }}
                    >
                      <span className="text-white" style={{ fontSize: "9px", fontWeight: 700 }}>
                        {yr.createdByName.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                        {yr.createdByName}
                      </p>
                      <p className="text-gray-400" style={{ fontSize: "11px" }}>
                        {yr.createdBy}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td
                  className="px-6 py-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Activate button for any non-active year */}
                    {yr.status !== "Active" && (
                      <button
                        onClick={() => handleActivate(yr.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: "#2563eb", fontSize: "12px", fontWeight: 600 }}
                        title="Activate this year"
                      >
                        <Power size={12} strokeWidth={2.5} />
                        Activate
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setSelectedYear(yr);
                        setModalMode("edit");
                      }}
                      className="w-8 h-8 rounded-md flex items-center justify-center border border-gray-100 text-gray-400 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
                      title="Edit"
                    >
                      <Edit2 size={14} strokeWidth={2} />
                    </button>

                    {/* Details chevron */}
                    <button
                      onClick={() => setDetailYear(yr)}
                      className="w-8 h-8 rounded-md flex items-center justify-center border border-gray-100 text-gray-400 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
                      title="View details"
                    >
                      <ChevronRight size={14} strokeWidth={2} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modals & Panels ── */}

      {/* Create / Edit modal */}
      {modalMode && (
        <AcademicYearModal
          mode={modalMode}
          year={modalMode === "edit" ? selectedYear ?? undefined : undefined}
          onClose={() => { setModalMode(null); setSelectedYear(null); }}
          onSave={modalMode === "create" ? handleCreate : handleEdit}
        />
      )}


      {/* Detail side panel */}
      {detailYear && (
        <DetailPanel
          year={years.find((y) => y.id === detailYear.id) ?? detailYear}
          onClose={() => setDetailYear(null)}
          onEdit={() => {
            setSelectedYear(detailYear);
            setModalMode("edit");
          }}
          
          onActivate={() => {
            handleActivate(detailYear.id);
          }}
        />
      )}
    </div>
  );
}
