"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  { name: "Total Actual Raw Material Usage", width: "w-48" },
  { name: "Raw Material Requirement", width: "w-44" },
  { name: "Variance Raw Material", width: "w-40" },
  { name: "Percentage (%)", width: "w-32" },
  { name: "Target Qty Production /8H", width: "w-40" },
  { name: "Variance Product", width: "w-36" },
  { name: "Achievement (%)", width: "w-36" },
  { name: "OT / REPLACE", width: "w-32" },
  { name: "Remarks", width: "w-56" },
];

// =====================================================
// PRODUCTION RECORD
// =====================================================

export interface ProductionRecord {
  id: number;

  createdAt: string | Date;

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
// FILTER
// =====================================================

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
  area: string;
  shift: string;
}

const initialFilters: Filters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  area: "ALL",
  shift: "ALL",
};

// =====================================================
// PAGINATION
// =====================================================

const ITEMS_PER_PAGE = 25;

// =====================================================
// HELPERS
// =====================================================

function formatNumber(value: number, decimals = 2) {
  if (!Number.isFinite(value)) return "-";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function getDateValue(date: string | Date) {
  const value = new Date(date);

  return Number.isNaN(value.getTime()) ? null : value;
}

function formatDate(date: string | Date) {
  const value = getDateValue(date);

  if (!value) return "-";

  return value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getMonth(date: string | Date) {
  const value = getDateValue(date);

  if (!value) return "-";

  return value.toLocaleDateString("id-ID", {
    month: "long",
  });
}

function getDay(date: string | Date) {
  const value = getDateValue(date);

  if (!value) return "-";

  return value.getDate();
}

function normalizeDate(date: string | Date) {
  const value = getDateValue(date);

  if (!value) return "";

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getArea(record: ProductionRecord) {
  return record.area?.name || record.area?.code || "";
}

function getShift(record: ProductionRecord) {
  return record.shift?.name || record.shift?.code || "";
}

// =====================================================
// TABLE CELL
// =====================================================

function TableCell({
  children,
  align = "right",
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <td
  className={`border-b border-r border-gray-100 px-4 py-3 text-sm text-gray-700 ${alignClass} ${className}`}
>
      {children}
    </td>
  );
}

// =====================================================
// KPI CARD
// =====================================================

function KpiCard({
  title,
  value,
  description,
  valueClass = "text-gray-900",
}: {
  title: string;
  value: ReactNode;
  description: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {title}
      </p>

      <p className={`mt-2 text-xl font-bold ${valueClass}`}>
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );
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

  const [productionData, setProductionData] = useState<
    ProductionRecord[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] =
    useState<Filters>(initialFilters);

  const [currentPage, setCurrentPage] = useState(1);

  // ===================================================
  // FILTER SHORTCUT
  // ===================================================

  const {
    search,
    dateFrom,
    dateTo,
    area,
    shift,
  } = filters;

  const updateFilter = <K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Kembali ke halaman pertama
    setCurrentPage(1);
  };

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
            result?.message ||
              "Gagal mengambil data production."
          );
        }

        const records = Array.isArray(result?.data)
          ? result.data
          : [];

        if (!cancelled) {
          setProductionData(records);
        }
      } catch (err) {
        console.error(
          "ProductionTable fetch error:",
          err
        );

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
  // LOADING
  // ===================================================

  const isLoading =
    loading || externalLoading;

  // ===================================================
  // FILTER OPTIONS
  // ===================================================

  const areaOptions = useMemo(() => {
    return Array.from(
      new Set(
        productionData
          .map(getArea)
          .filter(Boolean)
      )
    ).sort();
  }, [productionData]);

  const shiftOptions = useMemo(() => {
    return Array.from(
      new Set(
        productionData
          .map(getShift)
          .filter(Boolean)
      )
    ).sort();
  }, [productionData]);

  // ===================================================
  // FILTERED DATA
  // ===================================================

  const filteredProductionData = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return productionData
      .filter((record) => {
        // =============================================
        // SEARCH
        // =============================================

        if (keyword) {
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

          const matched = values.some(
            (value) =>
              String(value ?? "")
                .toLowerCase()
                .includes(keyword)
          );

          if (!matched) return false;
        }

        // =============================================
        // DATE
        // =============================================

        const productionDate =
          normalizeDate(
            record.productionDate
          );

        if (!productionDate) {
          return false;
        }

        if (
          dateFrom &&
          productionDate < dateFrom
        ) {
          return false;
        }

        if (
          dateTo &&
          productionDate > dateTo
        ) {
          return false;
        }

        // =============================================
        // AREA
        // =============================================

        if (
          area !== "ALL" &&
          getArea(record) !== area
        ) {
          return false;
        }

        // =============================================
        // SHIFT
        // =============================================

        if (
          shift !== "ALL" &&
          getShift(record) !== shift
        ) {
          return false;
        }

        return true;
      })

      // ===============================================
      // SORT BY CREATED AT
      // TERLAMA → TERBARU
      // ===============================================

      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
  }, [
    productionData,
    search,
    dateFrom,
    dateTo,
    area,
    shift,
  ]);

  // ===================================================
  // PAGINATION INFO
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredProductionData.length /
        ITEMS_PER_PAGE
    )
  );

  // ===================================================
  // FIX CURRENT PAGE
  // ===================================================

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  // ===================================================
  // PAGINATED DATA
  // ===================================================

  const paginatedProductionData =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      const endIndex =
        startIndex +
        ITEMS_PER_PAGE;

      return filteredProductionData.slice(
        startIndex,
        endIndex
      );
    }, [
      filteredProductionData,
      currentPage,
    ]);

  // ===================================================
  // CALCULATE PMC
  // ===================================================

  const calculatedRows = useMemo(() => {
    return paginatedProductionData.map(
      (record) => {
        const outputQty =
          Number(record.outputQty) || 0;

        const okQty =
          Number(record.okQty) || 0;

        const actualRm =
          Number(record.actualRm) || 0;

        const shotWeight =
          Number(
            record.product?.shotWeight
          ) || 0;

        const target8H =
          Number(record.target8H) || 0;

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
      }
    );
  }, [paginatedProductionData]);

  // ===================================================
  // DASHBOARD SUMMARY
  // ===================================================

  const summary = useMemo(() => {
    const totals =
      filteredProductionData.reduce(
        (acc, record) => {
          const outputQty =
            Number(record.outputQty) || 0;

          const okQty =
            Number(record.okQty) || 0;

          const actualRm =
            Number(record.actualRm) || 0;

          const shotWeight =
            Number(
              record.product?.shotWeight
            ) || 0;

          const target8H =
            Number(record.target8H) || 0;

          const pmc = calculatePMC({
            outputQty,
            okQty,
            actualRm,
            shotWeight,
            target8H,
          });

          acc.totalOutput += outputQty;
          acc.totalOk += okQty;
          acc.totalNg += pmc.ngQty;
          acc.totalActualRm += actualRm;
          acc.totalRmRequirement +=
            pmc.rmRequirement;
          acc.totalRmVariance +=
            pmc.rmVariance;
          acc.totalTarget += target8H;

          return acc;
        },
        {
          totalOutput: 0,
          totalOk: 0,
          totalNg: 0,
          totalActualRm: 0,
          totalRmRequirement: 0,
          totalRmVariance: 0,
          totalTarget: 0,
        }
      );

    const ngRate =
      totals.totalOutput > 0
        ? (totals.totalNg /
            totals.totalOutput) *
          100
        : 0;

    const achievement =
      totals.totalTarget > 0
        ? (totals.totalOutput /
            totals.totalTarget) *
          100
        : 0;

    const rmPercentage =
      totals.totalRmRequirement > 0
        ? (totals.totalActualRm /
            totals.totalRmRequirement) *
          100
        : 0;

    return {
      ...totals,
      ngRate,
      achievement,
      rmPercentage,
    };
  }, [filteredProductionData]);

  // ===================================================
  // FILTER STATUS
  // ===================================================

  const hasFilter =
    search.trim() !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    area !== "ALL" ||
    shift !== "ALL";

  const invalidDateRange =
    dateFrom !== "" &&
    dateTo !== "" &&
    dateFrom > dateTo;

  // ===================================================
  // CLEAR FILTER
  // ===================================================

  const clearFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  // ===================================================
  // PAGINATION CONTROLS
  // ===================================================

  const goToPage = (
    page: number
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  // ===================================================
  // PAGE NUMBERS
  // ===================================================

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];

    const maxVisiblePages = 5;

    let start = Math.max(
      1,
      currentPage -
        Math.floor(
          maxVisiblePages / 2
        )
    );

    let end = Math.min(
      totalPages,
      start +
        maxVisiblePages -
        1
    );

    if (
      end - start + 1 <
      maxVisiblePages
    ) {
      start = Math.max(
        1,
        end -
          maxVisiblePages +
          1
      );
    }

    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i);
    }

    return pages;
  }, [
    currentPage,
    totalPages,
  ]);

  // ===================================================
  // PAGINATION RANGE
  // ===================================================

  const firstItem =
    filteredProductionData.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastItem = Math.min(
    currentPage *
      ITEMS_PER_PAGE,
    filteredProductionData.length
  );

  // ===================================================
  // SEARCH ICON
  // ===================================================

  const SearchIcon = () => (
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
  );

  // ===================================================
  // EMPTY ICON
  // ===================================================

  const EmptyIcon = () => (
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
  );

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
              : `${firstItem}-${lastItem} of ${filteredProductionData.length} records`}
          </div>

        </div>
      </div>

      {/* =====================================================
          KPI SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-2 gap-3 border-b border-gray-200 bg-gray-50 p-4 md:grid-cols-3 xl:grid-cols-6">

        <KpiCard
          title="Total Output"
          value={formatNumber(
            summary.totalOutput,
            0
          )}
          description="Production"
        />

        <KpiCard
          title="Product OK"
          value={formatNumber(
            summary.totalOk,
            0
          )}
          description="Passed"
          valueClass="text-green-600"
        />

        <KpiCard
          title="Total NG"
          value={formatNumber(
            summary.totalNg,
            0
          )}
          description={`${formatNumber(
            summary.ngRate,
            2
          )}% NG Rate`}
          valueClass="text-red-600"
        />

        <KpiCard
          title="Achievement"
          value={`${formatNumber(
            summary.achievement,
            2
          )}%`}
          description={
            <>
              {formatNumber(
                summary.totalOutput,
                0
              )}{" "}
              /{" "}
              {formatNumber(
                summary.totalTarget,
                0
              )}
            </>
          }
          valueClass={
            summary.achievement >= 100
              ? "text-green-600"
              : summary.achievement >= 80
                ? "text-yellow-600"
                : "text-red-600"
          }
        />

        <KpiCard
          title="RM Usage"
          value={formatNumber(
            summary.totalActualRm,
            3
          )}
          description="Actual"
          valueClass="text-blue-600"
        />

        <KpiCard
          title="RM Variance"
          value={formatNumber(
            summary.totalRmVariance,
            3
          )}
          description={`${formatNumber(
            summary.rmPercentage,
            2
          )}% usage`}
          valueClass={
            summary.totalRmVariance > 0
              ? "text-red-600"
              : summary.totalRmVariance < 0
                ? "text-green-600"
                : "text-gray-600"
          }
        />

      </div>

      {/* =====================================================
          FILTER
      ===================================================== */}

      <div className="border-b border-gray-200 bg-white px-6 py-4">

        {/* SEARCH + DATE */}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">

          {/* SEARCH */}

          <div className="lg:col-span-2">

            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Search
            </label>

            <div className="relative">

              <SearchIcon />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  updateFilter(
                    "search",
                    e.target.value
                  )
                }
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
              max={
                dateTo ||
                undefined
              }
              onChange={(e) =>
                updateFilter(
                  "dateFrom",
                  e.target.value
                )
              }
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
              min={
                dateFrom ||
                undefined
              }
              onChange={(e) =>
                updateFilter(
                  "dateTo",
                  e.target.value
                )
              }
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                invalidDateRange
                  ? "border-red-300"
                  : "border-gray-200"
              }`}
            />

          </div>

        </div>

        {/* DATE INFO */}

        {invalidDateRange && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">

            <p className="text-xs font-medium text-red-600">
              From Date tidak boleh lebih besar dari To Date.
            </p>

          </div>
        )}

        {!invalidDateRange &&
          (dateFrom || dateTo) && (
            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">

              <p className="text-xs text-blue-700">

                {dateFrom &&
                dateTo
                  ? `Menampilkan data produksi dari ${formatDate(
                      `${dateFrom}T00:00:00`
                    )} sampai ${formatDate(
                      `${dateTo}T00:00:00`
                    )}`
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

        {/* AREA + SHIFT */}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">

          {/* AREA */}

          <div className="w-full sm:w-64">

            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Production Area
            </label>

            <select
              value={area}
              onChange={(e) =>
                updateFilter(
                  "area",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

              <option value="ALL">
                All Areas
              </option>

              {areaOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}

            </select>

          </div>

          {/* SHIFT */}

          <div className="w-full sm:w-64">

            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Shift
            </label>

            <select
              value={shift}
              onChange={(e) =>
                updateFilter(
                  "shift",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

              <option value="ALL">
                All Shifts
              </option>

              {shiftOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}

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
          TABLE
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
        <div className="w-full overflow-x-auto">

          <table className="w-max min-w-full border-collapse">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <thead>

              <tr className="bg-slate-50">

                {columns.map(
                  (column) => (
                    <th
                      key={column.name}
                      className={`${column.width} whitespace-nowrap border-b border-r border-gray-200 px-4 py-4 text-center align-middle text-xs font-semibold leading-4 text-slate-600 last:border-r-0`}
                    >
                      {column.name}
                    </th>
                  )
                )}

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
                    colSpan={
                      columns.length
                    }
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
                    colSpan={
                      columns.length
                    }
                    className="border-b border-gray-100 px-6 py-16 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <EmptyIcon />

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
                      record.product
                        ?.shotWeightUnit ||
                      "KG";

                    const quantityUnit =
                      record.product
                        ?.quantityUnit ||
                      "";

                    const machineNo =
                      record.machineNo?.trim() ||
                      "-";

                    const areaName =
                      getArea(record) ||
                      "-";

                    const shiftName =
                      getShift(record) ||
                      "-";

                    const globalIndex =
                      (currentPage - 1) *
                        ITEMS_PER_PAGE +
                      index +
                      1;

                    return (

                      <tr
                        key={record.id}
                        className="transition-colors hover:bg-slate-50"
                      >

                        {/* NO */}

                        <TableCell align="center">
                          {globalIndex}
                        </TableCell>

                        {/* DATE */}

                        <TableCell align="center">
                          {formatDate(
                            record.productionDate
                          )}
                        </TableCell>

                        {/* MONTH */}

                        <TableCell align="center">
                          {getMonth(
                            record.productionDate
                          )}
                        </TableCell>

                        {/* DAYS */}

                        <TableCell align="center">
                          {getDay(
                            record.productionDate
                          )}
                        </TableCell>

                        {/* MACHINE */}

                        <TableCell
                          align="center"
                          className="font-medium text-gray-700"
                        >
                          {machineNo}
                        </TableCell>

                        {/* AREA */}

                        <TableCell align="center">
                          {areaName}
                        </TableCell>

                        {/* SHIFT */}

                        <TableCell align="center">
                          {shiftName}
                        </TableCell>

                        {/* OPERATOR */}

                        <TableCell align="center">
                          {record.operatorName ||
                            "-"}
                        </TableCell>

                        {/* COMPUTER CODE */}

                        <TableCell align="center">
                          {record.computerCode ||
                            "-"}
                        </TableCell>

                        {/* PRODUCT */}

                        <TableCell
                          align="left"
                          className="font-medium text-gray-700"
                        >
                          {record.product
                            ?.productName ||
                            "-"}
                        </TableCell>

                        {/* DESCRIPTION */}

                        <TableCell
                          align="left"
                          className="max-w-xs text-gray-600"
                        >

                          <div
                            className="truncate"
                            title={
                              record.product
                                ?.description ||
                              ""
                            }
                          >
                            {record.product
                              ?.description ||
                              "-"}
                          </div>

                        </TableCell>

                        {/* OUTPUT */}

                        <TableCell className="font-medium text-gray-700">

                          {formatNumber(
                            outputQty,
                            2
                          )}

                          {quantityUnit && (
                            <span className="ml-1 text-xs text-gray-400">
                              {quantityUnit}
                            </span>
                          )}

                        </TableCell>

                        {/* OK */}

                        <TableCell className="text-gray-600">

                          {formatNumber(
                            okQty,
                            2
                          )}

                          {quantityUnit && (
                            <span className="ml-1 text-xs text-gray-400">
                              {quantityUnit}
                            </span>
                          )}

                        </TableCell>

                        {/* NG */}

                        <TableCell className="font-medium text-red-600">

                          {formatNumber(
                            pmc.ngQty,
                            2
                          )}

                          {quantityUnit && (
                            <span className="ml-1 text-xs text-gray-400">
                              {quantityUnit}
                            </span>
                          )}

                        </TableCell>

                        {/* NG RATE */}

                        <TableCell className="font-medium text-red-600">
                          {formatNumber(
                            pmc.ngRate,
                            2
                          )}
                          %
                        </TableCell>

                        {/* ACTUAL RM */}

                        <TableCell className="text-gray-600">

                          {formatNumber(
                            actualRm,
                            3
                          )}

                          <span className="ml-1 text-xs text-gray-400">
                            {rmUnit}
                          </span>

                        </TableCell>

                        {/* RM REQUIREMENT */}

                        <TableCell className="font-medium text-gray-700">

                          {formatNumber(
                            pmc.rmRequirement,
                            3
                          )}

                          <span className="ml-1 text-xs text-gray-400">
                            {rmUnit}
                          </span>

                        </TableCell>

                        {/* RM VARIANCE */}

                        <TableCell
                          className={
                            pmc.rmVariance > 0
                              ? "font-medium text-red-600"
                              : pmc.rmVariance < 0
                                ? "font-medium text-green-600"
                                : "font-medium text-gray-600"
                          }
                        >

                          {formatNumber(
                            pmc.rmVariance,
                            3
                          )}

                          <span className="ml-1 text-xs text-gray-400">
                            {rmUnit}
                          </span>

                        </TableCell>

                        {/* RM PERCENTAGE */}

                        <TableCell className="text-gray-600">

                          {formatNumber(
                            pmc.rmPercentage,
                            2
                          )}
                          %

                        </TableCell>

                        {/* TARGET */}

                        <TableCell className="font-semibold text-blue-700">

                          {target8H > 0
                            ? formatNumber(
                                target8H,
                                2
                              )
                            : "-"}

                          {quantityUnit &&
                            target8H > 0 && (
                              <span className="ml-1 text-xs font-normal text-gray-400">
                                {
                                  quantityUnit
                                }
                              </span>
                            )}

                        </TableCell>

                        {/* PRODUCT VARIANCE */}

                        <TableCell
                          className={
                            pmc.productVariance >=
                            0
                              ? "font-semibold text-green-600"
                              : "font-semibold text-red-600"
                          }
                        >

                          {formatNumber(
                            pmc.productVariance,
                            2
                          )}

                          {quantityUnit && (
                            <span className="ml-1 text-xs font-normal text-gray-400">
                              {
                                quantityUnit
                              }
                            </span>
                          )}

                        </TableCell>

                        {/* ACHIEVEMENT */}

                        <TableCell
                          className={
                            pmc.achievement >=
                            100
                              ? "font-semibold text-green-600"
                              : pmc.achievement >=
                                  80
                                ? "font-semibold text-yellow-600"
                                : "font-semibold text-red-600"
                          }
                        >

                          {target8H > 0
                            ? `${formatNumber(
                                pmc.achievement,
                                2
                              )}%`
                            : "-"}

                        </TableCell>

                        {/* OT / REPLACE */}

                        <TableCell align="center">
                          {record.otReplace ||
                            "-"}
                        </TableCell>

                        {/* REMARKS */}

                        <TableCell align="left">
                          {record.remarks ||
                            "-"}
                        </TableCell>

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
          PAGINATION
      ===================================================== */}

      {!isLoading &&
        !invalidDateRange &&
        filteredProductionData.length >
          0 && (

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

            {/* INFO */}

            <p className="text-xs text-gray-500">

              Showing{" "}

              <span className="font-semibold text-gray-700">
                {firstItem}
              </span>

              {" - "}

              <span className="font-semibold text-gray-700">
                {lastItem}
              </span>

              {" of "}

              <span className="font-semibold text-gray-700">
                {
                  filteredProductionData.length
                }
              </span>

              {" production records"}

            </p>

            {/* PAGINATION */}

            {totalPages > 1 && (

              <div className="flex items-center gap-1">

                {/* PREVIOUS */}

                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      currentPage - 1
                    )
                  }
                  disabled={
                    currentPage === 1
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {/* FIRST PAGE */}

                {pageNumbers[0] >
                  1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        goToPage(1)
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      1
                    </button>

                    {pageNumbers[0] >
                      2 && (
                      <span className="px-1 text-gray-400">
                        ...
                      </span>
                    )}
                  </>
                )}

                {/* PAGE NUMBERS */}

                {pageNumbers.map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        goToPage(page)
                      }
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        currentPage ===
                        page
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* LAST PAGE */}

                {pageNumbers[
                  pageNumbers.length -
                    1
                ] < totalPages && (
                  <>
                    {pageNumbers[
                      pageNumbers.length -
                        1
                    ] <
                      totalPages -
                        1 && (
                      <span className="px-1 text-gray-400">
                        ...
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          totalPages
                        )
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* NEXT */}

                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      currentPage + 1
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>

              </div>
            )}

          </div>
        )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-xs text-gray-400">
          Scroll horizontally untuk melihat seluruh kolom
        </p>

        <p className="text-xs text-gray-400">
          {ITEMS_PER_PAGE} records per page
        </p>

      </div>

    </div>
  );
}