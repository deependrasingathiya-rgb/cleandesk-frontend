// src/app/pages/Dashboard.tsx
import { DashboardView } from "./DashboardView";

export function Dashboard() {
  return (
    <DashboardView
      config={{
        title: "Admin Dashboard",
        attendancePath: "/attendance",
        testsPath: "/tests",
        announcementsPath: "/announcements",
      }}
    />
  );
}