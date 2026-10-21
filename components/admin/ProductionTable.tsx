"use client";

import { useEffect, useState } from "react";
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

  // ===================================================
  // MACHINE NO
  // ===================================================

  machineNo: string | null;

  // ===================================================
  // AREA
  // ===================================================

  area: {
    id?: number;
    code: string;
    name: string;
  } | null;

  // ===================================================
  // SHIFT
  // ===================================================

  shift: {
    id?: number;
    code: string;
    name: string;
  } | null;

  // ===================================================
  // PRODUCT
  // ===================================================

  product: {
    id?: number;
    productCode: string;
    productName: string;
    description: string | null;

    shotWeight: number | string | null;
    shotWeightUnit?: string | null;
    quantityUnit?: string | null;
  } | null;

  // ===================================================
  // OPERATOR
  // ===================================================

  operatorName: string | null;

  // ===================================================
  // COMPUTER CODE
  // ===================================================

  computerCode: string | null;

  // ===================================================
  // PRODUCTION
  // ===================================================

  outputQty: number | string;
  okQty: number | string;
  actualRm: number | string;

  // ===================================================
  // TARGET
  // ===================================================

  target8H: number | string;

  targetEffectiveFrom?: string | Date | null;
  targetEffectiveTo?: string | Date | null;

  // ===================================================
  // OTHER
  // ===================================================

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

function formatNumber(
  value: number,
  decimals = 2
) {
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

function formatDate(
  date: string | Date
) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

// =====================================================
// GET MONTH
// =====================================================

function getMonth(
  date: string | Date
) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString(
    "id-ID",
    {
      month: "long",
    }
  );
}

// =====================================================
// GET DAY
// =====================================================

function getDay(
  date: string | Date
) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.getDate();
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

  const [
    productionData,
    setProductionData,
  ] = useState<ProductionRecord[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  // ===================================================
  // GET PRODUCTION DATA
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    async function fetchProductionData() {
      try {
        setLoading(true);
        setError(null);

        console.log(
          "===================================="
        );

        console.log(
          "ProductionTable: FETCH /api/production"
        );

        console.log(
          "===================================="
        );

        const response =
          await fetch(
            "/api/production",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        console.log(
          "ProductionTable API response:",
          result
        );

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Gagal mengambil data production."
          );
        }

        // =================================================
        // API RESPONSE
        //
        // {
        //   success: true,
        //   data: [...]
        // }
        // =================================================

        const records =
          Array.isArray(
            result?.data
          )
            ? result.data
            : [];

        console.log(
          "ProductionTable records:",
          records
        );

        console.log(
          "ProductionTable total:",
          records.length
        );

        if (!cancelled) {
          setProductionData(
            records
          );
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

    // =================================================
    // SELALU FETCH DARI API
    //
    // Jangan menggunakan externalProductionData
    // sebagai sumber utama karena parent bisa mengirim
    // array kosong sehingga database sebenarnya berisi
    // data tetapi table tetap menampilkan 0.
    // =================================================

    fetchProductionData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===================================================
  // FINAL LOADING STATE
  // ===================================================

  const isLoading =
    loading ||
    externalLoading;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-1 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

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
            : `${productionData.length} production record${
                productionData.length !== 1
                  ? "s"
                  : ""
              }`}

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
          TABLE CONTAINER
      ===================================================== */}

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
                    `}
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

            {/* =================================================
                LOADING
            ================================================= */}

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

            ) : productionData.length === 0 ? (

              /* =================================================
                  EMPTY
              ================================================= */

              <tr>

                <td
                  colSpan={
                    columns.length
                  }
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
                      Belum ada data produksi
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Data production akan muncul di sini setelah dilakukan input.
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              /* =================================================
                  DATA
              ================================================= */

              productionData.map(
                (
                  record,
                  index
                ) => {

                  // =================================================
                  // DATABASE VALUES
                  // =================================================

                  const outputQty =
                    Number(
                      record.outputQty
                    ) || 0;

                  const okQty =
                    Number(
                      record.okQty
                    ) || 0;

                  const actualRm =
                    Number(
                      record.actualRm
                    ) || 0;

                  const shotWeight =
                    Number(
                      record.product
                        ?.shotWeight
                    ) || 0;

                  const target8H =
                    Number(
                      record.target8H
                    ) || 0;

                  // =================================================
                  // PMC CALCULATION
                  // =================================================

                  const pmc =
                    calculatePMC({
                      outputQty,
                      okQty,
                      actualRm,
                      shotWeight,
                      target8H,
                    });

                  // =================================================
                  // UNITS
                  // =================================================

                  const rmUnit =
                    record.product
                      ?.shotWeightUnit ||
                    "KG";

                  const quantityUnit =
                    record.product
                      ?.quantityUnit ||
                    "";

                  // =================================================
                  // MACHINE NO
                  // =================================================

                  const machineNo =
                    record.machineNo?.trim() ||
                    "-";

                  // =================================================
                  // RETURN ROW
                  // =================================================

                  return (
                    <tr
                      key={record.id}
                      className="transition-colors hover:bg-slate-50"
                    >

                      {/* =================================================
                          NO
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                        {index + 1}
                      </td>

                      {/* =================================================
                          DATE
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                        {formatDate(
                          record.productionDate
                        )}
                      </td>

                      {/* =================================================
                          MONTH
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                        {getMonth(
                          record.productionDate
                        )}
                      </td>

                      {/* =================================================
                          DAYS
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                        {getDay(
                          record.productionDate
                        )}
                      </td>

                      {/* =================================================
                          MACHINE NO
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm font-medium text-gray-700">
                        {machineNo}
                      </td>

                      {/* =================================================
                          AREA
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                        {record.area?.name ||
                          record.area?.code ||
                          "-"}
                      </td>

                      {/* =================================================
                          SHIFT
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                        {record.shift?.name ||
                          record.shift?.code ||
                          "-"}
                      </td>

                      {/* =================================================
                          OPERATOR
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                        {record.operatorName ||
                          "-"}
                      </td>

                      {/* =================================================
                          COMPUTER CODE
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                        {record.computerCode ||
                          "-"}
                      </td>

                      {/* =================================================
                          PRODUCT
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        {record.product
                          ?.productName ||
                          "-"}
                      </td>

                      {/* =================================================
                          DESCRIPTION
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-left text-sm text-gray-600">
                        {record.product
                          ?.description ||
                          "-"}
                      </td>

                      {/* =================================================
                          OUTPUT
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm font-medium text-gray-700">

                        {formatNumber(
                          outputQty,
                          2
                        )}

                        {quantityUnit && (
                          <span className="ml-1 text-xs text-gray-400">
                            {quantityUnit}
                          </span>
                        )}

                      </td>

                      {/* =================================================
                          OK
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm text-gray-600">

                        {formatNumber(
                          okQty,
                          2
                        )}

                        {quantityUnit && (
                          <span className="ml-1 text-xs text-gray-400">
                            {quantityUnit}
                          </span>
                        )}

                      </td>

                      {/* =================================================
                          NG
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm font-medium text-red-600">

                        {formatNumber(
                          pmc.ngQty,
                          2
                        )}

                        {quantityUnit && (
                          <span className="ml-1 text-xs text-gray-400">
                            {quantityUnit}
                          </span>
                        )}

                      </td>

                      {/* =================================================
                          NG RATE
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm font-medium text-red-600">

                        {formatNumber(
                          pmc.ngRate,
                          2
                        )}
                        %

                      </td>

                      {/* =================================================
                          ACTUAL RM
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm text-gray-600">

                        {formatNumber(
                          actualRm,
                          3
                        )}

                        <span className="ml-1 text-xs text-gray-400">
                          {rmUnit}
                        </span>

                      </td>

                      {/* =================================================
                          RM REQUIREMENT
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm font-medium text-gray-700">

                        {formatNumber(
                          pmc.rmRequirement,
                          3
                        )}

                        <span className="ml-1 text-xs text-gray-400">
                          {rmUnit}
                        </span>

                      </td>

                      {/* =================================================
                          RM VARIANCE
                      ================================================= */}

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
                            pmc.rmVariance >
                            0
                              ? "text-red-600"
                              : pmc.rmVariance <
                                0
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

                      {/* =================================================
                          RM PERCENTAGE
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm text-gray-600">

                        {formatNumber(
                          pmc.rmPercentage,
                          2
                        )}
                        %

                      </td>

                      {/* =================================================
                          TARGET 8H
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-right text-sm font-semibold text-blue-700">

                        {target8H > 0
                          ? formatNumber(
                              target8H,
                              2
                            )
                          : "-"}

                        {quantityUnit &&
                          target8H >
                            0 && (
                            <span className="ml-1 text-xs font-normal text-gray-400">
                              {
                                quantityUnit
                              }
                            </span>
                          )}

                      </td>

                      {/* =================================================
                          PRODUCT VARIANCE
                      ================================================= */}

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
                            pmc.productVariance >=
                            0
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

                      {/* =================================================
                          ACHIEVEMENT
                      ================================================= */}

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
                            pmc.achievement >=
                            100
                              ? "text-green-600"
                              : pmc.achievement >=
                                80
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

                      {/* =================================================
                          OT / REPLACE
                      ================================================= */}

                      <td className="border-b border-r border-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                        {record.otReplace ||
                          "-"}
                      </td>

                      {/* =================================================
                          REMARKS
                      ================================================= */}

                      <td className="border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-600">
                        {record.remarks ||
                          "-"}
                      </td>

                    </tr>
                  );
                }
              )
            )}

          </tbody>

        </table>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">

        <p className="text-xs text-gray-500">

          Total production records:{" "}

          <span className="font-semibold">
            {productionData.length}
          </span>

        </p>

        <p className="text-xs text-gray-400">
          Scroll horizontally untuk melihat seluruh kolom
        </p>

      </div>

    </div>
  );
}