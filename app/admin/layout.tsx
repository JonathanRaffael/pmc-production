
"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* SIDEBAR */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCollapseChange={setSidebarCollapsed}
      />

      {/* MAIN CONTENT */}
      <div
        className={`
          flex min-h-screen min-w-0 flex-col
          transition-all duration-300 ease-in-out
          ${
            sidebarCollapsed
              ? "lg:pl-20"
              : "lg:pl-72"
          }
        `}
      >
        {/* HEADER */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* PAGE CONTENT */}
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-6 pt-6 sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
