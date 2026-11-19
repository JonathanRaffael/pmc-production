
"use client";

import { useCallback, useEffect, useState } from "react";

type POStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED";

type DashboardData = {
  summary: {
    totalProducts: number;
    totalPO: number;
    openPO: number;
    inProgressPO: number;
    completedPO: number;
    totalProductionOutput: number;
    totalOKQty: number;
    totalAllocatedQty: number;
    totalUnallocatedOutput: number;
  };

  recentPOs: {
    id: number;
    poNumber: string;
    computerCode: string;
    productName: string;
    poDate: string;
    deliveryDeadline: string;
    actualPOQty: number;
    bufferQty: number;
    totalPOQty: number;
    allocatedQty: number;
    remainingQty: number;
    progress: number;
    status: POStatus;
  }[];
};

const numberFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function formatNumber(value: number) {
  return numberFormat.format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: POStatus }) {
  const styles = {
    OPEN: "bg-slate-100 text-slate-600",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
  };

  const labels = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {formatNumber(value)}
          </h3>
        </div>

        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function MoldingDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/molding/dashboard", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load dashboard"
        );
      }

      setData(result);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const summary = data?.summary;

  const totalPO = summary?.totalPO ?? 0;

  const completionRate =
    totalPO > 0
      ? ((summary?.completedPO ?? 0) / totalPO) * 100
      : 0;

  return (
    <div className="min-w-0 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />

            <span className="text-xs font-semibold uppercase tracking-wider text-violet-600">
              Molding Management System
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Molding Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor molding production, purchase orders and fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          className="
            inline-flex items-center justify-center gap-2
            rounded-lg border border-slate-200
            bg-white px-4 py-2.5
            text-sm font-semibold text-slate-700
            shadow-sm transition hover:bg-slate-50
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          >
            <path d="M20 7v5h-5" />
            <path d="M4 17v-5h5" />
            <path d="M5.6 9a7 7 0 0 1 12-2L20 12" />
            <path d="M4 12l2.4 5a7 7 0 0 0 12-2" />
          </svg>

          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            onClick={fetchDashboard}
            className="text-sm font-semibold text-red-700 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <StatCard
          title="Total Molding Products"
          value={summary?.totalProducts ?? 0}
          description="Active molding products"
          accent="bg-violet-50 text-violet-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="m21 8-9-5-9 5 9 5 9-5Z" />
              <path d="m3 12 9 5 9-5" />
              <path d="m3 16 9 5 9-5" />
            </svg>
          }
        />

        <StatCard
          title="Total Purchase Orders"
          value={summary?.totalPO ?? 0}
          description="All registered purchase orders"
          accent="bg-blue-50 text-blue-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
              <path d="M8 13h8M8 17h8" />
            </svg>
          }
        />

        <StatCard
          title="Open PO"
          value={summary?.openPO ?? 0}
          description="Purchase orders awaiting production"
          accent="bg-slate-100 text-slate-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5" />
              <path d="M12 16h.01" />
            </svg>
          }
        />

        <StatCard
          title="In Progress PO"
          value={summary?.inProgressPO ?? 0}
          description="Purchase orders currently being fulfilled"
          accent="bg-blue-50 text-blue-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          }
        />

        <StatCard
          title="Completed PO"
          value={summary?.completedPO ?? 0}
          description="Purchase orders fully fulfilled"
          accent="bg-emerald-50 text-emerald-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 3 3 5-6" />
            </svg>
          }
        />

        <StatCard
          title="Production Output"
          value={summary?.totalProductionOutput ?? 0}
          description="Total actual production output (pcs)"
          accent="bg-violet-50 text-violet-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v18" />
              <path d="M9 21v-6h6v6" />
            </svg>
          }
        />
      </div>

      {/* PO OVERVIEW */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
          <h2 className="text-base font-semibold text-slate-900">
            PO Fulfillment Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Overall purchase order completion.
          </p>

          <div className="mt-7 flex items-center justify-center">
            <div
              className="relative flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#10b981 ${completionRate}%, #f1f5f9 0)`,
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-bold text-slate-900">
                  {completionRate.toFixed(1)}%
                </span>
                <span className="mt-1 text-xs text-slate-400">
                  Completed
                </span>
              </div>
            </div>
          </div>

          <div className="mt-7 space-y-4">
            {[
              {
                label: "Open",
                value: summary?.openPO ?? 0,
                color: "bg-slate-400",
              },
              {
                label: "In Progress",
                value: summary?.inProgressPO ?? 0,
                color: "bg-blue-500",
              },
              {
                label: "Completed",
                value: summary?.completedPO ?? 0,
                color: "bg-emerald-500",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="text-sm text-slate-600">
                    {item.label}
                  </span>
                </div>

                <span className="text-sm font-semibold text-slate-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PRODUCTION SUMMARY */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">
            Production Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Actual production and PO allocation overview.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Total OK Quantity
              </p>

              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {formatNumber(summary?.totalOKQty ?? 0)}
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Accepted production quantity
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Total Allocated Quantity
              </p>

              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {formatNumber(summary?.totalAllocatedQty ?? 0)}
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Production allocated to purchase orders
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-5 sm:col-span-2">
              <p className="text-sm font-medium text-amber-700">
                Unallocated Output
              </p>

              <h3 className="mt-2 text-3xl font-bold text-amber-700">
                {formatNumber(summary?.totalUnallocatedOutput ?? 0)}
              </h3>

              <p className="mt-1 text-xs text-amber-600">
                OK quantity that has not been allocated to any purchase order.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT PURCHASE ORDERS */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Recent Purchase Orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest purchase orders and fulfillment progress.
            </p>
          </div>

          <a
            href="/admin/molding-po"
            className="text-sm font-semibold text-violet-600 hover:text-violet-700"
          >
            View All PO →
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">PO Number</th>
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Deadline</th>
                <th className="px-5 py-3 text-right font-semibold">Total PO</th>
                <th className="px-5 py-3 text-right font-semibold">Allocated</th>
                <th className="px-5 py-3 font-semibold">Progress</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : data?.recentPOs.length ? (
                data.recentPOs.map((po) => (
                  <tr
                    key={po.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {po.poNumber}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {po.productName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {po.computerCode}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(po.deliveryDeadline)}
                    </td>

                    <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                      {formatNumber(po.totalPOQty)}
                    </td>

                    <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                      {formatNumber(po.allocatedQty)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{
                              width: `${po.progress}%`,
                            }}
                          />
                        </div>

                        <span className="text-xs tabular-nums text-slate-500">
                          {po.progress}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={po.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col gap-1 pb-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>Molding Management System</span>
        <span>Production & PO Monitoring</span>
      </div>
    </div>
  );
}
