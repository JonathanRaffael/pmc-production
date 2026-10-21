"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

// =====================================================
// TYPES
// =====================================================

type Area = {
  id: number;
  code: string;
  name: string;
  isActive?: boolean;
};

type Shift = {
  id: number;
  code: string;
  name: string;
  isActive?: boolean;
};

type ProductionTarget = {
  id: number;
  target8H: number | string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive?: boolean;
};

type Product = {
  id: number;
  productCode: string;
  productName: string;
  description: string | null;

  shotWeight: number | string | null;
  shotWeightUnit: string | null;
  quantityUnit: string | null;

  productionTarget8H?: number | string | null;
  productionTargets?: ProductionTarget[];

  isActive: boolean;
};

type ComputerData = {
  computerCode: string;

  product?: Product | null;

  // Tetap didefinisikan untuk kompatibilitas response API,
  // tetapi TIDAK digunakan untuk auto-fill Operator,
  // Area, atau Shift.
  operatorName?: string | null;
  area?: Area | null;
  shift?: Shift | null;
};

type ProductionRecord = {
  id: number;

  productionDate?: string;

  area?: {
    id: number;
    code: string;
    name: string;
  } | null;

  shift?: {
    id: number;
    code: string;
    name: string;
  } | null;

  product?: {
    id: number;
    productCode: string;
    productName: string;
  } | null;

  computerCode: string | null;

  outputQty?: number | string;
  okQty?: number | string;
  actualRm?: number | string;
};

// =====================================================
// PMC CALCULATION
// =====================================================

interface PMCCalculationInput {
  outputQty: number;
  okQty: number;
  actualRm: number;
  shotWeight: number;
  target8H: number;
}

interface PMCCalculationResult {
  ngQty: number;
  ngRate: number;

  rmRequirement: number;
  rmVariance: number;
  rmPercentage: number;

  productVariance: number;
  achievement: number;
}

// =====================================================
// CALCULATE PMC
// =====================================================

function calculatePMC({
  outputQty,
  okQty,
  actualRm,
  shotWeight,
  target8H,
}: PMCCalculationInput): PMCCalculationResult {
  // ===================================================
  // 1. TOTAL NG PRODUCT
  //
  // Output Production - Product OK
  // ===================================================

  const ngQty = Math.max(
    outputQty - okQty,
    0
  );

  // ===================================================
  // 2. PRODUCT RATE NG (%)
  //
  // Total NG Product / Output Production × 100
  // ===================================================

  const ngRate =
    outputQty > 0
      ? (ngQty / outputQty) * 100
      : 0;

  // ===================================================
  // 3. RAW MATERIAL REQUIREMENT
  //
  // (Output Production × Shot Weight)
  // + (5 × Shot Weight)
  //
  // Sama dengan:
  // (Output Production + 5) × Shot Weight
  // ===================================================

  const rmRequirement =
    outputQty * shotWeight +
    5 * shotWeight;

  // ===================================================
  // 4. VARIANCE RAW MATERIAL
  //
  // Actual RM Usage - RM Requirement
  // ===================================================

  const rmVariance =
    actualRm - rmRequirement;

  // ===================================================
  // 5. RAW MATERIAL PERCENTAGE (%)
  //
  // Actual RM Usage / RM Requirement × 100
  // ===================================================

  const rmPercentage =
    rmRequirement > 0
      ? (actualRm / rmRequirement) * 100
      : 0;

  // ===================================================
  // 6. VARIANCE PRODUCT
  //
  // Output Production - Target Production / 8H
  // ===================================================

  const productVariance =
    outputQty - target8H;

  // ===================================================
  // 7. ACHIEVEMENT (%)
  //
  // Output Production / Target Production / 8H × 100
  // ===================================================

  const achievement =
    target8H > 0
      ? (outputQty / target8H) * 100
      : 0;

  return {
    ngQty,
    ngRate,

    rmRequirement,
    rmVariance,
    rmPercentage,

    productVariance,
    achievement,
  };
}

// =====================================================
// PAGE
// =====================================================

export default function ProductionPage() {
  // ===================================================
  // MASTER DATA
  // ===================================================

  const [areas, setAreas] =
    useState<Area[]>([]);

  const [shifts, setShifts] =
    useState<Shift[]>([]);

  const [loadingMasterData, setLoadingMasterData] =
    useState(true);

  // ===================================================
  // COMPUTER DATA
  // ===================================================

  const [computerData, setComputerData] =
    useState<ComputerData | null>(null);

  const [computerLoading, setComputerLoading] =
    useState(false);

  // ===================================================
  // EXISTING PRODUCTION
  // ===================================================

  const [productionRecords, setProductionRecords] =
    useState<ProductionRecord[]>([]);

  // ===================================================
  // FORM
  // ===================================================

  const [productionDate, setProductionDate] =
    useState(() => {
      const now = new Date();

      const year =
        now.getFullYear();

      const month =
        String(
          now.getMonth() + 1
        ).padStart(2, "0");

      const day =
        String(
          now.getDate()
        ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    });

  // ===================================================
  // MANUAL AREA
  // ===================================================

  const [areaId, setAreaId] =
    useState("");

  // ===================================================
  // MANUAL SHIFT
  // ===================================================

  const [shiftId, setShiftId] =
    useState("");

  // ===================================================
  // MANUAL MACHINE NO.
  // ===================================================

  const [machineNo, setMachineNo] =
    useState("");

  // ===================================================
  // COMPUTER CODE
  // ===================================================

  const [computerCode, setComputerCode] =
    useState("");

  // ===================================================
  // MANUAL OPERATOR
  // ===================================================

  const [operatorName, setOperatorName] =
    useState("");

  // ===================================================
  // PRODUCTION INPUT
  // ===================================================

  const [outputQty, setOutputQty] =
    useState("");

  const [okQty, setOkQty] =
    useState("");

  const [actualRawMaterial, setActualRawMaterial] =
    useState("");

  const [otReplace, setOtReplace] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  // ===================================================
  // STATE
  // ===================================================

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD MASTER AREA + SHIFT
  // =====================================================

  async function loadMasterData() {
    try {
      setLoadingMasterData(true);
      setError("");

      const [
        areasResponse,
        shiftsResponse,
      ] = await Promise.all([
        fetch("/api/areas", {
          method: "GET",
          cache: "no-store",
        }),

        fetch("/api/shifts", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const areasData =
        await areasResponse.json();

      const shiftsData =
        await shiftsResponse.json();

      if (
        !areasResponse.ok ||
        !shiftsResponse.ok
      ) {
        throw new Error(
          "Gagal mengambil master area dan shift."
        );
      }

      const areaList =
        Array.isArray(areasData)
          ? areasData
          : Array.isArray(
              areasData.areas
            )
          ? areasData.areas
          : Array.isArray(
              areasData.data
            )
          ? areasData.data
          : [];

      const shiftList =
        Array.isArray(shiftsData)
          ? shiftsData
          : Array.isArray(
              shiftsData.shifts
            )
          ? shiftsData.shifts
          : Array.isArray(
              shiftsData.data
            )
          ? shiftsData.data
          : [];

      setAreas(
        areaList.filter(
          (item: Area) =>
            item.isActive !== false
        )
      );

      setShifts(
        shiftList.filter(
          (item: Shift) =>
            item.isActive !== false
        )
      );
    } catch (error) {
      console.error(
        "Load master data error:",
        error
      );

      setError(
        "Gagal mengambil master Area dan Shift."
      );
    } finally {
      setLoadingMasterData(false);
    }
  }

  useEffect(() => {
    loadMasterData();
  }, []);

  // =====================================================
  // LOAD PRODUCTION RECORDS
  // =====================================================

  async function loadProductionRecords() {
    try {
      const response =
        await fetch(
          "/api/production",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Gagal mengambil data production."
        );
      }

      const records =
        Array.isArray(data)
          ? data
          : Array.isArray(
              data.data
            )
          ? data.data
          : [];

      setProductionRecords(
        records
      );
    } catch (error) {
      console.error(
        "Load production records error:",
        error
      );

      setProductionRecords([]);
    }
  }

  useEffect(() => {
    loadProductionRecords();
  }, []);

  // =====================================================
  // FIND COMPUTER CODE
  //
  // Computer Code hanya digunakan untuk mencari PRODUCT.
  //
  // TIDAK:
  // - auto-fill Operator
  // - auto-fill Area
  // - auto-fill Shift
  // =====================================================

  async function findComputerCode(
    code?: string
  ) {
    const value =
      (
        code ??
        computerCode
      )
        .trim()
        .toUpperCase();

    if (!value) {
      setComputerData(null);
      return;
    }

    try {
      setComputerLoading(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/production/computer-codes?code=${encodeURIComponent(
            value
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      console.log(
        "Computer Code response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Computer Code tidak ditemukan."
        );
      }

      // =================================================
      // SUPPORT BEBERAPA FORMAT RESPONSE API
      // =================================================

      const result: ComputerData =
        data.data ??
        data.computer ??
        data;

      // =================================================
      // PRODUCT
      // =================================================

      if (!result?.product) {
        throw new Error(
          "Computer Code ditemukan tetapi Product belum terhubung."
        );
      }

      setComputerData(
        result
      );

      // =================================================
      // COMPUTER CODE
      // =================================================

      setComputerCode(
        result.computerCode ??
          value
      );

      // =================================================
      // JANGAN AUTO-FILL:
      //
      // Operator
      // Area
      // Shift
      // =================================================

      setMessage(
        "Computer Code ditemukan. Data product otomatis terisi."
      );
    } catch (error) {
      console.error(
        "Find computer code error:",
        error
      );

      setComputerData(null);

      setError(
        error instanceof Error
          ? error.message
          : "Gagal mencari Computer Code."
      );
    } finally {
      setComputerLoading(false);
    }
  }

  // =====================================================
  // COMPUTER CODE BLUR
  // =====================================================

  function handleComputerBlur() {
    findComputerCode(
      computerCode
    );
  }

  // =====================================================
  // COMPUTER CODE ENTER
  // =====================================================

  function handleComputerKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      findComputerCode(
        computerCode
      );
    }
  }

  // =====================================================
  // SELECTED PRODUCT
  // =====================================================

  const selectedProduct =
    computerData?.product ??
    null;

  // =====================================================
  // PRODUCTION TARGET
  //
  // Target diambil dari Product.
  // Jika terdapat beberapa target berdasarkan periode,
  // pilih target yang berlaku pada Production Date.
  // =====================================================

  const productionTarget =
    useMemo(() => {
      if (!selectedProduct) {
        return 0;
      }

      const productionDateValue =
        new Date(
          `${productionDate}T00:00:00`
        );

      // =================================================
      // PRIORITAS 1
      // PRODUCTION TARGETS
      // =================================================

      if (
        selectedProduct.productionTargets &&
        selectedProduct.productionTargets.length >
          0
      ) {
        const validTargets =
          selectedProduct.productionTargets
            .filter(
              (target) =>
                target.isActive !== false
            )
            .filter(
              (target) => {
                const effectiveFrom =
                  target.effectiveFrom
                    ? new Date(
                        target.effectiveFrom
                      )
                    : null;

                const effectiveTo =
                  target.effectiveTo
                    ? new Date(
                        target.effectiveTo
                      )
                    : null;

                if (
                  effectiveFrom &&
                  productionDateValue <
                    effectiveFrom
                ) {
                  return false;
                }

                if (
                  effectiveTo &&
                  productionDateValue >
                    effectiveTo
                ) {
                  return false;
                }

                return true;
              }
            )
            .sort(
              (
                a,
                b
              ) => {
                const dateA =
                  a.effectiveFrom
                    ? new Date(
                        a.effectiveFrom
                      ).getTime()
                    : 0;

                const dateB =
                  b.effectiveFrom
                    ? new Date(
                        b.effectiveFrom
                      ).getTime()
                    : 0;

                return (
                  dateB -
                  dateA
                );
              }
            );

        if (
          validTargets.length >
          0
        ) {
          return Number(
            validTargets[0]
              .target8H
          );
        }
      }

      // =================================================
      // PRIORITAS 2
      // PRODUCTION TARGET 8H LANGSUNG DARI PRODUCT
      // =================================================

      if (
        selectedProduct.productionTarget8H !==
          undefined &&
        selectedProduct.productionTarget8H !==
          null &&
        Number(
          selectedProduct.productionTarget8H
        ) > 0
      ) {
        return Number(
          selectedProduct.productionTarget8H
        );
      }

      return 0;
    }, [
      selectedProduct,
      productionDate,
    ]);

  // =====================================================
  // PMC CALCULATION
  // =====================================================

  const pmc =
    useMemo(() => {
      return calculatePMC({
        outputQty:
          Number(outputQty) || 0,

        okQty:
          Number(okQty) || 0,

        actualRm:
          Number(
            actualRawMaterial
          ) || 0,

        shotWeight:
          Number(
            selectedProduct?.shotWeight
          ) || 0,

        target8H:
          productionTarget,
      });
    }, [
      outputQty,
      okQty,
      actualRawMaterial,
      selectedProduct?.shotWeight,
      productionTarget,
    ]);

  // =====================================================
  // FORMAT NUMBER
  // =====================================================

  function formatNumber(
    value: number
  ) {
    return new Intl.NumberFormat(
      "id-ID",
      {
        maximumFractionDigits: 4,
      }
    ).format(value);
  }

  // =====================================================
  // FORMAT PERCENTAGE
  // =====================================================

  function formatPercentage(
    value: number
  ) {
    return `${value.toFixed(2)}%`;
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      // =================================================
      // VALIDATION
      // =================================================

      if (!productionDate) {
        setError(
          "Production Date wajib diisi."
        );
        return;
      }

      // =================================================
      // AREA MANUAL
      // =================================================

      if (!areaId) {
        setError(
          "Area wajib dipilih."
        );
        return;
      }

      // =================================================
      // SHIFT MANUAL
      // =================================================

      if (!shiftId) {
        setError(
          "Shift wajib dipilih."
        );
        return;
      }

      // =================================================
      // MACHINE NO MANUAL
      // =================================================

      if (
        !machineNo.trim()
      ) {
        setError(
          "Machine No. wajib diisi."
        );
        return;
      }

      // =================================================
      // OPERATOR MANUAL
      // =================================================

      if (
        !operatorName.trim()
      ) {
        setError(
          "Operator / PIC wajib diisi."
        );
        return;
      }

      // =================================================
      // COMPUTER CODE
      // =================================================

      if (
        !computerCode.trim()
      ) {
        setError(
          "Computer Code wajib diisi."
        );
        return;
      }

      if (!computerData) {
        setError(
          "Computer Code belum ditemukan."
        );
        return;
      }

      // =================================================
      // PRODUCT
      // =================================================

      if (!selectedProduct) {
        setError(
          "Product dari Computer Code belum ditemukan."
        );
        return;
      }

      // =================================================
      // SHOT WEIGHT
      // =================================================

      const parsedShotWeight =
        Number(
          selectedProduct.shotWeight
        );

      if (
        !Number.isFinite(
          parsedShotWeight
        ) ||
        parsedShotWeight <= 0
      ) {
        setError(
          "Shot Weight Product tidak valid."
        );
        return;
      }

      // =================================================
      // TARGET 8H
      // =================================================

      if (
        !Number.isFinite(
          productionTarget
        ) ||
        productionTarget <= 0
      ) {
        setError(
          "Target Production / 8H belum tersedia untuk Product ini."
        );
        return;
      }

      // =================================================
      // OUTPUT
      // =================================================

      if (
        outputQty === "" ||
        !Number.isFinite(
          Number(outputQty)
        ) ||
        Number(outputQty) < 0
      ) {
        setError(
          "Output Production tidak valid."
        );
        return;
      }

      // =================================================
      // OK
      // =================================================

      if (
        okQty === "" ||
        !Number.isFinite(
          Number(okQty)
        ) ||
        Number(okQty) < 0
      ) {
        setError(
          "Quantity Product OK wajib diisi dan harus valid."
        );
        return;
      }

      const parsedOutput =
        Number(outputQty);

      const parsedOk =
        Number(okQty);

      // =================================================
      // OK TIDAK BOLEH LEBIH BESAR DARI OUTPUT
      // =================================================

      if (
        parsedOk >
        parsedOutput
      ) {
        setError(
          "Quantity Product OK tidak boleh lebih besar dari Output Production."
        );
        return;
      }

      // =================================================
      // ACTUAL RAW MATERIAL
      // =================================================

      if (
        actualRawMaterial === "" ||
        !Number.isFinite(
          Number(
            actualRawMaterial
          )
        ) ||
        Number(
          actualRawMaterial
        ) < 0
      ) {
        setError(
          "Total Actual Raw Material Usage wajib diisi dan tidak boleh negatif."
        );
        return;
      }

      const parsedActualRm =
        Number(
          actualRawMaterial
        );

      // =================================================
      // CALCULATE FINAL PMC
      // =================================================

      const calculation =
        calculatePMC({
          outputQty:
            parsedOutput,

          okQty:
            parsedOk,

          actualRm:
            parsedActualRm,

          shotWeight:
            parsedShotWeight,

          target8H:
            productionTarget,
        });

      // =================================================
      // LOG
      // =================================================

      console.log(
        "Production Submit:",
        {
          productionDate,

          machineNo:
            machineNo
              .trim()
              .toUpperCase(),

          areaId:
            Number(areaId),

          shiftId:
            Number(shiftId),

          operatorName:
            operatorName.trim(),

          computerCode:
            computerCode
              .trim()
              .toUpperCase(),

          productId:
            selectedProduct.id,

          outputQty:
            parsedOutput,

          okQty:
            parsedOk,

          ngQty:
            calculation.ngQty,

          ngRate:
            calculation.ngRate,

          shotWeight:
            parsedShotWeight,

          rmRequirement:
            calculation.rmRequirement,

          actualRm:
            parsedActualRm,

          rmVariance:
            calculation.rmVariance,

          rmPercentage:
            calculation.rmPercentage,

          target8H:
            productionTarget,

          productVariance:
            calculation.productVariance,

          achievement:
            calculation.achievement,
        }
      );

      // =================================================
      // USER
      // =================================================

      // Sementara menggunakan user ID 1.
      // Nanti bisa diganti dengan ID dari session/login.
      const inputById = 1;

      // =================================================
      // POST API
      // =================================================

      const response =
        await fetch(
          "/api/production",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              productionDate,

              areaId:
                Number(areaId),

              shiftId:
                Number(shiftId),

              // =================================================
              // MACHINE NO MANUAL
              // =================================================

              machineNo:
                machineNo
                  .trim()
                  .toUpperCase(),

              // =================================================
              // PRODUCT OTOMATIS DARI COMPUTER CODE
              // =================================================

              productId:
                selectedProduct.id,

              // =================================================
              // OPERATOR MANUAL
              // =================================================

              operatorName:
                operatorName.trim(),

              // =================================================
              // COMPUTER CODE
              // =================================================

              computerCode:
                computerCode
                  .trim()
                  .toUpperCase(),

              // =================================================
              // PRODUCTION INPUT
              // =================================================

              outputQty:
                parsedOutput,

              okQty:
                parsedOk,

              // NG TIDAK DISIMPAN KE DATABASE.
              // NG dihitung dari Output - OK.

              actualRm:
                parsedActualRm,

              // =================================================
              // OTHER
              // =================================================

              otReplace:
                otReplace.trim() ||
                null,

              remarks:
                remarks.trim() ||
                null,

              inputById,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Gagal menyimpan production."
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      setMessage(
        "Production berhasil disimpan."
      );

      // =================================================
      // RESET PRODUCTION INPUT
      // =================================================

      setOutputQty("");
      setOkQty("");
      setActualRawMaterial("");
      setOtReplace("");
      setRemarks("");

      // Computer Code tetap.
      // Product tetap.
      // Area tetap.
      // Shift tetap.
      // Machine No tetap.
      // Operator tetap.

      await loadProductionRecords();
    } catch (error) {
      console.error(
        "Submit production error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan production."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Production Input
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Input data produksi aktual
        </p>
      </div>

      {/* =================================================
          FORM CARD
      ================================================= */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Production Entry
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Masukkan data produksi sesuai hasil aktual di lapangan.
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="grid gap-5 md:grid-cols-2"
        >

          {/* =================================================
              PRODUCTION DATE
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Production Date
            </label>

            <input
              type="date"
              value={
                productionDate
              }
              onChange={(
                event
              ) =>
                setProductionDate(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          {/* =================================================
              MACHINE NO
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Machine No.
            </label>

            <input
              type="text"
              value={
                machineNo
              }
              onChange={(
                event
              ) =>
                setMachineNo(
                  event.target.value
                )
              }
              placeholder="Ketik Machine No."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />

            <p className="mt-1 text-xs text-gray-400">
              Machine No. diinput manual.
            </p>
          </div>

          {/* =================================================
              AREA
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Area
            </label>

            <select
              value={
                areaId
              }
              onChange={(
                event
              ) =>
                setAreaId(
                  event.target.value
                )
              }
              disabled={
                loadingMasterData
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            >
              <option value="">
                {loadingMasterData
                  ? "Loading area..."
                  : "Pilih Area"}
              </option>

              {areas.map(
                (
                  area
                ) => (
                  <option
                    key={
                      area.id
                    }
                    value={
                      area.id
                    }
                  >
                    {
                      area.code
                    }{" "}
                    -{" "}
                    {
                      area.name
                    }
                  </option>
                )
              )}
            </select>

            <p className="mt-1 text-xs text-gray-400">
              Area diinput manual.
            </p>
          </div>

          {/* =================================================
              SHIFT
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Shift
            </label>

            <select
              value={
                shiftId
              }
              onChange={(
                event
              ) =>
                setShiftId(
                  event.target.value
                )
              }
              disabled={
                loadingMasterData
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            >
              <option value="">
                {loadingMasterData
                  ? "Loading shift..."
                  : "Pilih Shift"}
              </option>

              {shifts.map(
                (
                  shift
                ) => (
                  <option
                    key={
                      shift.id
                    }
                    value={
                      shift.id
                    }
                  >
                    {
                      shift.code
                    }{" "}
                    -{" "}
                    {
                      shift.name
                    }
                  </option>
                )
              )}
            </select>

            <p className="mt-1 text-xs text-gray-400">
              Shift diinput manual.
            </p>
          </div>

          {/* =================================================
              COMPUTER CODE
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Computer Code
            </label>

            <input
              type="text"
              value={
                computerCode
              }
              onChange={(
                event
              ) => {
                setComputerCode(
                  event.target.value
                );

                // Jika user mengubah code,
                // product lama jangan dianggap valid.
                setComputerData(
                  null
                );
              }}
              onBlur={
                handleComputerBlur
              }
              onKeyDown={
                handleComputerKeyDown
              }
              placeholder="Ketik Computer Code"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={
                computerLoading
              }
              autoComplete="off"
            />

            <p className="mt-1 text-xs text-gray-400">
              Ketik Computer Code lalu tekan Enter atau klik field lain.
            </p>

            {computerLoading && (
              <p className="mt-1 text-xs text-blue-600">
                Mencari Computer Code...
              </p>
            )}

            {computerData && (
              <p className="mt-1 text-xs text-green-600">
                Computer Code ditemukan. Data Product otomatis terisi.
              </p>
            )}
          </div>

          {/* =================================================
              OPERATOR / PIC
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Operator / PIC
            </label>

            <input
              type="text"
              value={
                operatorName
              }
              onChange={(
                event
              ) =>
                setOperatorName(
                  event.target.value
                )
              }
              placeholder="Ketik nama Operator / PIC"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />

            <p className="mt-1 text-xs text-gray-400">
              Operator / PIC diinput manual.
            </p>
          </div>

          {/* =================================================
              PRODUCT INFORMATION
          ================================================= */}

          {selectedProduct && (
            <div className="md:col-span-2 grid gap-4 md:grid-cols-4">

              {/* PRODUCT */}

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Product
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {
                    selectedProduct.productCode
                  }
                </p>

                <p className="text-xs text-gray-500">
                  {
                    selectedProduct.productName
                  }
                </p>

                {selectedProduct.description && (
                  <p className="mt-1 text-xs text-gray-400">
                    {
                      selectedProduct.description
                    }
                  </p>
                )}
              </div>

              {/* SHOT WEIGHT */}

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Shot Weight
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {formatNumber(
                    Number(
                      selectedProduct.shotWeight ??
                        0
                    )
                  )}{" "}
                  {
                    selectedProduct.shotWeightUnit ??
                    "KG"
                  }
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Diambil dari database Product.
                </p>
              </div>

              {/* PRODUCTION TARGET */}

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs text-blue-600">
                  Production Target / 8H
                </p>

                <p className="mt-1 font-semibold text-blue-900">
                  {productionTarget >
                  0
                    ? `${formatNumber(
                        productionTarget
                      )} ${
                        selectedProduct.quantityUnit ??
                        "PCS"
                      }`
                    : "-"}
                </p>

                <p className="mt-1 text-xs text-blue-500">
                  Diambil dari database target.
                </p>
              </div>

              {/* QUANTITY UNIT */}

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Quantity Unit
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {
                    selectedProduct.quantityUnit ??
                    "-"
                  }
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              OUTPUT PRODUCTION
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Output Production
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                outputQty
              }
              onChange={(
                event
              ) =>
                setOutputQty(
                  event.target.value
                )
              }
              placeholder="Contoh: 4800"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />

            <p className="mt-1 text-xs text-gray-400">
              Total hasil produksi.
              Unit:{" "}
              {
                selectedProduct?.quantityUnit ??
                "-"
              }
            </p>
          </div>

          {/* =================================================
              QUANTITY PRODUCT OK
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quantity Product OK
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                okQty
              }
              onChange={(
                event
              ) =>
                setOkQty(
                  event.target.value
                )
              }
              placeholder="Contoh: 4750"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />

            <p className="mt-1 text-xs text-gray-400">
              Jumlah product yang OK.
            </p>
          </div>

          {/* =================================================
              TOTAL NG PRODUCT
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Total NG Product
            </label>

            <input
              type="text"
              value={
                outputQty !== "" &&
                okQty !== ""
                  ? formatNumber(
                      pmc.ngQty
                    )
                  : ""
              }
              readOnly
              placeholder="Otomatis: Output - OK"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700 outline-none"
            />

            <p className="mt-1 text-xs text-gray-400">
              Output Production − Quantity Product OK
            </p>
          </div>

          {/* =================================================
              PRODUCT RATE NG
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Product Rate NG (%)
            </label>

            <input
              type="text"
              value={
                outputQty !== "" &&
                okQty !== ""
                  ? formatPercentage(
                      pmc.ngRate
                    )
                  : ""
              }
              readOnly
              placeholder="Otomatis"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-red-700 outline-none"
            />

            <p className="mt-1 text-xs text-gray-400">
              Total NG Product ÷ Output Production × 100%
            </p>
          </div>

          {/* =================================================
              ACTUAL RAW MATERIAL USAGE
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Total Actual Raw Material Usage
            </label>

            <input
              type="number"
              min="0"
              step="0.001"
              value={
                actualRawMaterial
              }
              onChange={(
                event
              ) =>
                setActualRawMaterial(
                  event.target.value
                )
              }
              placeholder="Contoh: 70.500"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />

            <p className="mt-1 text-xs text-gray-400">
              Actual raw material usage dalam KG.
            </p>
          </div>

          {/* =================================================
              RAW MATERIAL REQUIREMENT
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Raw Material Requirement
            </label>

            <input
              type="text"
              value={
                outputQty !== "" &&
                selectedProduct
                  ? `${formatNumber(
                      pmc.rmRequirement
                    )} KG`
                  : ""
              }
              readOnly
              placeholder="Otomatis"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700 outline-none"
            />

            <p className="mt-1 text-xs text-gray-400">
              (Output × Shot Weight) + (5 × Shot Weight)
            </p>
          </div>

          {/* =================================================
              VARIANCE RAW MATERIAL
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Variance Raw Material
            </label>

            <input
              type="text"
              value={
                outputQty !== "" &&
                actualRawMaterial !== "" &&
                selectedProduct
                  ? `${formatNumber(
                      pmc.rmVariance
                    )} KG`
                  : ""
              }
              readOnly
              placeholder="Otomatis"
              className={`w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 outline-none ${
                pmc.rmVariance > 0
                  ? "text-red-700"
                  : pmc.rmVariance < 0
                  ? "text-green-700"
                  : "text-gray-700"
              }`}
            />

            <p className="mt-1 text-xs text-gray-400">
              Actual RM Usage − RM Requirement
            </p>
          </div>

          {/* =================================================
              RAW MATERIAL PERCENTAGE
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Raw Material Percentage (%)
            </label>

            <input
              type="text"
              value={
                outputQty !== "" &&
                actualRawMaterial !== "" &&
                selectedProduct
                  ? formatPercentage(
                      pmc.rmPercentage
                    )
                  : ""
              }
              readOnly
              placeholder="Otomatis"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700 outline-none"
            />

            <p className="mt-1 text-xs text-gray-400">
              Actual RM Usage ÷ RM Requirement × 100%
            </p>
          </div>

          {/* =================================================
              VARIANCE PRODUCT
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Variance Product
            </label>

            <input
              type="text"
              value={
                outputQty !== "" &&
                productionTarget > 0
                  ? `${pmc.productVariance >= 0 ? "+" : ""}${formatNumber(
                      pmc.productVariance
                    )} ${
                      selectedProduct?.quantityUnit ??
                      ""
                    }`
                  : ""
              }
              readOnly
              placeholder="Otomatis"
              className={`w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 outline-none ${
                pmc.productVariance > 0
                  ? "text-green-700"
                  : pmc.productVariance < 0
                  ? "text-red-700"
                  : "text-gray-700"
              }`}
            />

            <p className="mt-1 text-xs text-gray-400">
              Output Production − Target Production / 8H
            </p>
          </div>

          {/* =================================================
              ACHIEVEMENT
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Achievement (%)
            </label>

            <input
              type="text"
              value={
                outputQty !== "" &&
                productionTarget > 0
                  ? formatPercentage(
                      pmc.achievement
                    )
                  : ""
              }
              readOnly
              placeholder="Otomatis"
              className={`w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 outline-none ${
                pmc.achievement >= 100
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            />

            <p className="mt-1 text-xs text-gray-400">
              Output Production ÷ Target Production / 8H × 100%
            </p>
          </div>

          {/* =================================================
              OT / REPLACE
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              OT / Replace
            </label>

            <input
              type="text"
              value={
                otReplace
              }
              onChange={(
                event
              ) =>
                setOtReplace(
                  event.target.value
                )
              }
              placeholder="Contoh: OT 2 Jam"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* =================================================
              REMARKS
          ================================================= */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Remarks
            </label>

            <textarea
              value={
                remarks
              }
              onChange={(
                event
              ) =>
                setRemarks(
                  event.target.value
                )
              }
              rows={3}
              placeholder="Catatan production..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* =================================================
              PMC SUMMARY
          ================================================= */}

          {outputQty !== "" &&
            okQty !== "" && (
              <div className="md:col-span-2 rounded-xl border border-gray-200 bg-slate-50 p-5">

                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    PMC Calculation
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Hasil perhitungan otomatis berdasarkan data produksi.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  {/* OUTPUT */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      Output Production
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {formatNumber(
                        Number(
                          outputQty
                        )
                      )}{" "}
                      {
                        selectedProduct?.quantityUnit ??
                        ""
                      }
                    </p>
                  </div>

                  {/* OK */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      Quantity Product OK
                    </p>

                    <p className="mt-1 text-lg font-bold text-green-600">
                      {formatNumber(
                        Number(
                          okQty
                        )
                      )}{" "}
                      {
                        selectedProduct?.quantityUnit ??
                        ""
                      }
                    </p>
                  </div>

                  {/* NG */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      Total NG Product
                    </p>

                    <p className="mt-1 text-lg font-bold text-red-600">
                      {formatNumber(
                        pmc.ngQty
                      )}{" "}
                      {
                        selectedProduct?.quantityUnit ??
                        ""
                      }
                    </p>
                  </div>

                  {/* NG RATE */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      Product Rate NG
                    </p>

                    <p className="mt-1 text-lg font-bold text-red-600">
                      {formatPercentage(
                        pmc.ngRate
                      )}
                    </p>
                  </div>

                  {/* SHOT WEIGHT */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      Shot Weight
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {formatNumber(
                        Number(
                          selectedProduct?.shotWeight ??
                            0
                        )
                      )}{" "}
                      {
                        selectedProduct?.shotWeightUnit ??
                        "KG"
                      }
                    </p>
                  </div>

                  {/* RM REQUIREMENT */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      RM Requirement
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {formatNumber(
                        pmc.rmRequirement
                      )}{" "}
                      KG
                    </p>
                  </div>

                  {/* ACTUAL RM */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      Actual RM Usage
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {actualRawMaterial !==
                      ""
                        ? `${formatNumber(
                            Number(
                              actualRawMaterial
                            )
                          )} KG`
                        : "-"}
                    </p>
                  </div>

                  {/* RM VARIANCE */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      RM Variance
                    </p>

                    <p
                      className={`mt-1 text-lg font-bold ${
                        pmc.rmVariance > 0
                          ? "text-red-600"
                          : pmc.rmVariance < 0
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      {pmc.rmVariance >= 0
                        ? "+"
                        : ""}
                      {formatNumber(
                        pmc.rmVariance
                      )}{" "}
                      KG
                    </p>
                  </div>

                  {/* RM PERCENTAGE */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      RM Percentage
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {formatPercentage(
                        pmc.rmPercentage
                      )}
                    </p>
                  </div>

                  {/* TARGET */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      Target Production / 8H
                    </p>

                    <p className="mt-1 text-lg font-bold text-blue-700">
                      {productionTarget >
                      0
                        ? `${formatNumber(
                            productionTarget
                          )} ${
                            selectedProduct?.quantityUnit ??
                            ""
                          }`
                        : "-"}
                    </p>
                  </div>

                  {/* PRODUCT VARIANCE */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      Variance Product
                    </p>

                    <p
                      className={`mt-1 text-lg font-bold ${
                        pmc.productVariance >=
                        0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {pmc.productVariance >=
                      0
                        ? "+"
                        : ""}
                      {formatNumber(
                        pmc.productVariance
                      )}{" "}
                      {
                        selectedProduct?.quantityUnit ??
                        ""
                      }
                    </p>
                  </div>

                  {/* ACHIEVEMENT */}

                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">
                      Achievement
                    </p>

                    <p
                      className={`mt-1 text-lg font-bold ${
                        pmc.achievement >=
                        100
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatPercentage(
                        pmc.achievement
                      )}
                    </p>
                  </div>

                </div>
              </div>
            )}

          {/* =================================================
              MESSAGE
          ================================================= */}

          <div className="md:col-span-2">

            {message && (
              <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* =================================================
                SAVE
            ================================================= */}

            <button
              type="submit"
              disabled={
                loading ||
                loadingMasterData ||
                computerLoading
              }
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Menyimpan..."
                : "Save Production"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}