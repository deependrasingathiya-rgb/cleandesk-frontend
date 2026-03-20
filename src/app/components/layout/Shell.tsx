import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, useSidebarCollapsed } from "./SidebarContext";

function ShellInner() {
  const { collapsed } = useSidebarCollapsed();
  const sidebarOffset = collapsed ? "0px" : "240px";
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f5f6f8" }}>
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ marginLeft: sidebarOffset, minWidth: 0, transition: "margin-left 0.2s ease" }}
      >
        <Outlet />
      </main>
    </div>
  );
}

export function Shell() {
  return (
    <SidebarProvider>
      <ShellInner />
    </SidebarProvider>
  );
}
