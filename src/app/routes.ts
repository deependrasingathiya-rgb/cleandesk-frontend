// src/app/routes.ts(frontend)

import { createElement } from "react";
import { MyBatches } from "./pages/Teacher/MyBatches";
import { ErrorBoundary } from "./components/errors/ErrorBoundary";
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
import { FeeManagement } from "./pages/FeeManagement";
import { Profile } from "./pages/Profile";
import { TeacherDashboard } from "./pages/Teacher/TeacherDashboard";
import { ManagementDashboard } from "./pages/Management/ManagementDashboard";
import { StudentDashboard } from "./pages/Student/StudentDashboard";
import { StudentMarks } from "./pages/Student/StudentMarks";
import { MyFee } from "./pages/Student/MyFee";
import { StudentAnnouncements } from "./pages/Student/StudentAnnouncements";
import { Notifications } from "./pages/Notifications";
import { Login } from "./pages/Login";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { clearToken, getToken, parseToken, isTokenExpired, ROLE_ROUTES } from "./auth";

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


export const router = createBrowserRouter([
  // ── Public ──────────────────────────────────────────────────────────────────
  {
    path: "/login",
    Component: Login,
  },
  
  {
    path: "/privacy",
    Component: PrivacyPolicy,
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
      {
        path: "tests",
        element: createElement(ErrorBoundary, { section: "Tests", children: createElement(Tests) }),
      },
      {
        path: "attendance",
element: createElement(ErrorBoundary, { section: "Attendance", children: createElement(Attendance) }),
      },
      { path: "announcements", Component: Announcements },
      { path: "study-materials", Component: StudyMaterials },
      { path: "fee-management", Component: FeeManagement },
      { path: "notifications", Component: Notifications },
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
      {
        path: "attendance",
element: createElement(ErrorBoundary, { section: "Attendance", children: createElement(Attendance) }),
      },
      {
        path: "tests",
        element: createElement(ErrorBoundary, { section: "Tests", children: createElement(Tests) }),
      },
      { path: "announcements", Component: Announcements },
      { path: "study-materials", Component: StudyMaterials },
      { path: "notifications", Component: Notifications },
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
      { path: "students", Component: Students },
      { path: "students/:studentId", Component: StudentProfilePage },
      { path: "attendance", Component: Attendance },
      { path: "study-materials", Component: StudyMaterials },
      { path: "announcements", Component: Announcements },
      { path: "fee-management", Component: FeeManagement },
      { path: "notifications", Component: Notifications },
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
      {
        path: "attendance",
element: createElement(ErrorBoundary, { section: "My Attendance", children: createElement(MyAttendance) }),
      },
      {
        path: "results",
element: createElement(ErrorBoundary, { section: "My Results", children: createElement(StudentMarks) }),
      },
      { path: "study-materials", Component: StudentStudyMaterialsRoute },
      { path: "announcements", Component: StudentAnnouncements },
      { path: "fee", Component: MyFee },
      { path: "notifications", Component: Notifications },
      { path: "profile", Component: Profile },
    ],
  },
]);
