// src/app/routes.ts

import { createElement } from "react";
import { MyBatches } from "./pages/Teacher/MyBatches";
import { MyAttendance } from "./pages/Student/MyAttendance";
import { createBrowserRouter, redirect } from "react-router";
import { Shell } from "./components/layout/Shell";
import { TeacherShell } from "./components/layout/TeacherShell";
import { ManagementShell } from "./components/layout/ManagementShell";
import { StudentShell } from "./components/layout/StudentShell";
import { Dashboard } from "./pages/Dashboard";
import { AcademicYears } from "./pages/AcademicYears";
import { Batches } from "./pages/Batches";
import { Users } from "./pages/Users";
import { Teachers } from "./pages/Teachers";
import { TeacherProfilePage } from "./pages/TeacherProfilePage";
import { StudentProfilePage } from "./pages/StudentProfilePage";
import { Students } from "./pages/Students";
import { Tests } from "./pages/Tests";
import { Attendance } from "./pages/Attendance";
import { Announcements } from "./pages/Announcements";
import { StudyMaterials } from "./pages/StudyMaterials";
import { Profile } from "./pages/Profile";
import { TeacherDashboard } from "./pages/Teacher/TeacherDashboard";
import { ManagementDashboard } from "./pages/Management/ManagementDashboard";
import { StudentDashboard } from "./pages/Student/StudentDashboard";
import { StudentMarks } from "./pages/Student/StudentMarks";
import { Login } from "./pages/Login";
import { clearToken, getToken, parseToken, isTokenExpired } from "./auth";

const ROLE_ROUTES: Record<number, string> = {
  1: "/",
  2: "/management",
  3: "/teacher",
  4: "/student",
};

function requireRole(roleId: number) {
  return () => {
    const token = getToken();
    if (!token) {
      clearToken();
      return redirect("/login");
    }

    const payload = parseToken(token);
    if (!payload || isTokenExpired(payload)) {
      clearToken();
      return redirect("/login");
    }

    if (payload.role_id !== roleId) {
      return redirect(ROLE_ROUTES[payload.role_id] ?? "/login");
    }

    return null;
  };
}

function ManagementPeopleRoute() {
  return createElement(Users, { canCreateAdmin: false });
}
function StudentStudyMaterialsRoute() {
  return createElement(StudyMaterials, { canManage: false });
}
function StudentAnnouncementsRoute() {
  return createElement(Announcements, { canManage: false });
}

export const router = createBrowserRouter([
  // ── Public ──────────────────────────────────────────────────────────────────
  {
    path: "/login",
    Component: Login,
  },

  // ── Admin (role_id: 1) ───────────────────────────────────────────────────────
  {
    path: "/",
    Component: Shell,
    loader: requireRole(1),
    children: [
      { index: true, Component: Dashboard },
      { path: "academic-years", Component: AcademicYears },
      { path: "batches", Component: Batches },
      { path: "users", Component: Users },
      { path: "teachers", Component: Teachers },
      { path: "teachers/:teacherId", Component: TeacherProfilePage },
      { path: "students", Component: Students },
      { path: "students/:studentId", Component: StudentProfilePage },
      { path: "tests", Component: Tests },
      { path: "attendance", Component: Attendance },
      { path: "announcements", Component: Announcements },
      { path: "study-materials", Component: StudyMaterials },
      { path: "profile", Component: Profile },
    ],
  },

  // ── Teacher (role_id: 3) ─────────────────────────────────────────────────────
  {
    path: "/teacher",
    Component: TeacherShell,
    loader: requireRole(3),
    children: [
      { index: true, Component: TeacherDashboard },
      { path: "batches", Component: MyBatches },
      { path: "attendance", Component: Attendance },
      { path: "tests", Component: Tests },
      { path: "announcements", Component: Announcements },
      { path: "study-materials", Component: StudyMaterials },
      { path: "profile", Component: Profile },
    ],
  },

  // ── Management (role_id: 2) ──────────────────────────────────────────────────
  {
    path: "/management",
    Component: ManagementShell,
    loader: requireRole(2),
    children: [
      { index: true, Component: ManagementDashboard },
      { path: "people", Component: ManagementPeopleRoute },
      { path: "batches", Component: Batches },
      { path: "tests", Component: Tests },
      { path: "marks", Component: Tests },
      { path: "attendance", Component: Attendance },
      { path: "study-materials", Component: StudyMaterials },
      { path: "announcements", Component: Announcements },
      { path: "profile", Component: Profile },
    ],
  },

  // ── Student (role_id: 4) ─────────────────────────────────────────────────────
  {
    path: "/student",
    Component: StudentShell,
    loader: requireRole(4),
    children: [
      { index: true, Component: StudentDashboard },
      { path: "attendance", Component: MyAttendance },
      { path: "results", Component: StudentMarks },
      { path: "study-materials", Component: StudentStudyMaterialsRoute },
      { path: "announcements", Component: StudentAnnouncementsRoute },
      { path: "profile", Component: Profile },
    ],
  },
]);
