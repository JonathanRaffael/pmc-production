
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// =====================================================
// TYPES
// =====================================================

type AuditAction = "UPDATE" | "DELETE" | "RESTORE";

interface AuditLog {
  id: number;
  recordId: number;
  action: AuditAction;
  actorId: number;
  actorEmail: string;
  reason: string | null;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;

  actor?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface AuditDetail {
  label: string;
  before: unknown;
  after: unknown;
}

// =====================================================
// AUDIT FIELD LABELS
// =====================================================

const FIELD_LABELS: Record<string, string> = {
  productionDate: "Tanggal Produksi",
  machineNo: "Nomor Mesin",
  operatorName: "Operator",
  computerCode: "Computer Code",
  outputQty: "Output Quantity",
  okQty: "OK Quantity",
  ngQty: "NG Quantity",
  actualRm: "Actual RM",
  target8H: "Target Produksi",
  achievement: "Pencapaian",
  otReplace: "OT Replacement",
  remarks: "Catatan",
  status: "Status Produksi",
  area: "Area Produksi",
  shift: "Shift",
  product: "Produk",
};

// Hanya field produksi yang relevan untuk pengguna.
// Field internal database sengaja tidak ditampilkan.

const VISIBLE_AUDIT_FIELDS = [
  "productionDate",
  "machineNo",
  "operatorName",
  "computerCode",
  "outputQty",
  "okQty",
  "ngQty",
  "actualRm",
  "target8H",
  "achievement",
  "otReplace",
  "remarks",
  "status",
  "area",
  "shift",
  "product",
];

// =====================================================
// HELPERS
// =====================================================

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatAction(action: AuditAction) {
  switch (action) {
    case "UPDATE":
      return "Update";
    case "DELETE":
      return "Delete";
    case "RESTORE":
      return "Restore";
    default:
      return action;
  }
}

function getActionStyle(action: AuditAction) {
  switch (action) {
    case "UPDATE":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "DELETE":
      return "bg-red-50 text-red-700 border-red-200";
    case "RESTORE":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

// =====================================================
// FORMAT AUDIT VALUE
// =====================================================

function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Ya" : "Tidak";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("id-ID").format(value);
  }

  if (typeof value === "string") {
    // Format tanggal produksi agar lebih mudah dibaca.
    if (
      /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)
    ) {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }
    }

    return value;
  }

  return "-";
}

// =====================================================
// EXTRACT RELATION VALUE
// =====================================================

function getRelationValue(
  value: unknown,
  relation: "area" | "shift" | "product"
): string {
  if (!isObject(value)) {
    return formatAuditValue(value);
  }

  if (relation === "area") {
    return formatAuditValue(value.name);
  }

  if (relation === "shift") {
    return formatAuditValue(value.name || value.code);
  }

  if (relation === "product") {
    const productName =
      value.productName ||
      value.name ||
      value.productCode;

    const productCode = value.productCode;

    if (productName && productCode && productName !== productCode) {
      return `${productName} (${productCode})`;
    }

    return formatAuditValue(productName);
  }

  return "-";
}

// =====================================================
// GET USER-FRIENDLY VALUE
// =====================================================

function getDisplayValue(
  field: string,
  value: unknown
): string {
  if (["area", "shift", "product"].includes(field)) {
    return getRelationValue(
      value,
      field as "area" | "shift" | "product"
    );
  }

  if (field === "status") {
    if (value === "COMPLETED") return "Completed";
    if (value === "CANCELLED") return "Cancelled";
  }

  if (field === "achievement" && typeof value === "number") {
    return `${formatAuditValue(value)}%`;
  }

  return formatAuditValue(value);
}

// =====================================================
// GET USER-FRIENDLY AUDIT DETAILS
// =====================================================

function getAuditDetails(log: AuditLog): AuditDetail[] {
  const before = isObject(log.beforeData)
    ? log.beforeData
    : {};

  const after = isObject(log.afterData)
    ? log.afterData
    : {};

  return VISIBLE_AUDIT_FIELDS
    .filter((field) => {
      const hasBefore = Object.prototype.hasOwnProperty.call(
        before,
        field
      );

      const hasAfter = Object.prototype.hasOwnProperty.call(
        after,
        field
      );

      return hasBefore || hasAfter;
    })
    .map((field) => ({
      label: FIELD_LABELS[field] || field,
      before: getDisplayValue(field, before[field]),
      after: getDisplayValue(field, after[field]),
    }))
    .filter((detail) => detail.before !== detail.after);
}

// =====================================================
// COMPONENT
// =====================================================

export default function ProductionAuditPage() {
  // ===================================================
  // STATE
  // ===================================================

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(
    null
  );

  // ===================================================
  // FETCH AUDIT LOG
  // ===================================================

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (actionFilter !== "ALL") {
        params.set("action", actionFilter);
      }

      if (dateFrom) {
        params.set("fromDate", dateFrom);
      }

      if (dateTo) {
        params.set("toDate", dateTo);
      }

      const response = await fetch(
        `/api/production/audit?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Gagal mengambil data audit log."
        );
      }

      const auditData = Array.isArray(result?.data)
        ? result.data
        : [];

      setLogs(auditData);

      const paginationData = result?.pagination;

      const total = Number(
        paginationData?.total ?? result?.total ?? 0
      );

      const totalPages = Number(
        paginationData?.totalPages ??
          Math.ceil(total / pageSize)
      );

      setPagination({
        page: Number(paginationData?.page ?? currentPage),
        limit: Number(paginationData?.limit ?? pageSize),
        total,
        totalPages,
        hasNextPage: Boolean(
          paginationData?.hasNextPage ?? currentPage < totalPages
        ),
        hasPreviousPage: Boolean(
          paginationData?.hasPreviousPage ?? currentPage > 1
        ),
      });
    } catch (err) {
      console.error("Production Audit Error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil audit log."
      );

      setLogs([]);

      setPagination({
        page: 1,
        limit: pageSize,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    search,
    actionFilter,
    dateFrom,
    dateTo,
  ]);

  // ===================================================
  // FETCH EFFECT
  // ===================================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAuditLogs();
    }, search ? 400 : 0);

    return () => clearTimeout(timeout);
  }, [fetchAuditLogs, search]);

  // ===================================================
  // RESET PAGE WHEN FILTER CHANGES
  // ===================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, dateFrom, dateTo, pageSize]);

  // ===================================================
  // SUMMARY
  // ===================================================

  const summary = useMemo(() => {
    return {
      total: pagination.total,
      update: logs.filter((log) => log.action === "UPDATE").length,
      delete: logs.filter((log) => log.action === "DELETE").length,
      restore: logs.filter((log) => log.action === "RESTORE").length,
    };
  }, [logs, pagination.total]);

  // ===================================================
  // CLEAR FILTER
  // ===================================================

  function clearFilters() {
    setSearch("");
    setActionFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  }

  // ===================================================
  // INVALID DATE RANGE
  // ===================================================

  const invalidDateRange =
    dateFrom !== "" &&
    dateTo !== "" &&
    dateFrom > dateTo;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6 text-gray-900">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Production Audit Log
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Riwayat aktivitas perubahan dan penghapusan data produksi.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAuditLogs}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Audit Records
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatNumber(summary.total)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Seluruh catatan audit
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Update
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {formatNumber(summary.update)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Pada halaman ini
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Delete
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatNumber(summary.delete)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Pada halaman ini
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Restore
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatNumber(summary.restore)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Pada halaman ini
          </p>
        </div>

      </div>

      {/* =================================================
          FILTER
      ================================================= */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Filter Audit Log
          </h2>

          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Clear Filter
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

          <div className="xl:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Record ID, administrator, email..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Action
            </label>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All Actions</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="RESTORE">Restore</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Date From
            </label>

            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Date To
            </label>

            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-40">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Rows Per Page
            </label>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value={25}>25 Rows</option>
              <option value={50}>50 Rows</option>
              <option value={100}>100 Rows</option>
            </select>
          </div>
        </div>

        {invalidDateRange && (
          <p className="mt-3 text-sm text-red-600">
            Date From tidak boleh lebih besar dari Date To.
          </p>
        )}

      </div>

      {/* =================================================
          AUDIT TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Audit Records
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Total {formatNumber(pagination.total)} audit records
            </p>
          </div>

          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            ADMIN ACCESS
          </span>
        </div>

        {error && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px] text-sm">

            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-center">No</th>
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-center">Action</th>
                <th className="px-4 py-3 text-center">Record ID</th>
                <th className="px-4 py-3 text-left">Administrator</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-center">Detail</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Loading audit records...
                  </td>
                </tr>
              ) : invalidDateRange ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-red-500"
                  >
                    Periode tanggal tidak valid.
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr
                    key={log.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-center text-gray-500">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {formatDate(log.createdAt)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getActionStyle(
                          log.action
                        )}`}
                      >
                        {formatAction(log.action)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center font-semibold text-gray-800">
                      #{log.recordId}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {log.actor?.name || "Administrator"}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {log.actorEmail}
                      </p>
                    </td>

                    <td className="max-w-xs px-4 py-3 text-gray-600">
                      <p className="line-clamp-2">
                        {log.reason || "-"}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-gray-500">
            Showing{" "}
            {pagination.total === 0
              ? 0
              : (currentPage - 1) * pageSize + 1}
            {" "}to{" "}
            {Math.min(currentPage * pageSize, pagination.total)}
            {" "}of {formatNumber(pagination.total)} entries
          </p>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                setCurrentPage((previous) => previous - 1)
              }
              disabled={!pagination.hasPreviousPage || loading}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2 text-sm font-medium text-gray-700">
              Page {currentPage} of {Math.max(1, pagination.totalPages)}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((previous) => previous + 1)
              }
              disabled={!pagination.hasNextPage || loading}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

          </div>

        </div>

      </div>

      {/* =================================================
          SIMPLE AUDIT DETAIL MODAL
      ================================================= */}

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="my-8 w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Activity Details
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Production Record #{selectedLog.recordId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg px-3 py-1 text-gray-500 transition hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* ACTIVITY INFORMATION */}

            <div className="space-y-5 p-6">

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getActionStyle(
                    selectedLog.action
                  )}`}
                >
                  {formatAction(selectedLog.action)}
                </span>

                <span className="text-sm text-gray-500">
                  {formatDate(selectedLog.createdAt)}
                </span>
              </div>

              {/* ADMINISTRATOR */}

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500">
                  Performed By
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {selectedLog.actor?.name || "Administrator"}
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  {selectedLog.actorEmail}
                </p>
              </div>

              {/* REASON */}

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Reason
                </p>

                <p className="mt-1 whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600">
                  {selectedLog.reason || "Tidak ada alasan yang dicantumkan."}
                </p>
              </div>

              {/* UPDATE DETAILS */}

              {selectedLog.action === "UPDATE" && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Perubahan Data Produksi
                  </h3>

                  {getAuditDetails(selectedLog).length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200">

                      <div className="grid grid-cols-[1fr_1fr_1fr] bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                        <span>Data</span>
                        <span>Sebelumnya</span>
                        <span>Sesudahnya</span>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {getAuditDetails(selectedLog).map((detail) => (
                          <div
                            key={detail.label}
                            className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-4 py-3 text-sm"
                          >
                            <span className="font-medium text-gray-700">
                              {detail.label}
                            </span>

                            <span className="break-words text-gray-500">
                              {String(detail.before)}
                            </span>

                            <span className="break-words font-medium text-gray-900">
                              {String(detail.after)}
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">
                        Tidak ada perubahan pada data produksi yang ditampilkan.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* DELETE DETAILS */}

              {selectedLog.action === "DELETE" && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800">
                    Data Produksi Dihapus
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    Record #{selectedLog.recordId} telah dihapus dari daftar produksi.
                    Data historis tetap tersimpan dalam sistem audit.
                  </p>
                </div>
              )}

              {/* RESTORE DETAILS */}

              {selectedLog.action === "RESTORE" && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-800">
                    Data Produksi Dipulihkan
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    Record #{selectedLog.recordId} telah dipulihkan dan dapat
                    kembali digunakan dalam sistem produksi.
                  </p>
                </div>
              )}

            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
