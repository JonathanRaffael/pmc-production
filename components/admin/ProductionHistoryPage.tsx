"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// =====================================================
// TYPES
// =====================================================

interface ProductionRecord {
  id: number;
  productionDate: string;
  machineNo: string | null;
  operatorName: string | null;
  computerCode: string | null;

  area: {
    id?: number;
    name: string;
    code: string;
  } | null;

  shift: {
    id?: number;
    name: string;
    code: string;
  } | null;

  product: {
    id?: number;
    productCode: string;
    productName: string;
    description?: string | null;
  } | null;

  outputQty: number | string;
  okQty: number | string;
  ngQty?: number | string;
  actualRm: number | string;
  target8H?: number | string;
  achievement?: number | string;

  otReplace?: string | null;
  remarks?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Props {
  isAdmin: boolean;
}

interface EditForm {
  operatorName: string;
  computerCode: string;
  outputQty: string;
  okQty: string;
  actualRm: string;
  remarks: string;
  reason: string;
}

// =====================================================
// FORMAT HELPERS
// =====================================================

function formatNumber(value: number | string | null | undefined) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(number);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitialEditForm(
  record: ProductionRecord
): EditForm {
  return {
    operatorName: record.operatorName ?? "",
    computerCode: record.computerCode ?? "",
    outputQty: String(record.outputQty ?? 0),
    okQty: String(record.okQty ?? 0),
    actualRm: String(record.actualRm ?? 0),
    remarks: record.remarks ?? "",
    reason: "",
  };
}

// =====================================================
// COMPONENT
// =====================================================

export default function ProductionHistoryPage({
  isAdmin,
}: Props) {
  // ===================================================
  // STATE
  // ===================================================

  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Summary data is fetched independently from the paginated table.
  const [summaryRecords, setSummaryRecords] = useState<ProductionRecord[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [search, setSearch] = useState("");
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

  const [selectedRecord, setSelectedRecord] =
    useState<ProductionRecord | null>(null);

  const [editingRecord, setEditingRecord] =
    useState<ProductionRecord | null>(null);

  const [editForm, setEditForm] = useState<EditForm>({
    operatorName: "",
    computerCode: "",
    outputQty: "",
    okQty: "",
    actualRm: "",
    remarks: "",
    reason: "",
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ===================================================
  // FETCH PRODUCTION HISTORY
  // ===================================================

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (dateFrom) {
        params.set("fromDate", dateFrom);
      }

      if (dateTo) {
        params.set("toDate", dateTo);
      }

      const response = await fetch(
        `/api/production?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Gagal mengambil production history."
        );
      }

      setRecords(
        Array.isArray(result?.data) ? result.data : []
      );

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
      console.error("Production History Error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data."
      );

      setRecords([]);
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
  }, [currentPage, pageSize, search, dateFrom, dateTo]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchHistory();
    }, search ? 400 : 0);

    return () => clearTimeout(timeout);
  }, [fetchHistory]);

  // ===================================================
  // FETCH ALL MATCHING DATA FOR SUMMARY
  // Independent from table pagination.
  // ===================================================

  useEffect(() => {
    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setSummaryLoading(true);

        const params = new URLSearchParams();
        params.set("summary", "true");

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (dateFrom) {
          params.set("fromDate", dateFrom);
        }

        if (dateTo) {
          params.set("toDate", dateTo);
        }

        const response = await fetch(
          `/api/production?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || "Gagal mengambil seluruh data summary."
          );
        }

        setSummaryRecords(
          Array.isArray(result?.data) ? result.data : []
        );
      } catch (err) {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }

        console.error("Production History Summary Error:", err);
        setSummaryRecords([]);
      } finally {
        if (!controller.signal.aborted) {
          setSummaryLoading(false);
        }
      }
    }, search ? 400 : 0);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, dateFrom, dateTo]);

  // ===================================================
  // RESET PAGE WHEN FILTER CHANGES
  // ===================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo, pageSize]);

  // ===================================================
  // SUMMARY
  // ===================================================

  const summary = useMemo(() => {
    return summaryRecords.reduce(
      (acc, record) => {
        const output = Number(record.outputQty) || 0;
        const ok = Number(record.okQty) || 0;

        acc.output += output;
        acc.ok += ok;
        acc.ng += Number(record.ngQty ?? output - ok) || 0;

        return acc;
      },
      {
        output: 0,
        ok: 0,
        ng: 0,
      }
    );
  }, [summaryRecords]);

  // ===================================================
  // CLEAR FILTER
  // ===================================================

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  }

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  function openEdit(record: ProductionRecord) {
    setEditingRecord(record);
    setEditForm(getInitialEditForm(record));
  }

  // ===================================================
  // UPDATE FORM
  // ===================================================

  function updateEditForm(
    field: keyof EditForm,
    value: string
  ) {
    setEditForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ===================================================
  // SAVE EDIT
  // ===================================================

  async function handleUpdate() {
    if (!editingRecord || !isAdmin) return;

    if (!editForm.reason.trim()) {
      alert("Alasan perubahan wajib diisi.");
      return;
    }

    const outputQty = Number(editForm.outputQty);
    const okQty = Number(editForm.okQty);
    const actualRm = Number(editForm.actualRm);

    if (
      !Number.isFinite(outputQty) ||
      !Number.isFinite(okQty) ||
      !Number.isFinite(actualRm) ||
      outputQty < 0 ||
      okQty < 0 ||
      actualRm < 0
    ) {
      alert("Pastikan semua nilai angka valid dan tidak negatif.");
      return;
    }

    if (okQty > outputQty) {
      alert("Quantity OK tidak boleh lebih besar dari Output.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/production/${editingRecord.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operatorName: editForm.operatorName,
            computerCode: editForm.computerCode,
            outputQty,
            okQty,
            actualRm,
            remarks: editForm.remarks,
            reason: editForm.reason,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Gagal memperbarui data produksi."
        );
      }

      alert("Data produksi berhasil diperbarui.");

      setEditingRecord(null);
      await fetchHistory();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memperbarui data."
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // DELETE PRODUCTION
  // ===================================================

  async function handleDelete(record: ProductionRecord) {
    if (!isAdmin) return;

    const reason = window.prompt(
      `Masukkan alasan penghapusan data produksi ID ${record.id}:`
    );

    if (reason === null) return;

    if (!reason.trim()) {
      alert("Alasan penghapusan wajib diisi.");
      return;
    }

    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menghapus data produksi ID ${record.id}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(record.id);

      const response = await fetch(
        `/api/production/${record.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: reason.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Gagal menghapus data produksi."
        );
      }

      alert("Data produksi berhasil dihapus.");

      if (records.length === 1 && currentPage > 1) {
        setCurrentPage((previous) => previous - 1);
      } else {
        await fetchHistory();
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus data."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Production History
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Riwayat dan pengelolaan data produksi.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Output
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatNumber(summary.output)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {summaryLoading
              ? "Memuat seluruh data..."
              : `${formatNumber(summaryRecords.length)} records sesuai filter`}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">
            Total OK
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatNumber(summary.ok)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {summaryLoading
              ? "Memuat seluruh data..."
              : `${formatNumber(summaryRecords.length)} records sesuai filter`}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">
            Total NG
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatNumber(summary.ng)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {summaryLoading
              ? "Memuat seluruh data..."
              : `${formatNumber(summaryRecords.length)} records sesuai filter`}
          </p>
        </div>

      </div>

      {/* FILTER */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Filter Production History
          </h2>

          <button
            onClick={clearFilters}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Clear Filter
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          {/* SEARCH */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product, code, operator..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* DATE FROM */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Date From
            </label>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* DATE TO */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Date To
            </label>

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* ROWS PER PAGE */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Rows Per Page
            </label>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value={25} className="bg-white text-gray-900">
                25 Rows
              </option>

              <option value={50} className="bg-white text-gray-900">
                50 Rows
              </option>

              <option value={100} className="bg-white text-gray-900">
                100 Rows
              </option>
            </select>
          </div>

        </div>

        {dateFrom && dateTo && dateFrom > dateTo && (
          <p className="mt-3 text-sm text-red-600">
            Date From tidak boleh lebih besar dari Date To.
          </p>
        )}

      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Production Records
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Total {formatNumber(pagination.total)} records
            </p>
          </div>

          {isAdmin && (
            <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              ADMIN ACCESS
            </span>
          )}
        </div>

        {error && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1250px] text-sm">

            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-center">No</th>
                <th className="px-4 py-3 text-left">Production Date</th>
                <th className="px-4 py-3 text-left">Machine</th>
                <th className="px-4 py-3 text-left">Area</th>
                <th className="px-4 py-3 text-left">Shift</th>
                <th className="px-4 py-3 text-left">Operator</th>
                <th className="px-4 py-3 text-left">Computer Code</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Output</th>
                <th className="px-4 py-3 text-right">OK</th>
                <th className="px-4 py-3 text-right">NG</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Loading production history...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No production history found.
                  </td>
                </tr>
              ) : (
                records.map((record, index) => {
                  const output = Number(record.outputQty) || 0;
                  const ok = Number(record.okQty) || 0;
                  const ng = Number(record.ngQty ?? output - ok) || 0;

                  return (
                    <tr
                      key={record.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-center text-gray-500">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatDate(record.productionDate)}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {record.machineNo || "-"}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {record.area?.name || record.area?.code || "-"}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {record.shift?.name || record.shift?.code || "-"}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {record.operatorName || "-"}
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-700">
                        {record.computerCode || "-"}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        <div className="font-medium">
                          {record.product?.productName || "-"}
                        </div>

                        <div className="text-xs text-gray-400">
                          {record.product?.productCode || ""}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatNumber(output)}
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        {formatNumber(ok)}
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {formatNumber(ng)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">

                          <button
                            onClick={() => setSelectedRecord(record)}
                            title="View Detail"
                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                          >
                            View
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEdit(record)}
                                title="Edit Record"
                                className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDelete(record)}
                                disabled={deletingId === record.id}
                                title="Delete Record"
                                className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId === record.id
                                  ? "..."
                                  : "Delete"}
                              </button>
                            </>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

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
              onClick={() => setCurrentPage((previous) => previous - 1)}
              disabled={!pagination.hasPreviousPage || loading}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2 text-sm font-medium text-gray-700">
              Page {currentPage} of {Math.max(1, pagination.totalPages)}
            </span>

            <button
              onClick={() => setCurrentPage((previous) => previous + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

          </div>

        </div>

      </div>

      {/* DETAIL MODAL */}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">

          <div className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Production Detail
                </h2>

                <p className="text-xs text-gray-500">
                  Record ID: #{selectedRecord.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">

              {[
                ["Production Date", formatDate(selectedRecord.productionDate)],
                ["Machine No.", selectedRecord.machineNo || "-"],
                ["Production Area", selectedRecord.area?.name || "-"],
                ["Shift", selectedRecord.shift?.name || "-"],
                ["Operator", selectedRecord.operatorName || "-"],
                ["Computer Code", selectedRecord.computerCode || "-"],
                ["Product Code", selectedRecord.product?.productCode || "-"],
                ["Product Name", selectedRecord.product?.productName || "-"],
                ["Output Quantity", formatNumber(selectedRecord.outputQty)],
                ["OK Quantity", formatNumber(selectedRecord.okQty)],
                [
                  "NG Quantity",
                  formatNumber(
                    selectedRecord.ngQty ??
                      Number(selectedRecord.outputQty) -
                        Number(selectedRecord.okQty)
                  ),
                ],
                ["Actual RM", formatNumber(selectedRecord.actualRm)],
                ["Target / 8H", formatNumber(selectedRecord.target8H)],
                ["Achievement", `${formatNumber(selectedRecord.achievement)}%`],
                ["OT / Replace", selectedRecord.otReplace || "-"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {value}
                  </p>
                </div>
              ))}

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 sm:col-span-2">
                <p className="text-xs text-gray-500">Remarks</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                  {selectedRecord.remarks || "-"}
                </p>
              </div>

            </div>

            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT MODAL */}

      {editingRecord && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">

          <div className="my-8 w-full max-w-xl rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit Production
                </h2>

                <p className="text-xs text-gray-500">
                  Record ID: #{editingRecord.id}
                </p>
              </div>

              <button
                onClick={() => setEditingRecord(null)}
                disabled={saving}
                className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-6">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* OPERATOR */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Operator
                  </label>

                  <input
                    type="text"
                    value={editForm.operatorName}
                    onChange={(e) =>
                      updateEditForm("operatorName", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* COMPUTER CODE */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Computer Code
                  </label>

                  <input
                    type="text"
                    value={editForm.computerCode}
                    onChange={(e) =>
                      updateEditForm("computerCode", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* OUTPUT QUANTITY */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Output Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={editForm.outputQty}
                    onChange={(e) =>
                      updateEditForm("outputQty", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* OK QUANTITY */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    OK Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={editForm.okQty}
                    onChange={(e) =>
                      updateEditForm("okQty", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* ACTUAL RM */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Actual RM
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.actualRm}
                    onChange={(e) =>
                      updateEditForm("actualRm", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>

              {/* REMARKS */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Remarks
                </label>

                <textarea
                  rows={3}
                  value={editForm.remarks}
                  onChange={(e) =>
                    updateEditForm("remarks", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* REASON */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Reason for Change <span className="text-red-500">*</span>
                </label>

                <textarea
                  rows={2}
                  value={editForm.reason}
                  onChange={(e) =>
                    updateEditForm("reason", e.target.value)
                  }
                  placeholder="Masukkan alasan perubahan data..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">

              <button
                onClick={() => setEditingRecord(null)}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}