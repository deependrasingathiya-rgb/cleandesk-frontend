// src/app/pages/Management/ManagementDashboard.tsx
import { DashboardView } from "../DashboardView";

export function ManagementDashboard() {
  return (
    <DashboardView
      config={{
        title: "Management Dashboard",
        attendancePath: "/management/attendance",
        testsPath: "/management/tests",
        announcementsPath: "/management/announcements",
      }}
    />
  );
}