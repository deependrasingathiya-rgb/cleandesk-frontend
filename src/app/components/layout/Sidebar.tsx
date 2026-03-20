// src/app/components/layout/Sidebar.tsx

import { NavLink, useLocation } from "react-router";
import logoSrc from "../../../assets/Logo.png";
import {
  LayoutDashboard,
  CalendarDays,
  Users2,
  Users,
  GraduationCap,
  UserCheck,
  ClipboardList,
  CheckSquare,
  Megaphone,
  BookOpen,
  ChevronRight,
  Star,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { logout, getRoleLabel, getSession, ROLES, type RoleId } from "../../auth";
import { useEffect, useState } from "react";
import { fetchMyProfile, type MyProfile } from "../../../Lib/api/profile";
import { useNavigate } from "react-router";

// ─── Nav Item Type ─────────────────────────────────────────────────────────────

type NavItemDef = {
  label: string;
  icon: React.ElementType;
  path: string;
};

// ─── Nav Item Lists ────────────────────────────────────────────────────────────

const adminNavItems: NavItemDef[] = [
  { label: "Dashboard",       icon: LayoutDashboard, path: "/" },
  { label: "Academic Years",  icon: CalendarDays,    path: "/academic-years" },
  { label: "Batches",         icon: Users2,          path: "/batches" },
  { label: "Users",           icon: Users,           path: "/users" },
  { label: "Teachers",        icon: GraduationCap,   path: "/teachers" },
  { label: "Students",        icon: UserCheck,       path: "/students" },
  { label: "Tests",           icon: ClipboardList,   path: "/tests" },
  { label: "Attendance",      icon: CheckSquare,     path: "/attendance" },
  { label: "Announcements",   icon: Megaphone,       path: "/announcements" },
  { label: "Study Materials", icon: BookOpen,        path: "/study-materials" },
];

const teacherNavItems: NavItemDef[] = [
  { label: "Dashboard",       icon: LayoutDashboard, path: "/teacher" },
  { label: "My Batches",      icon: Users2,          path: "/teacher/batches" },
  { label: "Attendance",      icon: CheckSquare,     path: "/teacher/attendance" },
  { label: "Tests",           icon: ClipboardList,   path: "/teacher/tests" },
  { label: "Announcements",   icon: Megaphone,       path: "/teacher/announcements" },
  { label: "Study Materials", icon: BookOpen,        path: "/teacher/study-materials" },
];

const managementNavItems: NavItemDef[] = [
  { label: "Dashboard",      icon: LayoutDashboard, path: "/management" },
  { label: "People",         icon: Users,           path: "/management/people" },
  { label: "Batches",        icon: Users2,          path: "/management/batches" },
  { label: "Tests",          icon: ClipboardList,   path: "/management/tests" },
  { label: "Marks",          icon: Star,            path: "/management/marks" },
  { label: "Attendance",     icon: CheckSquare,     path: "/management/attendance" },
  { label: "Study Material", icon: BookOpen,        path: "/management/study-materials" },
  { label: "Announcements",  icon: Megaphone,       path: "/management/announcements" },
];

const studentNavItems: NavItemDef[] = [
  { label: "Dashboard",      icon: LayoutDashboard, path: "/student" },
  { label: "Attendance",     icon: CheckSquare,     path: "/student/attendance" },
  { label: "Results",        icon: Star,            path: "/student/results" },
  { label: "Study Material", icon: BookOpen,        path: "/student/study-materials" },
  { label: "Announcements",  icon: Megaphone,       path: "/student/announcements" },
];

// ─── Role Type ─────────────────────────────────────────────────────────────────

type RoleContext = "admin" | "teacher" | "management" | "student";

function detectRole(pathname: string): RoleContext {
  if (pathname === "/teacher" || pathname.startsWith("/teacher/")) return "teacher";
  if (pathname === "/management" || pathname.startsWith("/management/")) return "management";
  if (pathname === "/student" || pathname.startsWith("/student/")) return "student";
  return "admin";
}

function getRoleContextFromRoleId(roleId?: RoleId): RoleContext | null {
  if (roleId === ROLES.ADMIN) return "admin";
  if (roleId === ROLES.MANAGEMENT) return "management";
  if (roleId === ROLES.TEACHER) return "teacher";
  if (roleId === ROLES.STUDENT) return "student";
  return null;
}

// ─── Role Config ───────────────────────────────────────────────────────────────

type RoleConfigEntry = {
  navItems: NavItemDef[];
  mainEnd: number;
  secondaryEnd: number;
  menuLabel: string;
  accountLabel: string;
  portalLabel: string;
  roleColor: string;
  roleBg: string;
};

const ROLE_CONFIG: {
  admin: RoleConfigEntry;
  teacher: RoleConfigEntry;
  management: RoleConfigEntry;
  student: RoleConfigEntry;
} = {
  admin: {
    navItems: adminNavItems,
    mainEnd: 8,
    secondaryEnd: 10,
    menuLabel: "Main Menu",
    accountLabel: "Resources",
    portalLabel: "Institute Portal",
    roleColor: "#7c3aed",
    roleBg: "#f5f3ff",
  },
  teacher: {
    navItems: teacherNavItems,
    mainEnd: 6,
    secondaryEnd: 6,
    menuLabel: "My Menu",
    accountLabel: "Account",
    portalLabel: "Teacher Portal",
    roleColor: "#0d9488",
    roleBg: "#f0fdfa",
  },
  management: {
    navItems: managementNavItems,
    mainEnd: 8,
    secondaryEnd: 8,
    menuLabel: "Management",
    accountLabel: "Account",
    portalLabel: "Management Portal",
    roleColor: "#2563eb",
    roleBg: "#eff6ff",
  },
  student: {
    navItems: studentNavItems,
    mainEnd: 5,
    secondaryEnd: 5,
    menuLabel: "My Portal",
    accountLabel: "Account",
    portalLabel: "Student Portal",
    roleColor: "#d97706",
    roleBg: "#fffbeb",
  },
};

// ─── NavItem Component ─────────────────────────────────────────────────────────

function NavItem({
  label,
  icon: Icon,
  path,
  isActive,
}: {
  label: string;
  icon: React.ElementType;
  path: string;
  isActive: boolean;
}) {
  return (
    <li>
      <NavLink
        to={path}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 group ${
          isActive
            ? "bg-teal-50 text-teal-700"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
        }`}
        style={{ textDecoration: "none" }}
      >
        <Icon
          size={18}
          strokeWidth={isActive ? 2.2 : 1.8}
          className={isActive ? "text-teal-600" : "text-gray-400 group-hover:text-gray-600"}
        />
        <span style={{ fontSize: "13.5px", fontWeight: isActive ? 600 : 450 }}>
          {label}
        </span>
        {isActive && (
          <div
            className="ml-auto w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "#0d9488" }}
          />
        )}
      </NavLink>
    </li>
  );
}

// ─── Sidebar Component ─────────────────────────────────────────────────────────

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const session = getSession();
  const sessionRoleId = session?.payload.role_id;
  const profileRoleId = (profile as MyProfile & { role_id?: RoleId } | null)?.role_id;
  const role =
    getRoleContextFromRoleId(profileRoleId ?? sessionRoleId) ??
    detectRole(location.pathname);
  const config = ROLE_CONFIG[role];
  const roleBadge =
    profile?.role_label?.trim() ||
    profile?.role_name?.trim() ||
    profile?.role?.trim() ||
    (sessionRoleId ? getRoleLabel(sessionRoleId) : "User");

  // Compute initials and display name from live profile, fall back gracefully
  const displayName = profile?.full_name ?? "Loading…";
  const initials = profile
    ? profile.full_name.split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).join("").slice(0, 2)
    : "…";

  useEffect(() => {
    fetchMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  const profilePath = `${config.navItems[0]?.path === "/" ? "" : config.navItems[0]?.path}/profile`;

  const mainItems = config.navItems.slice(0, config.mainEnd);
  const secondaryItems = config.navItems.slice(config.mainEnd, config.secondaryEnd);

  const isActive = (path: string): boolean => {
    const exactPaths = ["/", "/teacher", "/management", "/student"];
    if (exactPaths.includes(path)) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    await logout();
  }

  return (
    <aside
      style={{ width: "240px", minWidth: "240px" }}
      className="h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-30"
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ width: "42px", height: "42px" }}
          >
            <img
              src={logoSrc}
              alt="CleanDesk"
              style={{ width: "42px", height: "42px", objectFit: "contain" }}
            />
          </div>
          <div>
            <p
              className="text-gray-900 leading-tight"
              style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.01em" }}
            >
              CleanDesk
            </p>
            <p className="text-gray-400" style={{ fontSize: "11px" }}>
              {config.portalLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p
          className="text-gray-400 uppercase px-3 mb-3"
          style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600 }}
        >
          {config.menuLabel}
        </p>
        <ul className="space-y-0.5">
          {mainItems.map(({ label, icon, path }) => (
            <NavItem
              key={path}
              label={label}
              icon={icon}
              path={path}
              isActive={isActive(path)}
            />
          ))}
        </ul>

        <p
          className="text-gray-400 uppercase px-3 mt-6 mb-3"
          style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600 }}
        >
          {config.accountLabel}
        </p>
        <ul className="space-y-0.5">
          {secondaryItems.map(({ label, icon, path }) => (
            <NavItem
              key={path}
              label={label}
              icon={icon}
              path={path}
              isActive={isActive(path)}
            />
          ))}
        </ul>
      </nav>

      {/* Profile Card */}
      <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-2">
        <div
          onClick={() => navigate(profilePath)}
          className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: config.roleColor }}
          >
            <span className="text-white" style={{ fontSize: "12px", fontWeight: 700 }}>
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-gray-800 truncate"
              style={{ fontSize: "13px", fontWeight: 600 }}
            >
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  backgroundColor: config.roleBg,
                  color: config.roleColor,
                }}
              >
                {roleBadge}
              </span>
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600" />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ fontSize: "13px", fontWeight: 600 }}
        >
          <LogOut size={15} />
          {isLoggingOut ? "Signing out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}
