// src/app/pages/Teachers.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  fetchUnassignedTeacherUsersApi,
  fetchClassBatchesApi,
  assignTeacherApi,
  fetchTeachersApi,
  type TeacherUserOption,
  type ClassBatchOption,
  type TeacherListItem,
  type TeacherBatch,
} from "../../Lib/api/teachers";
import {
  Search,
  Plus,
  X,
  GraduationCap,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Mail,
  Phone,
  CalendarDays,
  FlaskConical,
  ExternalLink,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

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



// ─── Assign Teacher Modal ──────────────────────────────────────────────────────

function AssignTeacherModal({
  onClose,
  onAssigned,
}: {
  onClose: () => void;
  onAssigned: (teacherUser: TeacherUserOption, batches: ClassBatchOption[]) => void;
}) {
  const [teacherUsers, setTeacherUsers]       = useState<TeacherUserOption[]>([]);
  const [batches, setBatches]                 = useState<ClassBatchOption[]>([]);
  const [loadingData, setLoadingData]         = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId]   = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [submitting, setSubmitting]           = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchUnassignedTeacherUsersApi(), fetchClassBatchesApi()])
      .then(([users, batchList]) => {
        setTeacherUsers(users);
        setBatches(batchList);
      })
      .catch((e) => setLoadError(e.message ?? "Failed to load data"))
      .finally(() => setLoadingData(false));
  }, []);

  const canSubmit = Boolean(selectedUserId && selectedBatchIds.length > 0 && !submitting);

  function toggleBatch(batchId: string) {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await assignTeacherApi({
        teacher_user_id: selectedUserId,
        class_batch_ids: selectedBatchIds,
      });
      const teacherUser = teacherUsers.find((u) => u.id === selectedUserId)!;
      const assignedBatches = batches.filter((b) => selectedBatchIds.includes(b.id));
      onAssigned(teacherUser, assignedBatches);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to assign teacher");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedUserObj = teacherUsers.find((u) => u.id === selectedUserId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7"
        style={{ border: "1px solid #f3f4f6" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Assign Teacher
            </h2>
            <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
              Link a user with a Teacher role to a batch.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-6">

          {/* Select User */}
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={loadingData}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-teal-400 bg-white transition-all disabled:opacity-50"
              style={{ fontSize: "13.5px", color: selectedUserId ? "#111827" : "#9ca3af" }}
            >
              <option value="">{loadingData ? "Loading…" : teacherUsers.length === 0 ? "No unassigned teacher users" : "Choose a user with Teacher role…"}</option>
              {teacherUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.login_identifier})</option>
              ))}
            </select>
            <p className="text-gray-400 mt-1.5" style={{ fontSize: "11.5px" }}>
              Only users with the Teacher role are shown.
            </p>
          </div>

          {/* Select Batches — multi-select checklist */}
<div>
  <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
    Select Batches
  </label>
  <p className="text-gray-400 mb-2" style={{ fontSize: "11.5px" }}>
    You can select multiple batches.
  </p>
  <div
    className="border border-gray-200 rounded-xl overflow-hidden"
    style={{ maxHeight: "200px", overflowY: "auto" }}
  >
    {loadingData ? (
      <div className="px-4 py-3 text-gray-400" style={{ fontSize: "13px" }}>Loading batches…</div>
    ) : batches.map((b) => {
      const checked = selectedBatchIds.includes(b.id);
      return (
        <button
          key={b.id}
          type="button"
          onClick={() => toggleBatch(b.id)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
          style={{
            borderBottom: "1px solid #f3f4f6",
            backgroundColor: checked ? "#f0fdfa" : "white",
          }}
        >
          <div
            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all"
            style={{
              backgroundColor: checked ? "#0d9488" : "white",
              borderColor: checked ? "#0d9488" : "#d1d5db",
            }}
          >
            {checked && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize: "13.5px", color: checked ? "#0d9488" : "#374151", fontWeight: checked ? 600 : 400 }}>
            {b.name}
          </span>
        </button>
      );
    })}
  </div>
</div>

{/* Preview summary — shown when batches selected */}
{canSubmit && selectedUserObj && (
  <div
    className="flex items-start gap-3 p-3 rounded-xl"
    style={{ backgroundColor: "#f0fdfa", border: "1px solid #ccfbf1" }}
  >
    <CheckCircle2 size={15} style={{ color: "#0d9488", marginTop: "2px" }} strokeWidth={2.5} />
    <p style={{ fontSize: "12.5px", color: "#0d9488", fontWeight: 500, lineHeight: 1.5 }}>
      <span style={{ fontWeight: 700 }}>{selectedUserObj.full_name}</span> will be assigned to{" "}
      <span style={{ fontWeight: 700 }}>{selectedBatchIds.length}</span>{" "}
      batch{selectedBatchIds.length !== 1 ? "es" : ""}:{" "}
      {batches.filter((b) => selectedBatchIds.includes(b.id)).map((b) => b.name).join(", ")}
    </p>
  </div>
)}
{loadError && (
  <p className="text-red-500" style={{ fontSize: "12.5px" }}>{loadError}</p>
)}
{error && (
  <p className="text-red-500" style={{ fontSize: "12.5px" }}>{error}</p>
)}
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
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {submitting ? "Assigning…" : "Assign Teacher"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Teacher Profile Panel ─────────────────────────────────────────────────────

function TeacherProfilePanel({
  teacher,
  onClose,
  onViewFull,
}: {
  teacher: Teacher;
  onClose: () => void;
  onViewFull: () => void;
}) {
  const initials = teacher.name.split(" ").filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join("").slice(0, 2);

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
            Teacher Profile
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onViewFull}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-100 text-gray-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
              style={{ fontSize: "12px", fontWeight: 600 }}
              title="Open full profile page"
            >
              <ExternalLink size={12} strokeWidth={2.5} />
              Full Profile
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Identity */}
          <div className="px-6 py-6 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#eff6ff" }}
              >
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#2563eb" }}>{initials}</span>
              </div>
              <div>
                <p style={{ fontSize: "17px", fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
                  {teacher.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="px-2.5 py-0.5 rounded-full"
                    style={{ fontSize: "11px", fontWeight: 600, color: "#2563eb", backgroundColor: "#eff6ff" }}
                  >
                    Teacher
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-full"
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: teacher.active ? "#16a34a" : "#9ca3af",
                      backgroundColor: teacher.active ? "#f0fdf4" : "#f9fafb",
                    }}
                  >
                    {teacher.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="px-6 py-5 space-y-3 border-b border-gray-50">
            {teacher.mobile && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
                  <Phone size={13} className="text-gray-400" strokeWidth={2} />
                </div>
                <span className="text-gray-600" style={{ fontSize: "13px" }}>{teacher.mobile}</span>
              </div>
            )}
            {teacher.email && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
                  <Mail size={13} className="text-gray-400" strokeWidth={2} />
                </div>
                <span className="text-gray-600" style={{ fontSize: "13px" }}>{teacher.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
                <CalendarDays size={13} className="text-gray-400" strokeWidth={2} />
              </div>
              <span className="text-gray-600" style={{ fontSize: "13px" }}>Created {teacher.createdDate}</span>
            </div>
          </div>

          {/* Assigned Batches */}
          <div className="px-6 py-5 border-b border-gray-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                Assigned Batches
              </p>
              <span className="text-gray-400" style={{ fontSize: "12px" }}>
                {teacher.assignedBatches.length} batch{teacher.assignedBatches.length !== 1 ? "es" : ""}
              </span>
            </div>
            {teacher.assignedBatches.length === 0 ? (
              <div className="py-8 text-center rounded-xl" style={{ backgroundColor: "#f9fafb" }}>
                <BookOpen size={24} className="text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
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
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{batch.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tests — placeholder */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 uppercase" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                Tests
              </p>
            </div>
            <div className="py-8 text-center rounded-xl" style={{ backgroundColor: "#f9fafb" }}>
              <FlaskConical size={24} className="text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-gray-400" style={{ fontSize: "13px" }}>Coming soon</p>
            </div>
          </div>

        </div>

        {/* Footer — status indicator only; deactivation is managed via Users page */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div
            className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2"
            style={{
              backgroundColor: teacher.active ? "#f0fdf4" : "#f9fafb",
              color: teacher.active ? "#16a34a" : "#9ca3af",
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: teacher.active ? "#16a34a" : "#9ca3af" }} />
            {teacher.active ? "Active" : "Inactive"}
          </div>
        </div>
      </div>
    </>
  );
}


// ─── Main Component ────────────────────────────────────────────────────────────

export function Teachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers]               = useState<Teacher[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [fetchError, setFetchError]           = useState<string | null>(null);
  const [search, setSearch]                   = useState("");
  const [showAssign, setShowAssign]           = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    fetchTeachersApi()
      .then((rows) => { if (!cancelled) setTeachers(rows.map(mapApiTeacher)); })
      .catch((err: any) => { if (!cancelled) setFetchError(err.message ?? "Failed to load teachers"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Show only active teachers in the table
  const filtered = teachers.filter(
    (t) =>
      t.active &&
      (t.name.toLowerCase().includes(search.toLowerCase()) ||
       t.loginIdentifier.toLowerCase().includes(search.toLowerCase()))
  );

  function handleAssigned(teacherUser: TeacherUserOption, assignedBatches: ClassBatchOption[]) {
    const newTeacher: Teacher = {
      id: teacherUser.id,
      name: teacherUser.full_name,
      loginIdentifier: teacherUser.login_identifier,
      mobile: null,
      email: null,
      active: true,
      createdDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      assignedBatches: assignedBatches.map((b) => ({ id: b.id, name: b.name })),
    };
    setTeachers((prev) => [newTeacher, ...prev]);
  }

  const totalCount  = teachers.length;
  const activeCount = teachers.filter((t) => t.active).length;

  return (
    <div className="p-8 max-w-[1100px] mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
            Teachers
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {loading ? "Loading…" : `${totalCount} teachers · ${activeCount} active`}
          </p>
        </div>
        <button
          onClick={() => setShowAssign(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-all active:scale-95"
          style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Teacher
        </button>
      </div>

{fetchError && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600" style={{ fontSize: "13.5px" }}>
          {fetchError}
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: "Total Teachers", value: totalCount,  color: "#2563eb", bg: "#eff6ff" },
          { label: "Active",         value: activeCount, color: "#0d9488", bg: "#f0fdfa" },
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
      <div className="mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teachers by name or login identifier…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm transition-all"
            style={{ fontSize: "13.5px" }}
          />
        </div>
      </div>

      {/* ── Teachers Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              {["Teacher Name", "Assigned Batches", "Status", ""].map((col) => (
                <th
                  key={col}
                  className="text-left px-6 py-3 text-gray-400"
                  style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.05em" }}
                >
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((teacher) => {
              const initials = teacher.name.split(" ").filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join("").slice(0, 2);
              return (
                <tr
                  key={teacher.id}
                  onClick={() => setSelectedTeacher(teacher)}
                  className="border-t border-gray-50 hover:bg-teal-50 transition-colors cursor-pointer group"
                >
                  {/* Teacher Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#eff6ff" }}
                      >
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb" }}>
                          {initials}
                        </span>
                      </div>
                      <div>
                        <p
                          className="group-hover:text-teal-700 transition-colors"
                          style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827" }}
                        >
                          {teacher.name}
                        </p>
                        <p className="text-gray-400" style={{ fontSize: "12px" }}>{teacher.loginIdentifier}</p>
                      </div>
                    </div>
                  </td>

                  {/* Assigned Batches */}
                  <td className="px-6 py-4">
                    {teacher.assignedBatches.length === 0 ? (
                      <span className="text-gray-300" style={{ fontSize: "13px" }}>No batches</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.assignedBatches.slice(0, 2).map((batch) => (
                          <span
                            key={batch.id}
                            className="px-2.5 py-0.5 rounded-full"
                            style={{ fontSize: "11px", fontWeight: 600, color: "#2563eb", backgroundColor: "#eff6ff" }}
                          >
                            {batch.name}
                          </span>
                        ))}
                        {teacher.assignedBatches.length > 2 && (
                          <span
                            className="px-2.5 py-0.5 rounded-full"
                            style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", backgroundColor: "#f9fafb" }}
                          >
                            +{teacher.assignedBatches.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Active */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: teacher.active ? "#16a34a" : "#d1d5db" }}
                      />
                      <span style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: teacher.active ? "#16a34a" : "#9ca3af",
                      }}>
                        {teacher.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>

                  {/* Arrow */}
                  <td className="px-6 py-4 text-right">
                    <ChevronRight size={15} className="text-gray-300 group-hover:text-teal-400 transition-colors ml-auto" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && (
          <div className="py-16 text-center">
            <p className="text-gray-400" style={{ fontSize: "14px" }}>Loading teachers…</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <GraduationCap size={32} className="text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-gray-400" style={{ fontSize: "14px" }}>No active teachers match your search</p>
          </div>
        )}
      </div>

      {/* ── Modals & Panels ── */}
      {showAssign && (
        <AssignTeacherModal
          onClose={() => setShowAssign(false)}
          onAssigned={handleAssigned}
        />
      )}
      {selectedTeacher && (
        <TeacherProfilePanel
          teacher={teachers.find((t) => t.id === selectedTeacher.id) ?? selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          onViewFull={() => {
            setSelectedTeacher(null);
            navigate(`/teachers/${selectedTeacher.id}`);
          }}
        />
      )}
    </div>
  );
}
