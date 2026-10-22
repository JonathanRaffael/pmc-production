"use client";

import { useEffect, useMemo, useState } from "react";
import { calculatePMC } from "@/lib/pmc-calculation";

// =====================================================
// TABLE COLUMNS
// =====================================================

const columns = [
  { name: "No", width: "w-14" },
  { name: "Date Production", width: "w-36" },
  { name: "Month", width: "w-24" },
  { name: "Days", width: "w-20" },
  { name: "Machine No.", width: "w-28" },
  { name: "Production Area", width: "w-36" },
  { name: "Shift", width: "w-24" },
  { name: "Operator", width: "w-36" },
  { name: "Computer Code", width: "w-32" },
  { name: "Product Name", width: "w-40" },
  { name: "Product Description", width: "w-48" },
  { name: "Output Production", width: "w-36" },
  { name: "Quantity Product OK", width: "w-36" },
  { name: "Total NG Product", width: "w-32" },
  { name: "Product Rate NG (%)", width: "w-36" },
  {
    name: "Total Actual Raw Material Usage",
    width: "w-48",
  },
  {
    name: "Raw Material Requirement",
    width: "w-44",
  },
  {
    name: "Variance Raw Material",
    width: "w-40",
  },
  {
    name: "Percentage (%)",
    width: "w-32",
  },
  {
    name: "Target Qty Production /8H",
    width: "w-40",
  },
  {
    name: "Variance Product",
    width: "w-36",
  },
  {
    name: "Achievement (%)",
    width: "w-36",
  },
  {
    name: "OT / REPLACE",
    width: "w-32",
  },
  {
    name: "Remarks",
    width: "w-56",
  },
];

// =====================================================
// PRODUCTION RECORD
// =====================================================

export interface ProductionRecord {
  id: number;

  productionDate: string | Date;

  machineNo: string | null;

  area: {
    id?: number;
    code: string;
    name: string;
  } | null;

  shift: {
    id?: number;
    code: string;
    name: string;
  } | null;

  product: {
    id?: number;
    productCode: string;
    productName: string;
    description: string | null;

    shotWeight: number | string | null;
    shotWeightUnit?: string | null;
    quantityUnit?: string | null;
  } | null;

  operatorName: string | null;

  computerCode: string | null;

  outputQty: number | string;
  okQty: number | string;
  actualRm: number | string;

  target8H: number | string;

  targetEffectiveFrom?: string | Date | null;
  targetEffectiveTo?: string | Date | null;

  otReplace: string | null;
  remarks: string | null;
}

// =====================================================
// PROPS
// =====================================================

interface ProductionTableProps {
  productionData?: ProductionRecord[];
  loading?: boolean;
}

// =====================================================
// FORMAT NUMBER
// =====================================================

function formatNumber(value: number, decimals = 2) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(date: string | Date) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// =====================================================
// GET MONTH
// =====================================================

function getMonth(date: string | Date) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString("id-ID", {
    month: "long",
  });
}

// =====================================================
// GET DAY
// =====================================================

function getDay(date: string | Date) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.getDate();
}

// =====================================================
// NORMALIZE DATE
// =====================================================

function normalizeDate(date: string | Date) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// COMPONENT
// =====================================================

export default function ProductionTable({
  productionData: externalProductionData,
  loading: externalLoading = false,
}: ProductionTableProps) {
  // ===================================================
  // STATE
  // ===================================================

  const [productionData, setProductionData] = useState<ProductionRecord[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // ===================================================
  // FILTER STATE
  // ===================================================

  const [search, setSearch] = useState("");

  // DATE RANGE
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [areaFilter, setAreaFilter] = useState("ALL");

  const [shiftFilter, setShiftFilter] = useState("ALL");

  // ===================================================
  // GET PRODUCTION DATA
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    async function fetchProductionData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/production", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || "Gagal mengambil data production."
          );
        }

        const records = Array.isArray(result?.data) ? result.data : [];

        if (!cancelled) {
          setProductionData(records);
        }
      } catch (err) {
        console.error("ProductionTable fetch error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data production."
          );

          setProductionData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProductionData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===================================================
  // FINAL LOADING
  // ===================================================

  const isLoading = loading || externalLoading;

  // ===================================================
  // FILTER OPTIONS
  // ===================================================

  const areaOptions = useMemo(() => {
    const values = productionData
      .map((record) => record.area?.name || record.area?.code)
      .filter(Boolean) as string[];

    return Array.from(new Set(values)).sort();
  }, [productionData]);

  const shiftOptions = useMemo(() => {
    const values = productionData
      .map((record) => record.shift?.name || record.shift?.code)
      .filter(Boolean) as string[];

    return Array.from(new Set(values)).sort();
  }, [productionData]);

  // ===================================================
  // FILTERED DATA
  // ===================================================

  const filteredProductionData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return [...productionData]
      // =================================================
      // SEARCH FILTER
      // =================================================
      .filter((record) => {
        if (!keyword) return true;

        const values = [
          record.product?.productName,
          record.product?.productCode,
          record.computerCode,
          record.operatorName,
          record.machineNo,
          record.area?.name,
          record.area?.code,
          record.shift?.name,
          record.shift?.code,
          record.remarks,
        ];

        return values.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(keyword)
        );
      })

      // =================================================
      // DATE RANGE FILTER
      // =================================================
      .filter((record) => {
        const productionDate = normalizeDate(record.productionDate);

        if (!productionDate) {
          return false;
        }

        // Kalau From kosong dan To kosong
        // berarti tidak ada filter tanggal
        if (!dateFrom && !dateTo) {
          return true;
        }

        // From Date
        if (dateFrom && productionDate < dateFrom) {
          return false;
        }

        // To Date
        if (dateTo && productionDate > dateTo) {
          return false;
        }

        return true;
      })

      // =================================================
      // AREA FILTER
      // =================================================
      .filter((record) => {
        if (areaFilter === "ALL") return true;

        const area = record.area?.name || record.area?.code || "";

        return area === areaFilter;
      })

      // =================================================
      // SHIFT FILTER
      // =================================================
      .filter((record) => {
        if (shiftFilter === "ALL") return true;

        const shift = record.shift?.name || record.shift?.code || "";

        return shift === shiftFilter;
      })

      // =================================================
      // SORT
      // =================================================
      .sort((a, b) => {
        return (
          new Date(b.productionDate).getTime() -
          new Date(a.productionDate).getTime()
        );
      });
  }, [
    productionData,
    search,
    dateFrom,
    dateTo,
    areaFilter,
    shiftFilter,
  ]);

  // ===================================================
  // CALCULATE PMC DATA
  // ===================================================

  const calculatedRows = useMemo(() => {
    return filteredProductionData.map((record) => {
      const outputQty = Number(record.outputQty) || 0;

      const okQty = Number(record.okQty) || 0;

      const actualRm = Number(record.actualRm) || 0;

      const shotWeight =
        Number(record.product?.shotWeight) || 0;

      const target8H = Number(record.target8H) || 0;

      const pmc = calculatePMC({
        outputQty,
        okQty,
        actualRm,
        shotWeight,
        target8H,
      });

      return {
        record,
        outputQty,
        okQty,
        actualRm,
        shotWeight,
        target8H,
        pmc,
      };
    });
  }, [filteredProductionData]);

  // ===================================================
  // DASHBOARD SUMMARY
  // ===================================================

  const summary = useMemo(() => {
    const totalOutput = calculatedRows.reduce(
      (sum, row) => sum + row.outputQty,
      0
    );

    const totalOk = calculatedRows.reduce(
      (sum, row) => sum + row.okQty,
      0
    );

    const totalNg = calculatedRows.reduce(
      (sum, row) => sum + row.pmc.ngQty,
      0
    );

    const totalActualRm = calculatedRows.reduce(
      (sum, row) => sum + row.actualRm,
      0
    );

    const totalRmRequirement = calculatedRows.reduce(
      (sum, row) => sum + row.pmc.rmRequirement,
      0
    );

    const totalRmVariance = calculatedRows.reduce(
      (sum, row) => sum + row.pmc.rmVariance,
      0
    );

    const totalTarget = calculatedRows.reduce(
      (sum, row) => sum + row.target8H,
      0
    );

    const ngRate =
      totalOutput > 0
        ? (totalNg / totalOutput) * 100
        : 0;

    const achievement =
      totalTarget > 0
        ? (totalOutput / totalTarget) * 100
        : 0;

    const rmPercentage =
      totalRmRequirement > 0
        ? (totalActualRm / totalRmRequirement) * 100
        : 0;

    return {
      totalOutput,
      totalOk,
      totalNg,
      totalActualRm,
      totalRmRequirement,
      totalRmVariance,
      totalTarget,
      ngRate,
      achievement,
      rmPercentage,
    };
  }, [calculatedRows]);

  // ===================================================
  // CLEAR FILTER
  // ===================================================

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setAreaFilter("ALL");
    setShiftFilter("ALL");
  };

  // ===================================================
  // HAS FILTER
  // ===================================================

  const hasFilter =
    search.trim() !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    areaFilter !== "ALL" ||
    shiftFilter !== "ALL";

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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="border-b border-gray-200 px-6 py-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Production Monitoring
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Daily production monitoring and performance
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            {isLoading
              ? "Loading production data..."
              : `${filteredProductionData.length} of ${productionData.length} records`}
          </div>

        </div>

      </div>

      {/* =====================================================
          KPI SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-2 gap-3 border-b border-gray-200 bg-gray-50 p-4 md:grid-cols-3 xl:grid-cols-6">

        {/* OUTPUT */}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Total Output
          </p>

          <p className="mt-2 text-xl font-bold text-gray-900">
            {formatNumber(summary.totalOutput, 0)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Production
          </p>

        </div>

        {/* OK */}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Product OK
          </p>

          <p className="mt-2 text-xl font-bold text-green-600">
            {formatNumber(summary.totalOk, 0)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Passed
          </p>

        </div>

        {/* NG */}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Total NG
          </p>

          <p className="mt-2 text-xl font-bold text-red-600">
            {formatNumber(summary.totalNg, 0)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {formatNumber(summary.ngRate, 2)}% NG Rate
          </p>

        </div>

        {/* ACHIEVEMENT */}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Achievement
          </p>

          <p
            className={`mt-2 text-xl font-bold ${
              summary.achievement >= 100
                ? "text-green-600"
                : summary.achievement >= 80
                  ? "text-yellow-600"
                  : "text-red-600"
            }`}
          >
            {formatNumber(summary.achievement, 2)}%
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {formatNumber(summary.totalOutput, 0)} /{" "}
            {formatNumber(summary.totalTarget, 0)}
          </p>

        </div>

        {/* RM */}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            RM Usage
          </p>

          <p className="mt-2 text-xl font-bold text-blue-600">
            {formatNumber(summary.totalActualRm, 3)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Actual
          </p>

        </div>

        {/* RM VARIANCE */}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            RM Variance
          </p>

          <p
            className={`mt-2 text-xl font-bold ${
              summary.totalRmVariance > 0
                ? "text-red-600"
                : summary.totalRmVariance < 0
                  ? "text-green-600"
                  : "text-gray-600"
            }`}
          >
            {formatNumber(summary.totalRmVariance, 3)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {formatNumber(summary.rmPercentage, 2)}% usage
          </p>

        </div>

      </div>

      {/* =====================================================
          FILTER
      ===================================================== */}

      <div className="border-b border-gray-200 bg-white px-6 py-4">

        {/* =================================================
            FIRST FILTER ROW
        ================================================= */}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">

          {/* SEARCH */}

          <div className="lg:col-span-2">

            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Search
            </label>

            <div className="relative">

              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, computer code, operator..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>

          {/* FROM DATE */}

          <div>

            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              From Date
            </label>

            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                invalidDateRange
                  ? "border-red-300"
                  : "border-gray-200"
              }`}
            />

          </div>

          {/* TO DATE */}

          <div>

            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              To Date
            </label>

            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                invalidDateRange
                  ? "border-red-300"
                  : "border-gray-200"
              }`}
            />

          </div>

        </div>

        {/* =================================================
            DATE RANGE INFO
        ================================================= */}

        {invalidDateRange && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs font-medium text-red-600">
              From Date tidak boleh lebih besar dari To Date.
            </p>
          </div>
        )}

        {!invalidDateRange && (dateFrom || dateTo) && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
            <p className="text-xs text-blue-700">
              {dateFrom && dateTo
                ? `Menampilkan data produksi dari ${formatDate(
                    `${dateFrom}T00:00:00`
                  )} sampai ${formatDate(`${dateTo}T00:00:00`)}`
                : dateFrom
                  ? `Menampilkan data produksi mulai ${formatDate(
                      `${dateFrom}T00:00:00`
                    )}`
                  : `Menampilkan data produksi sampai ${formatDate(
                      `${dateTo}T00:00:00`
                    )}`}
            </p>
          </div>
        )}

        {/* =================================================
            SECOND FILTER ROW
        ================================================= */}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">

          {/* AREA */}

          <div className="w-full sm:w-64">

            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Production Area
            </label>

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

              <option value="ALL">
                All Areas
              </option>

              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}

            </select>

          </div>

          {/* SHIFT */}

          <div className="w-full sm:w-64">

            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Shift
            </label>

            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

              <option value="ALL">
                All Shifts
              </option>

              {shiftOptions.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}

            </select>

          </div>

          {/* CLEAR */}

          {hasFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Clear Filter
            </button>
          )}

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && !isLoading && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3">

          <p className="text-sm font-medium text-red-600">
            {error}
          </p>

        </div>
      )}

      {/* =====================================================
          INVALID DATE RANGE
      ===================================================== */}

      {invalidDateRange ? (
        <div className="border-b border-yellow-200 bg-yellow-50 px-6 py-8 text-center">

          <p className="text-sm font-medium text-yellow-700">
            Periode tanggal tidak valid.
          </p>

          <p className="mt-1 text-xs text-yellow-600">
            Silakan pilih From Date yang lebih kecil atau sama dengan To Date.
          </p>

        </div>
      ) : (
        /* =====================================================
            TABLE
        ===================================================== */

        <div className="w-full overflow-x-auto">

          <table className="w-max min-w-full border-collapse">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <thead>

              <tr className="bg-slate-50">

                {columns.map((column) => (
                  <th
                    key={column.name}
                    className={`
                      ${column.width}
                      border-b
                      border-r
                      border-gray-200
                      px-4
                      py-4
                      text-center
                      align-middle
                      text-xs
                      font-semibold
                      leading-4
                      text-slate-600
                      last:border-r-0
                      whitespace-nowrap
                    `}
                  >
                    {column.name}
                  </th>
                ))}

              </tr>

            </thead>

            {/* =====================================================
                BODY
            ===================================================== */}

            <tbody>

              {/* LOADING */}

              {isLoading ? (

                <tr>

                  <td
                    colSpan={columns.length}
                    className="border-b border-gray-100 px-6 py-16 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-slate-600" />

                      <p className="text-sm font-medium text-gray-600">
                        Loading production data...
                      </p>

                    </div>

                  </td>

                </tr>

              ) : filteredProductionData.length === 0 ? (

                /* EMPTY */

                <tr>

                  <td
                    colSpan={columns.length}
                    className="border-b border-gray-100 px-6 py-16 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">

                        <svg
                          className="h-6 w-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h6l5 5v11a2 2 0 01-2 2z"
                          />

                        </svg>

                      </div>

                      <p className="text-sm font-medium text-gray-600">

                        {hasFilter
                          ? "Data tidak ditemukan"
                          : "Belum ada data produksi"}

                      </p>

                      <p className="mt-1 text-xs text-gray-400">

                        {hasFilter
                          ? "Coba ubah atau hapus filter yang digunakan."
                          : "Data production akan muncul di sini setelah dilakukan input."}

                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                /* DATA */

                calculatedRows.map(
                  (
                    {
                      record,
                      outputQty,
                      okQty,
                      actualRm,
                      target8H,
                      pmc,
                    },
                    index
                  ) => {

                    const rmUnit =
                      record.product?.shotWeightUnit || "KG";

                    const quantityUnit =
                      record.product?.quantityUnit || "";

                    const machineNo =
                      record.machineNo?.trim() || "-";

                    return (

                      <tr
                        key={record.id}
                        className="transition-colors hover:bg-slate-50"
                      >

                        {/* NO */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                          {index + 1}
                        </td>

                        {/* DATE */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                          {formatDate(record.productionDate)}
                        </td>

                        {/* MONTH */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                          {getMonth(record.productionDate)}
                        </td>

                        {/* DAYS */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                          {getDay(record.productionDate)}
                        </td>

                        {/* MACHINE */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm font-medium text-gray-700">
                          {machineNo}
                        </td>

                        {/* AREA */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                          {record.area?.name ||
                            record.area?.code ||
                            "-"}
                        </td>

                        {/* SHIFT */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                          {record.shift?.name ||
                            record.shift?.code ||
                            "-"}
                        </td>

                        {/* OPERATOR */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                          {record.operatorName || "-"}
                        </td>

                        {/* COMPUTER CODE */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                          {record.computerCode || "-"}
                        </td>

                        {/* PRODUCT */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700">
                          {record.product?.productName || "-"}
                        </td>

                        {/* DESCRIPTION */}

                        <td className="max-w-xs border-b border-r border-gray-100 px-4 py-3 text-left text-sm text-gray-600">

                          <div
                            className="truncate"
                            title={record.product?.description || ""}
                          >
                            {record.product?.description || "-"}
                          </div>

                        </td>

                        {/* OUTPUT */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm font-medium text-gray-700">

                          {formatNumber(outputQty, 2)}

                          {quantityUnit && (
                            <span className="ml-1 text-xs text-gray-400">
                              {quantityUnit}
                            </span>
                          )}

                        </td>

                        {/* OK */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm text-gray-600">

                          {formatNumber(okQty, 2)}

                          {quantityUnit && (
                            <span className="ml-1 text-xs text-gray-400">
                              {quantityUnit}
                            </span>
                          )}

                        </td>

                        {/* NG */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm font-medium text-red-600">

                          {formatNumber(pmc.ngQty, 2)}

                          {quantityUnit && (
                            <span className="ml-1 text-xs text-gray-400">
                              {quantityUnit}
                            </span>
                          )}

                        </td>

                        {/* NG RATE */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm font-medium text-red-600">

                          {formatNumber(pmc.ngRate, 2)}%

                        </td>

                        {/* ACTUAL RM */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm text-gray-600">

                          {formatNumber(actualRm, 3)}

                          <span className="ml-1 text-xs text-gray-400">
                            {rmUnit}
                          </span>

                        </td>

                        {/* RM REQUIREMENT */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm font-medium text-gray-700">

                          {formatNumber(
                            pmc.rmRequirement,
                            3
                          )}

                          <span className="ml-1 text-xs text-gray-400">
                            {rmUnit}
                          </span>

                        </td>

                        {/* RM VARIANCE */}

                        <td
                          className={`
                            border-b
                            border-r
                            border-gray-100
                            px-4
                            py-3
                            text-right
                            text-sm
                            font-medium
                            ${
                              pmc.rmVariance > 0
                                ? "text-red-600"
                                : pmc.rmVariance < 0
                                  ? "text-green-600"
                                  : "text-gray-600"
                            }
                          `}
                        >

                          {formatNumber(
                            pmc.rmVariance,
                            3
                          )}

                          <span className="ml-1 text-xs text-gray-400">
                            {rmUnit}
                          </span>

                        </td>

                        {/* RM PERCENTAGE */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm text-gray-600">

                          {formatNumber(
                            pmc.rmPercentage,
                            2
                          )}
                          %

                        </td>

                        {/* TARGET */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm font-semibold text-blue-700">

                          {target8H > 0
                            ? formatNumber(target8H, 2)
                            : "-"}

                          {quantityUnit &&
                            target8H > 0 && (
                              <span className="ml-1 text-xs font-normal text-gray-400">
                                {quantityUnit}
                              </span>
                            )}

                        </td>

                        {/* PRODUCT VARIANCE */}

                        <td
                          className={`
                            border-b
                            border-r
                            border-gray-100
                            px-4
                            py-3
                            text-right
                            text-sm
                            font-semibold
                            ${
                              pmc.productVariance >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          `}
                        >

                          {formatNumber(
                            pmc.productVariance,
                            2
                          )}

                          {quantityUnit && (
                            <span className="ml-1 text-xs font-normal text-gray-400">
                              {quantityUnit}
                            </span>
                          )}

                        </td>

                        {/* ACHIEVEMENT */}

                        <td
                          className={`
                            border-b
                            border-r
                            border-gray-100
                            px-4
                            py-3
                            text-right
                            text-sm
                            font-semibold
                            ${
                              pmc.achievement >= 100
                                ? "text-green-600"
                                : pmc.achievement >= 80
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }
                          `}
                        >

                          {target8H > 0
                            ? `${formatNumber(
                                pmc.achievement,
                                2
                              )}%`
                            : "-"}

                        </td>

                        {/* OT / REPLACE */}

                        <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                          {record.otReplace || "-"}
                        </td>

                        {/* REMARKS */}

                        <td className="border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-600">
                          {record.remarks || "-"}
                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-xs text-gray-500">

          Showing{" "}

          <span className="font-semibold text-gray-700">
            {filteredProductionData.length}
          </span>

          {" "}of{" "}

          <span className="font-semibold text-gray-700">
            {productionData.length}
          </span>

          {" "}production records

        </p>

        <p className="text-xs text-gray-400">
          Scroll horizontally untuk melihat seluruh kolom
        </p>

      </div>

    </div>
  );
}