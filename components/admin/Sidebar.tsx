
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

// =====================================================
// TYPES
// =====================================================

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
};

type MenuItem = {
  name: string;
  href: string;
  icon: ReactNode;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

type Workspace = "pmc" | "molding";

// =====================================================
// ICON HELPER
// =====================================================

const icon = (children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    {children}
  </svg>
);

// =====================================================
// WORKSPACE ICONS
// =====================================================

const PmcIcon = () =>
  icon(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  );

const FactoryIcon = () =>
  icon(
    <>
      <path d="M3 21h18" />
      <path d="M5 21V8l6 3V8l6 3V5h2v16" />
      <path d="M9 17h.01" />
      <path d="M14 17h.01" />
    </>
  );

// =====================================================
// PMC MENU
// =====================================================

const pmcGroups: MenuGroup[] = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/admin",
        icon: PmcIcon(),
      },
    ],
  },
  {
    title: "Production",
    items: [
      {
        name: "Production",
        href: "/admin/production",
        icon: icon(
          <>
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="m7 15 4-5 3 3 5-7" />
          </>
        ),
      },
      {
        name: "Production History",
        href: "/admin/history",
        icon: icon(
          <>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l3 2" />
          </>
        ),
      },
    ],
  },
  {
    title: "Master Data",
    items: [
      {
        name: "Products",
        href: "/admin/products",
        icon: icon(
          <>
            <path d="m21 8-9-5-9 5 9 5 9-5Z" />
            <path d="m3 12 9 5 9-5" />
            <path d="m3 16 9 5 9-5" />
          </>
        ),
      },
      {
        name: "Areas",
        href: "/admin/areas",
        icon: icon(
          <>
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-5h6v5" />
            <path d="M9 9h.01" />
            <path d="M15 9h.01" />
            <path d="M9 12h.01" />
            <path d="M15 12h.01" />
          </>
        ),
      },
      {
        name: "Shifts",
        href: "/admin/shifts",
        icon: icon(
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </>
        ),
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        name: "Audit Log",
        href: "/admin/audit",
        icon: icon(
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4l3 2" />
            <path d="M3 12H1" />
            <path d="M23 12h-2" />
          </>
        ),
      },
    ],
  },
];

// =====================================================
// MOLDING MENU
// =====================================================

const moldingGroups: MenuGroup[] = [
  {
    title: "Overview",
    items: [
      {
        name: "Molding Dashboard",
        href: "/admin/molding",
        icon: PmcIcon(),
      },
    ],
  },
  {
    title: "Master Data",
    items: [
      {
        name: "Molding Product",
        href: "/admin/molding-products",
        icon: icon(
          <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18" />
            <path d="M8 4v5" />
            <path d="M16 4v5" />
            <path d="M7 13h4" />
            <path d="M13 13h4" />
            <path d="M7 17h4" />
            <path d="M13 17h4" />
          </>
        ),
      },
    ],
  },
  {
    title: "Order Management",
    items: [
      {
        name: "Purchase Orders",
        href: "/admin/molding-po",
        icon: icon(
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
            <path d="M8 13h8" />
            <path d="M8 17h8" />
          </>
        ),
      },
    ],
  },
  {
    title: "Production",
    items: [
      {
        name: "Production Planning",
        href: "/admin/molding-production-target",
        icon: icon(
          <>
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="M8 16v-5" />
            <path d="M12 16V8" />
            <path d="M16 16v-3" />
            <path d="M20 16V6" />
          </>
        ),
      },
      {
        name: "Molding Production",
        href: "/admin/molding-production",
        icon: icon(
          <>
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-6h6v6" />
          </>
        ),
      },
      {
        name: "PO Allocation",
        href: "/admin/molding-allocation",
        icon: icon(
          <>
            <path d="M8 6h13" />
            <path d="M8 12h13" />
            <path d="M8 18h13" />
            <path d="M3 6h.01" />
            <path d="M3 12h.01" />
            <path d="M3 18h.01" />
          </>
        ),
      },
    ],
  },
];

// =====================================================
// SIDEBAR COMPONENT
// =====================================================

export default function Sidebar({
  open,
  onClose,
  onCollapseChange,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ===================================================
  // DETECT WORKSPACE FROM URL
  // ===================================================

  const isMolding =
    pathname === "/admin/molding" ||
    pathname.startsWith("/admin/molding-");

  const workspace: Workspace = isMolding ? "molding" : "pmc";

  const activeWorkspace = workspace === "molding"
    ? {
        name: "Molding Management",
        description: "Production Workspace",
        color: "violet",
        href: "/admin/molding",
      }
    : {
        name: "PMC Production",
        description: "Monitoring Workspace",
        color: "blue",
        href: "/admin",
      };

  const menuGroups = workspace === "molding"
    ? moldingGroups
    : pmcGroups;

  const colorClasses = workspace === "molding"
    ? {
        active: "bg-violet-50 text-violet-700",
        icon: "bg-violet-100 text-violet-600",
        indicator: "bg-violet-600",
        hover: "hover:bg-violet-50",
        switcher: "bg-violet-50 text-violet-700",
        avatar: "bg-violet-100 text-violet-700",
      }
    : {
        active: "bg-blue-50 text-blue-700",
        icon: "bg-blue-100 text-blue-600",
        indicator: "bg-blue-600",
        hover: "hover:bg-blue-50",
        switcher: "bg-blue-50 text-blue-700",
        avatar: "bg-blue-100 text-blue-700",
      };

  // ===================================================
  // ACTIVE MENU
  // ===================================================

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/admin/molding") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // ===================================================
  // COLLAPSE
  // ===================================================

  function toggleCollapse() {
    const next = !collapsed;

    setCollapsed(next);
    onCollapseChange?.(next);
    setWorkspaceMenuOpen(false);
  }

  // ===================================================
  // WORKSPACE SWITCH
  // ===================================================

  function switchWorkspace(target: Workspace) {
    setWorkspaceMenuOpen(false);
    onClose();

    router.push(
      target === "molding" ? "/admin/molding" : "/admin"
    );
  }

  // ===================================================
  // LOGOUT
  // ===================================================

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout gagal");
      }

      setLogoutOpen(false);
      onClose();

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      {/* MOBILE OVERLAY */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="
            fixed inset-0 z-[90]
            bg-slate-950/30 backdrop-blur-[2px]
            lg:hidden
          "
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[95]
          flex flex-col
          border-r border-slate-200/80
          bg-white
          shadow-xl shadow-slate-300/10
          transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:shadow-none
          ${collapsed ? "w-20" : "w-72"}
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div
          className={`
            flex h-16 shrink-0 items-center
            border-b border-slate-100
            ${collapsed ? "justify-center px-2" : "px-5"}
          `}
        >
          <Link
            href="/admin"
            onClick={onClose}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="
              flex h-10 w-10 shrink-0 items-center
              justify-center rounded-xl
              bg-blue-600 text-white
              shadow-sm shadow-blue-600/20
            ">
              {icon(
                <>
                  <path d="M3 21h18" />
                  <path d="M5 21V7l7-4 7 4v14" />
                  <path d="M9 21v-6h6v6" />
                </>
              )}
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-bold tracking-tight text-slate-900">
                  PMC Production
                </h1>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  Monitoring System
                </p>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="
                ml-auto flex h-8 w-8 items-center
                justify-center rounded-lg
                text-slate-400 hover:bg-slate-100
                hover:text-slate-700 lg:hidden
              "
            >
              {icon(
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              )}
            </button>
          )}
        </div>

        {/* WORKSPACE SWITCHER */}
        <div className={`
          shrink-0 border-b border-slate-100 p-3
          ${collapsed ? "px-2" : ""}
        `}>
          {!collapsed && (
            <p className="
              mb-2 px-2 text-[10px] font-bold
              uppercase tracking-[0.12em] text-slate-400
            ">
              Workspace
            </p>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              aria-expanded={workspaceMenuOpen}
              aria-label="Switch workspace"
              title={collapsed ? activeWorkspace.name : undefined}
              className={`
                flex w-full items-center gap-3
                rounded-xl p-2.5 text-left
                transition-all duration-200
                ${collapsed ? "justify-center" : ""}
                ${colorClasses.switcher}
                hover:brightness-[0.98]
              `}
            >
              <span className="
                flex h-9 w-9 shrink-0 items-center
                justify-center rounded-lg bg-white
                shadow-sm
              ">
                {workspace === "molding" ? (
                  <span className="text-violet-600">
                    <FactoryIcon />
                  </span>
                ) : (
                  <span className="text-blue-600">
                    <PmcIcon />
                  </span>
                )}
              </span>

              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold">
                      {activeWorkspace.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] opacity-70">
                      {activeWorkspace.description}
                    </span>
                  </span>

                  <span className="shrink-0 opacity-70">
                    {icon(
                      <>
                        <path d="m7 10 5 5 5-5" />
                      </>
                    )}
                  </span>
                </>
              )}
            </button>

            {/* WORKSPACE DROPDOWN */}
            {workspaceMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close workspace menu"
                  onClick={() => setWorkspaceMenuOpen(false)}
                  className="fixed inset-0 z-[100] cursor-default"
                />

                <div className={`
                  absolute top-full z-[110] mt-2
                  w-64 rounded-xl border border-slate-200
                  bg-white p-2 shadow-xl shadow-slate-900/10
                  ${collapsed ? "left-full ml-2" : "left-0"}
                `}>
                  <p className="
                    px-3 py-2 text-[10px] font-bold
                    uppercase tracking-wider text-slate-400
                  ">
                    Switch Workspace
                  </p>

                  <button
                    type="button"
                    onClick={() => switchWorkspace("pmc")}
                    className={`
                      flex w-full items-center gap-3
                      rounded-lg p-3 text-left transition
                      ${workspace === "pmc"
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"}
                    `}
                  >
                    <span className="
                      flex h-9 w-9 items-center justify-center
                      rounded-lg bg-blue-100 text-blue-600
                    ">
                      <PmcIcon />
                    </span>

                    <span className="flex-1">
                      <span className="block text-xs font-semibold">
                        PMC Production
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-400">
                        Monitoring System
                      </span>
                    </span>

                    {workspace === "pmc" && (
                      <span className="text-blue-600">
                        {icon(<path d="m5 12 4 4L19 6" />)}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => switchWorkspace("molding")}
                    className={`
                      mt-1 flex w-full items-center gap-3
                      rounded-lg p-3 text-left transition
                      ${workspace === "molding"
                        ? "bg-violet-50 text-violet-700"
                        : "text-slate-600 hover:bg-slate-50"}
                    `}
                  >
                    <span className="
                      flex h-9 w-9 items-center justify-center
                      rounded-lg bg-violet-100 text-violet-600
                    ">
                      <FactoryIcon />
                    </span>

                    <span className="flex-1">
                      <span className="block text-xs font-semibold">
                        Molding Management
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-400">
                        Production Workspace
                      </span>
                    </span>

                    {workspace === "molding" && (
                      <span className="text-violet-600">
                        {icon(<path d="m5 12 4 4L19 6" />)}
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* NAVIGATION */}
        <nav
          aria-label={`${activeWorkspace.name} navigation`}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5"
        >
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-7">
              {!collapsed && (
                <div className="mb-2 px-3">
                  <p className="
                    text-[10px] font-bold uppercase
                    tracking-[0.12em] text-slate-400
                  ">
                    {group.title}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        onClose();
                        setWorkspaceMenuOpen(false);
                      }}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.name : undefined}
                      className={`
                        group relative flex items-center gap-3
                        rounded-xl px-2.5 py-2.5
                        text-sm font-medium
                        transition-all duration-200
                        ${collapsed ? "justify-center" : ""}
                        ${
                          active
                            ? colorClasses.active
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                    >
                      {active && (
                        <span className={`
                          absolute left-0 top-1/2 h-6 w-1
                          -translate-y-1/2 rounded-r-full
                          ${colorClasses.indicator}
                        `} />
                      )}

                      <span className={`
                        flex h-9 w-9 shrink-0 items-center
                        justify-center rounded-lg
                        transition-colors
                        ${
                          active
                            ? colorClasses.icon
                            : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
                        }
                      `}>
                        {item.icon}
                      </span>

                      {!collapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate">
                            {item.name}
                          </span>

                          {active && (
                            <span className="shrink-0">
                              {icon(
                                <path d="m9 18 6-6-6-6" />
                              )}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* COLLAPSE SIDEBAR */}
        <div className="
          hidden shrink-0 border-t border-slate-100
          p-3 lg:block
        ">
          <button
            type="button"
            onClick={toggleCollapse}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className={`
              flex w-full items-center gap-3
              rounded-xl px-3 py-2.5
              text-sm font-medium text-slate-500
              transition hover:bg-slate-50 hover:text-slate-800
              ${collapsed ? "justify-center" : ""}
            `}
          >
            <span className={`
              transition-transform duration-300
              ${collapsed ? "rotate-180" : ""}
            `}>
              {icon(
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                  <path d="m15 9-3 3 3 3" />
                </>
              )}
            </span>

            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>

        {/* USER PROFILE */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className={`
            rounded-xl border border-slate-100
            bg-slate-50 p-3
            ${collapsed ? "flex justify-center p-2" : ""}
          `}>
            <div className="flex items-center gap-3">
              <div className={`
                flex h-10 w-10 shrink-0 items-center
                justify-center rounded-full
                text-sm font-bold
                ${colorClasses.avatar}
              `}>
                A
              </div>

              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      Administrator
                    </p>

                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="
                        h-1.5 w-1.5 rounded-full
                        bg-emerald-500
                      " />
                      <p className="text-[11px] text-slate-400">
                        Online
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLogoutOpen(true)}
                    aria-label="Logout"
                    className="
                      flex h-8 w-8 items-center justify-center
                      rounded-lg text-slate-400
                      transition hover:bg-white hover:text-slate-700
                    "
                  >
                    {icon(
                      <>
                        <circle cx="5" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="19" cy="12" r="1.5" fill="currentColor" />
                      </>
                    )}
                  </button>
                </>
              )}

              {collapsed && (
                <button
                  type="button"
                  onClick={() => setLogoutOpen(true)}
                  title="Logout"
                  aria-label="Logout"
                  className="
                    absolute bottom-4 left-1/2
                    hidden h-1 w-1 opacity-0
                  "
                />
              )}
            </div>
          </div>

          {!collapsed && (
            <p className="
              mt-3 text-center text-[10px]
              font-medium text-slate-400
            ">
              PMC System v1.0
            </p>
          )}
        </div>
      </aside>

      {/* LOGOUT MODAL */}
      {logoutOpen && (
        <div className="
          fixed inset-0 z-[200]
          flex items-center justify-center
          bg-slate-900/40 p-4 backdrop-blur-sm
        ">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="
              w-full max-w-sm rounded-2xl
              border border-slate-200 bg-white
              p-6 shadow-2xl
            "
          >
            <div className="
              mx-auto flex h-12 w-12 items-center
              justify-center rounded-full bg-red-50
            ">
              {icon(
                <>
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M21 3v18" />
                </>
              )}
            </div>

            <div className="mt-4 text-center">
              <h3
                id="logout-title"
                className="text-lg font-semibold text-slate-900"
              >
                Logout
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Apakah Anda yakin ingin logout dari{" "}
                <span className="font-semibold text-slate-700">
                  PMC Production
                </span>
                ?
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setLogoutOpen(false)}
                className="
                  flex-1 rounded-xl border border-slate-200
                  bg-white px-4 py-2.5 text-sm font-semibold
                  text-slate-600 transition hover:bg-slate-50
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              >
                Batal
              </button>

              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="
                  flex-1 rounded-xl bg-red-500
                  px-4 py-2.5 text-sm font-semibold
                  text-white shadow-sm transition hover:bg-red-600
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              >
                {loggingOut ? "Logout..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
