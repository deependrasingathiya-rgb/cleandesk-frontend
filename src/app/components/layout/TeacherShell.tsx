// src/app/components/layout/TeacherShell.tsx

import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";

export function TeacherShell() {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f5f6f8" }}>
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ marginLeft: "240px", minWidth: 0 }}
      >
        <Outlet />
      </main>
    </div>
  );
}