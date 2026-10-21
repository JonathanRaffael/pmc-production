"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const menuGroups = [
  {
    title: "Main Menu",
    items: [
      {
        name: "Dashboard",
        href: "/admin",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },

      {
        name: "Production",
        href: "/admin/production",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="m7 15 4-5 3 3 5-7" />
          </svg>
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
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path d="m21 8-9-5-9 5 9 5 9-5Z" />
            <path d="m3 12 9 5 9-5" />
            <path d="m3 16 9 5 9-5" />
          </svg>
        ),
      },

      {
        name: "Areas",
        href: "/admin/areas",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-5h6v5" />
            <path d="M9 9h.01" />
            <path d="M15 9h.01" />
            <path d="M9 12h.01" />
            <path d="M15 12h.01" />
          </svg>
        ),
      },

      {
        name: "Shifts",
        href: "/admin/shifts",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        ),
      },

    ],
  },
];

export default function Sidebar({
  open,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(href);
  };

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Logout gagal");
      }

      setLogoutOpen(false);
      onClose();

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* MOBILE OVERLAY */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="
            fixed inset-0 z-[90]
            bg-slate-900/30
            backdrop-blur-[2px]
            lg:hidden
          "
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[95]
          flex w-72 flex-col
          border-r border-slate-200
          bg-white
          shadow-xl shadow-slate-300/20
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          lg:shadow-none
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-600/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 21v-6h6v6" />
                <path d="M9 9h.01" />
                <path d="M15 9h.01" />
                <path d="M9 12h.01" />
                <path d="M15 12h.01" />
              </svg>
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-bold tracking-tight text-slate-900">
                PMC Production
              </h1>

              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                Monitoring System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="
              flex h-9 w-9 items-center justify-center
              rounded-lg text-slate-400
              transition
              hover:bg-slate-100 hover:text-slate-700
              lg:hidden
            "
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {menuGroups.map((group) => (
            <div
              key={group.title}
              className="mb-7"
            >
              <div className="mb-2 px-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {group.title}
                </p>
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`
                        group relative flex items-center gap-3
                        rounded-xl px-3 py-2.5
                        text-sm font-medium
                        transition-all duration-200
                        ${
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                      )}

                      <span
                        className={`
                          flex h-9 w-9 shrink-0 items-center
                          justify-center rounded-lg
                          transition-colors
                          ${
                            active
                              ? "bg-blue-100 text-blue-600"
                              : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
                          }
                        `}
                      >
                        {item.icon}
                      </span>

                      <span className="flex-1">
                        {item.name}
                      </span>

                      {active && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4 text-blue-500"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* USER INFO */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                A
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  Administrator
                </p>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  <p className="text-[11px] text-slate-400">
                    Online
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setLogoutOpen(true)
                }
                aria-label="User menu"
                className="
                  flex h-8 w-8 items-center justify-center
                  rounded-lg text-slate-400
                  transition
                  hover:bg-white
                  hover:text-slate-600
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <circle
                    cx="5"
                    cy="12"
                    r="1.5"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="1.5"
                  />
                  <circle
                    cx="19"
                    cy="12"
                    r="1.5"
                  />
                </svg>
              </button>
            </div>
          </div>

          <p className="mt-3 text-center text-[10px] font-medium text-slate-400">
            PMC System v1.0
          </p>
        </div>
      </aside>

      {/* LOGOUT MODAL */}
      {logoutOpen && (
        <div
          className="
            fixed inset-0 z-[200]
            flex items-center justify-center
            bg-slate-900/40
            p-4
            backdrop-blur-sm
          "
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="
              w-full max-w-sm
              rounded-2xl
              border border-slate-200
              bg-white
              p-6
              shadow-2xl
            "
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6 text-red-500"
              >
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M21 3v18" />
              </svg>
            </div>

            <div className="mt-4 text-center">
              <h3
                id="logout-title"
                className="text-lg font-semibold text-slate-900"
              >
                Logout
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Apakah Anda yakin ingin logout
                dari{" "}
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
                onClick={() =>
                  setLogoutOpen(false)
                }
                className="
                  flex-1 rounded-xl
                  border border-slate-200
                  bg-white
                  px-4 py-2.5
                  text-sm font-semibold
                  text-slate-600
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Batal
              </button>

              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="
                  flex-1 rounded-xl
                  bg-red-500
                  px-4 py-2.5
                  text-sm font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-red-600
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {loggingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />

                      <path
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>

                    Logout...
                  </span>
                ) : (
                  "Logout"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}