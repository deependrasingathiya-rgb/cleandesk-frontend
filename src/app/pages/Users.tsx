// src/app/pages/Users.tsx

import { useState, useEffect, type ElementType } from "react";
import {
  Search,
  Plus,
  Shield,
  UserCheck,
  GraduationCap,
  Users as UsersIcon,
  X,
  CalendarDays,
  AlertTriangle,
  ChevronRight,
  UserX,
  Copy,
  Check,
} from "lucide-react";
import { getSession, ROLES, type RoleId } from "../auth";
import { createUserApi, fetchUsersApi, deactivateUserApi, type CreatedUser, type UserListItem } from "../../Lib/api/users";

// ─── Types ─────────────────────────────────────────────────────────────────────

type UserRole = "Admin" | "Management" | "Teacher" | "Student";

type User = {
  id: string;
  loginIdentifier: string;
  name: string | null;
  role: UserRole;
  active: boolean;
  createdDate: string;
};

const ROLE_ID_TO_LABEL: Record<number, UserRole> = {
  1: "Admin",
  2: "Management",
  3: "Teacher",
  4: "Student",
};

function mapApiUser(u: UserListItem): User {
  return {
    id: u.id,
    loginIdentifier: u.login_identifier,
    name: u.full_name ?? null,
    role: ROLE_ID_TO_LABEL[u.role_id] ?? "Student",
    active: u.is_active,
    createdDate: new Date(u.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}

// ─── Role Config ───────────────────────────────────────────────────────────────

const roleConfig: Record<UserRole, { color: string; bg: string; icon: ElementType }> = {
  "Admin": { color: "#7c3aed", bg: "#f5f3ff", icon: Shield      },
  "Management":       { color: "#0d9488", bg: "#f0fdfa", icon: UserCheck    },
  "Teacher":     { color: "#2563eb", bg: "#eff6ff", icon: GraduationCap},
  "Student":     { color: "#d97706", bg: "#fffbeb", icon: GraduationCap},
};

const ALL_ROLES: UserRole[] = ["Admin", "Management", "Teacher", "Student"];

// ─── Create User Modal ─────────────────────────────────────────────────────────

// Role label → numeric ID map (must match backend ROLES)
const ROLE_ID_MAP: Record<UserRole, RoleId> = {
  Admin:      ROLES.ADMIN,
  Management: ROLES.MANAGEMENT,
  Teacher:    ROLES.TEACHER,
  Student:    ROLES.STUDENT,
};

function CreateUserModal({
  onClose,
  onCreated,
  creatorRoleId,
}: {
  onClose: () => void;
  onCreated: (user: User) => void;
  creatorRoleId: RoleId;
}) {
  const [fullName, setFullName]       = useState("");
  const [role, setRole]               = useState<UserRole>("Teacher");
  const [mobile, setMobile]           = useState("");
  const [email, setEmail]             = useState("");
  const [address, setAddress]         = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [created, setCreated]         = useState<CreatedUser | null>(null);
  const [copied, setCopied]           = useState(false);

  const isStaff = role === "Teacher" || role === "Management";

  // Derive available roles from the creator's actual role — mirrors backend policy
  const availableRoles: UserRole[] = creatorRoleId === ROLES.ADMIN
    ? ["Management", "Teacher", "Student"]
    : ["Teacher", "Student"];

  const canSubmit =
    fullName.trim().length > 0 &&
    !submitting &&
    (!isStaff || (mobile.trim().length === 10 && /^\d{10}$/.test(mobile.trim()))) &&
    (!isStaff || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createUserApi({
        full_name: fullName.trim(),
        role: ROLE_ID_MAP[role],
        ...(mobile.trim()  && { mobile:  mobile.trim() }),
        ...(email.trim()   && { email:   email.trim() }),
        ...(address.trim() && { address: address.trim() }),
      });
      setCreated(result);
      onCreated({
        id: result.id,
        loginIdentifier: result.login_identifier,
        name: fullName.trim(),
        role,
        active: true,
        createdDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      });
    } catch (e: any) {
      setError(e.message ?? "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Success state: show credentials to admin ──────────────────────────────
  if (created) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7" style={{ border: "1px solid #f3f4f6" }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                User Created
              </h2>
              <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
                Share these credentials with the user. The password cannot be retrieved again.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { label: "Login Identifier", value: created.login_identifier },
              { label: "Temporary Password", value: created.temporary_password },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-gray-400 mb-1.5" style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {label}
                </p>
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-gray-100" style={{ backgroundColor: "#f9fafb" }}>
                  <span className="text-gray-800 font-mono" style={{ fontSize: "13.5px" }}>{value}</span>
                  <button
                    onClick={() => handleCopy(`${created.login_identifier}\n${created.temporary_password}`)}
                    className="text-gray-400 hover:text-teal-600 transition-colors flex-shrink-0"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Creation form ─────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7"
        style={{ border: "1px solid #f3f4f6" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Create User
            </h2>
            <p className="text-gray-400 mt-1" style={{ fontSize: "13px" }}>
              Add a new system user with login access.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sneha Patel"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
              style={{ fontSize: "13.5px" }}
            />
            <p className="text-gray-400 mt-1.5" style={{ fontSize: "11.5px" }}>
              A login identifier will be auto-generated by the system.
            </p>
          </div>

          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableRoles.map((r) => {
                const rc = roleConfig[r];
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left"
                    style={{
                      borderColor: isSelected ? rc.color : "#f3f4f6",
                      backgroundColor: isSelected ? rc.bg : "white",
                    }}
                  >
                    <rc.icon size={14} strokeWidth={2} style={{ color: isSelected ? rc.color : "#9ca3af", flexShrink: 0 }} />
                    <span style={{ fontSize: "12.5px", fontWeight: 600, color: isSelected ? rc.color : "#6b7280" }}>
                      {r}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
{/* Staff-only fields: mobile, email, address */}
          {isStaff && (
            <>
              <div>
                <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Mobile Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
                  style={{ fontSize: "13.5px" }}
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sneha.patel@gmail.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
                  style={{ fontSize: "13.5px" }}
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1.5" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Current Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 12, Shivaji Nagar, Nagpur"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all"
                  style={{ fontSize: "13.5px" }}
                />
              </div>
            </>
          )}

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
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
          >
            {submitting ? "Creating…" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Deactivate Confirm Modal ──────────────────────────────────────────────────

function DeactivateModal({ user, onClose, onConfirm }: {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7"
        style={{ border: "1px solid #f3f4f6" }}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fef2f2" }}>
            <AlertTriangle size={18} style={{ color: "#dc2626" }} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700 }}>
              Deactivate User?
            </h2>
            <p className="text-gray-500 mt-1" style={{ fontSize: "13px", lineHeight: 1.5 }}>
              <span className="font-semibold text-gray-700">{user.loginIdentifier}</span> will lose access to the system. This can be reversed later.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ fontSize: "13.5px", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 py-2.5 rounded-xl text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: "#dc2626", fontSize: "13.5px", fontWeight: 600 }}
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Profile Panel ────────────────────────────────────────────────────────

function UserProfilePanel({ user, onClose, onDeactivate, currentUserId }: {
  user: User;
  onClose: () => void;
  onDeactivate: (id: string) => void;
  currentUserId?: string;
}) {
  const [showDeactivate, setShowDeactivate] = useState(false);
  const rc = roleConfig[user.role];
  const RoleIcon = rc.icon;
  const isCurrentUser = currentUserId === user.id;
  const initials = user.name
                ? user.name.split(" ").map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 2)
                : user.loginIdentifier.split("@")[0].split(".").map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 2);

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
            User Profile
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
          <div className="px-6 py-6 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: rc.bg }}
              >
                <span style={{ fontSize: "20px", fontWeight: 700, color: rc.color }}>
                  {initials}
                </span>
              </div>
              <div>
                <p className="text-gray-900" style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                  {user.name ?? user.loginIdentifier.split("@")[0].split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")}
                </p>
                <p className="text-gray-400 mt-0.5" style={{ fontSize: "12.5px" }}>
                  {user.loginIdentifier}
                </p>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="px-6 py-5 space-y-4">

            {/* Login Identifier */}
            <div>
              <p className="text-gray-400 uppercase mb-2" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                Login Identifier
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#f9fafb", border: "1px solid #f3f4f6" }}>
                <UsersIcon size={14} className="text-gray-400" strokeWidth={2} />
                <span className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 500 }}>
                  {user.loginIdentifier}
                </span>
              </div>
            </div>

            {/* Role */}
            <div>
              <p className="text-gray-400 uppercase mb-2" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                Role
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: rc.bg, border: `1px solid ${rc.color}22` }}>
                <RoleIcon size={14} strokeWidth={2} style={{ color: rc.color }} />
                <span style={{ fontSize: "13.5px", fontWeight: 600, color: rc.color }}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Active Status */}
            <div>
              <p className="text-gray-400 uppercase mb-2" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                Active Status
              </p>
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  backgroundColor: user.active ? "#f0fdf4" : "#f9fafb",
                  border: `1px solid ${user.active ? "#bbf7d0" : "#f3f4f6"}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: user.active ? "#16a34a" : "#9ca3af" }}
                />
                <span style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: user.active ? "#16a34a" : "#9ca3af",
                }}>
                  {user.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Created Date */}
            <div>
              <p className="text-gray-400 uppercase mb-2" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}>
                Created Date
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#f9fafb", border: "1px solid #f3f4f6" }}>
                <CalendarDays size={14} className="text-gray-400" strokeWidth={2} />
                <span className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 500 }}>
                  {user.createdDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — Deactivate action */}
        <div className="px-6 py-4 border-t border-gray-100">
          {user.active && !isCurrentUser ? (
            <button
              onClick={() => setShowDeactivate(true)}
              className="w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all hover:bg-red-50"
              style={{ borderColor: "#fecaca", color: "#dc2626", fontSize: "13.5px", fontWeight: 600 }}
            >
              <UserX size={15} strokeWidth={2.5} />
              Deactivate User
            </button>
          ) : !user.active ? (
            <div
              className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2"
              style={{ backgroundColor: "#f9fafb", color: "#9ca3af", fontSize: "13.5px", fontWeight: 600 }}
            >
              <UserX size={15} strokeWidth={2} />
              Already Inactive
            </div>
          ) : null}
        </div>
      </div>

      {showDeactivate && (
        <DeactivateModal
          user={user}
          onClose={() => setShowDeactivate(false)}
          onConfirm={() => {
            onDeactivate(user.id);
            onClose();
          }}
        />
      )}
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function Users() {
  const session = getSession();
  const creatorRoleId = (session?.payload.role_id ?? ROLES.MANAGEMENT) as RoleId;

  const [users, setUsers]               = useState<User[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState<string>("All");
  const [showCreate, setShowCreate]     = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage]   = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    fetchUsersApi()
      .then((rows) => {
        if (!cancelled) setUsers(rows.map(mapApiUser));
      })
      .catch((err: any) => {
        if (!cancelled) setFetchError(err.message ?? "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const PAGE_SIZE = 25;

  const filtered = users.filter((u) => {
    const matchRole   = roleFilter === "All" || u.role === roleFilter;
    const matchSearch =
      u.loginIdentifier.toLowerCase().includes(search.toLowerCase()) ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp page in case filters reduce the result count below current page
  const safePage    = Math.min(currentPage, totalPages);
  const pageSlice   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);


  function handleFilterChange(fn: () => void) {
    fn();
    setCurrentPage(1);
  }

  function handleCreated(newUser: User) {
    setUsers((prev) => [newUser, ...prev]);
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivateUserApi(id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: false } : u));
    } catch (err: any) {
      // Surface error without crashing — panel stays open, user sees nothing changed
      console.error("Deactivate failed:", err.message);
    }
  }

  const activeCount   = users.filter((u) => u.active).length;
  const inactiveCount = users.filter((u) => !u.active).length;

  return (
    <div className="p-8 max-w-[1100px] mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Users
          </h1>
          <p className="text-gray-400 mt-1" style={{ fontSize: "14px" }}>
            {loading ? "Loading…" : `${users.length} total system users`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-all active:scale-95"
          style={{ backgroundColor: "#0d9488", fontSize: "13.5px", fontWeight: 600 }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Create User
        </button>
      </div>

{/* ── Fetch Error ── */}
      {fetchError && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600" style={{ fontSize: "13.5px" }}>
          {fetchError}
        </div>
      )}


      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Admins",      value: users.filter((u) => u.active && u.role === "Admin").length,      color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Management",  value: users.filter((u) => u.active && u.role === "Management").length, color: "#0d9488", bg: "#f0fdfa" },
          { label: "Teachers",    value: users.filter((u) => u.active && u.role === "Teacher").length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Students",    value: users.filter((u) => u.active && u.role === "Student").length, color: "#d97706", bg: "#fffbeb" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>{s.label}</p>
            <p style={{ fontSize: "22px", fontWeight: 750, letterSpacing: "-0.02em", color: s.color, lineHeight: 1.2, marginTop: "4px" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Search & Role Filter ── */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
            placeholder="Search by login identifier…"
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-300 shadow-sm transition-all"
            style={{ fontSize: "13.5px" }}
          />
        </div>
        <div className="flex gap-1.5">
          {["All", ...ALL_ROLES].map((r) => (
            <button
              key={r}
              onClick={() => handleFilterChange(() => setRoleFilter(r))}
              className="px-3.5 py-2 rounded-xl border transition-all"
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                borderColor: roleFilter === r ? "#0d9488" : "#f3f4f6",
                backgroundColor: roleFilter === r ? "#f0fdfa" : "white",
                color: roleFilter === r ? "#0d9488" : "#9ca3af",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              {["Login Identifier", "Name", "Role", "Status", "Created Date", ""].map((col) => (
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
            {pageSlice.map((user) => {
              const rc = roleConfig[user.role];
              const RoleIcon = rc.icon;
              const initials = user.name
    ? user.name.split(" ").map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 2)
    : user.loginIdentifier.split("@")[0].split(".").map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 2);

              return (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="border-t border-gray-50 hover:bg-teal-50 transition-colors cursor-pointer group"
                >
                  {/* Login Identifier */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: rc.bg }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: 700, color: rc.color }}>
                          {initials}
                        </span>
                      </div>
                      <span
                        className="text-gray-700 group-hover:text-teal-700 transition-colors"
                        style={{ fontSize: "13.5px", fontWeight: 500 }}
                      >
                        {user.loginIdentifier}
                      </span>
                    </div>
                  </td>

                  {/* Name */}
                  <td className="px-6 py-4">
                    <span className="text-gray-700" style={{ fontSize: "13.5px", fontWeight: 500 }}>
                      {user.name ?? <span className="text-gray-300">—</span>}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <RoleIcon size={13} strokeWidth={2} style={{ color: rc.color }} />
                      <span
                        className="px-2.5 py-0.5 rounded-full"
                        style={{ fontSize: "11.5px", fontWeight: 600, color: rc.color, backgroundColor: rc.bg }}
                      >
                        {user.role}
                      </span>
                    </div>
                  </td>

                  {/* Active */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: user.active ? "#16a34a" : "#d1d5db" }}
                      />
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: user.active ? "#16a34a" : "#9ca3af",
                        }}
                      >
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>

                  {/* Created Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <CalendarDays size={13} strokeWidth={1.8} />
                      <span style={{ fontSize: "13px" }}>{user.createdDate}</span>
                    </div>
                  </td>

                  {/* Arrow */}
                  <td className="px-6 py-4 text-right">
                    <ChevronRight
                      size={15}
                      className="text-gray-300 group-hover:text-teal-400 transition-colors ml-auto"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

{/* ── Pagination footer ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <span className="text-gray-400" style={{ fontSize: "12.5px" }}>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-100 text-gray-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                style={{ fontSize: "12.5px", fontWeight: 600 }}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "…" ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-300" style={{ fontSize: "12.5px" }}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className="w-8 h-8 rounded-lg border transition-all"
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 600,
                        borderColor: safePage === p ? "#0d9488" : "#f3f4f6",
                        backgroundColor: safePage === p ? "#f0fdfa" : "white",
                        color: safePage === p ? "#0d9488" : "#6b7280",
                      }}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-100 text-gray-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                style={{ fontSize: "12.5px", fontWeight: 600 }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="py-16 text-center">
            <p className="text-gray-400" style={{ fontSize: "14px" }}>Loading users…</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <UsersIcon size={32} className="text-gray-200 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-gray-400" style={{ fontSize: "14px" }}>No users match your search</p>
          </div>
        )}
      </div>

      {/* ── Active / Inactive Footer Summary ── */}
      <div className="flex items-center gap-6 mt-4 px-1">
        <span className="text-gray-400" style={{ fontSize: "12.5px" }}>
          <span style={{ fontWeight: 600, color: "#16a34a" }}>{activeCount}</span> active
        </span>
        <span className="text-gray-400" style={{ fontSize: "12.5px" }}>
          <span style={{ fontWeight: 600, color: "#9ca3af" }}>{inactiveCount}</span> inactive
        </span>
      </div>

      {/* ── Modals & Panels ── */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
          creatorRoleId={creatorRoleId}
        />
      )}
      {selectedUser && (
        <UserProfilePanel
          user={users.find((u) => u.id === selectedUser.id) ?? selectedUser}
          onClose={() => setSelectedUser(null)}
          onDeactivate={handleDeactivate}
          currentUserId={session?.payload.user_id}
        />
      )}
    </div>
  );
}
