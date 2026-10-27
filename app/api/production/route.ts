import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// TYPES
// =====================================================

type ProductionTargetRecord = {
  id: number;
  productId: number;
  target8H: unknown;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
};

// =====================================================
// HELPER
// FIND PRODUCTION TARGET FROM ALREADY LOADED TARGETS
// =====================================================

function findProductionTarget(
  targets: ProductionTargetRecord[],
  productId: number,
  productionDate: Date
) {
  // ===================================================
  // 1. TARGET BERDASARKAN PERIODE
  // ===================================================

  const targetByPeriod = targets.find(
    (target) => {
      if (
        target.productId !==
        productId
      ) {
        return false;
      }

      if (
        !target.isActive
      ) {
        return false;
      }

      const afterStart =
        target.effectiveFrom <=
        productionDate;

      const beforeEnd =
        target.effectiveTo ===
          null ||
        target.effectiveTo >=
          productionDate;

      return (
        afterStart &&
        beforeEnd
      );
    }
  );

  if (
    targetByPeriod
  ) {
    return targetByPeriod;
  }

  // ===================================================
  // 2. FALLBACK
  // ===================================================

  const activeTargets =
    targets.filter(
      (target) =>
        target.productId ===
          productId &&
        target.isActive
    );

  if (
    activeTargets.length ===
    0
  ) {
    return null;
  }

  // effectiveFrom terbaru
  activeTargets.sort(
    (a, b) =>
      b.effectiveFrom.getTime() -
      a.effectiveFrom.getTime()
  );

  return (
    activeTargets[0] ??
    null
  );
}

// =====================================================
// GET PRODUCTION DATA
// =====================================================

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(
        request.url
      );

    // ===================================================
    // QUERY PARAMETERS
    // ===================================================

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const date =
      searchParams.get(
        "date"
      );

    const fromDate =
      searchParams.get(
        "fromDate"
      );

    const toDate =
      searchParams.get(
        "toDate"
      );

    const areaId =
      searchParams.get(
        "areaId"
      );

    const shiftId =
      searchParams.get(
        "shiftId"
      );

    const productId =
      searchParams.get(
        "productId"
      );

    const computerCode =
      searchParams.get(
        "computerCode"
      );

    // ===================================================
    // PAGINATION
    // ===================================================

    const pageParam =
      Number(
        searchParams.get(
          "page"
        ) || "1"
      );

    const limitParam =
      Number(
        searchParams.get(
          "limit"
        ) || "25"
      );

    const page =
      Number.isInteger(
        pageParam
      ) &&
      pageParam > 0
        ? pageParam
        : 1;

    const limit =
      Number.isInteger(
        limitParam
      ) &&
      limitParam > 0
        ? Math.min(
            limitParam,
            100
          )
        : 25;

    const skip =
      (page - 1) *
      limit;

    // ===================================================
    // BUILD WHERE
    // ===================================================

    const where: any =
      {};

    // ===================================================
    // SEARCH
    // ===================================================

    if (
      search
    ) {
      where.OR = [
        {
          operatorName: {
            contains:
              search,
          },
        },

        {
          computerCode: {
            contains:
              search,
          },
        },

        {
          machineNo: {
            contains:
              search,
          },
        },

        {
          otReplace: {
            contains:
              search,
          },
        },

        {
          remarks: {
            contains:
              search,
          },
        },

        {
          status: {
            contains:
              search,
          },
        },

        // ===============================================
        // PRODUCT SEARCH
        // ===============================================

        {
          product: {
            OR: [
              {
                productCode: {
                  contains:
                    search,
                },
              },

              {
                productName: {
                  contains:
                    search,
                },
              },

              {
                description: {
                  contains:
                    search,
                },
              },
            ],
          },
        },
      ];
    }

    // ===================================================
    // SINGLE DATE
    // ===================================================

    if (
      date
    ) {
      const startDate =
        new Date(
          `${date}T00:00:00`
        );

      const endDate =
        new Date(
          `${date}T23:59:59.999`
        );

      if (
        !Number.isNaN(
          startDate.getTime()
        ) &&
        !Number.isNaN(
          endDate.getTime()
        )
      ) {
        where.productionDate =
          {
            gte:
              startDate,

            lte:
              endDate,
          };
      }
    }

    // ===================================================
    // DATE RANGE
    // FROM DATE / TO DATE
    // ===================================================

    if (
      fromDate ||
      toDate
    ) {
      const productionDate: {
        gte?: Date;
        lte?: Date;
      } = {};

      // ================================================
      // FROM DATE
      // ================================================

      if (
        fromDate
      ) {
        const startDate =
          new Date(
            `${fromDate}T00:00:00`
          );

        if (
          !Number.isNaN(
            startDate.getTime()
          )
        ) {
          productionDate.gte =
            startDate;
        }
      }

      // ================================================
      // TO DATE
      // ================================================

      if (
        toDate
      ) {
        const endDate =
          new Date(
            `${toDate}T23:59:59.999`
          );

        if (
          !Number.isNaN(
            endDate.getTime()
          )
        ) {
          productionDate.lte =
            endDate;
        }
      }

      // ================================================
      // APPLY DATE RANGE
      // ================================================

      if (
        productionDate.gte ||
        productionDate.lte
      ) {
        where.productionDate =
          productionDate;
      }
    }

    // ===================================================
    // AREA
    // ===================================================

    if (
      areaId
    ) {
      const parsedAreaId =
        Number(
          areaId
        );

      if (
        Number.isInteger(
          parsedAreaId
        )
      ) {
        where.areaId =
          parsedAreaId;
      }
    }

    // ===================================================
    // SHIFT
    // ===================================================

    if (
      shiftId
    ) {
      const parsedShiftId =
        Number(
          shiftId
        );

      if (
        Number.isInteger(
          parsedShiftId
        )
      ) {
        where.shiftId =
          parsedShiftId;
      }
    }

    // ===================================================
    // PRODUCT
    // ===================================================

    if (
      productId
    ) {
      const parsedProductId =
        Number(
          productId
        );

      if (
        Number.isInteger(
          parsedProductId
        )
      ) {
        where.productId =
          parsedProductId;
      }
    }

    // ===================================================
    // COMPUTER CODE
    // ===================================================

    if (
      computerCode?.trim()
    ) {
      where.computerCode =
        computerCode
          .trim()
          .toUpperCase();
    }

    // ===================================================
    // COUNT TOTAL DATA
    // ===================================================

    const total =
      await prisma.productionRecord.count(
        {
          where,
        }
      );

    // ===================================================
    // GET CURRENT PAGE ONLY
    // ===================================================

    const productionRecords =
      await prisma.productionRecord.findMany(
        {
          where,

          // =============================================
          // SORTING
          // PALING LAMA DIBUAT → PALING BARU
          // =============================================

          orderBy: [
            {
              createdAt:
                "asc",
            },

            {
              id:
                "asc",
            },
          ],

          // =============================================
          // PAGINATION
          // =============================================

          skip,

          take:
            limit,

          // =============================================
          // RELATIONS
          // =============================================

          include: {
            // =========================================
            // AREA
            // =========================================

            area: true,

            // =========================================
            // SHIFT
            // =========================================

            shift: true,

            // =========================================
            // PRODUCT
            // =========================================

            product: {
              select: {
                id:
                  true,

                productCode:
                  true,

                productName:
                  true,

                description:
                  true,

                quantityUnit:
                  true,

                shotWeight:
                  true,

                shotWeightUnit:
                  true,

                isActive:
                  true,
              },
            },

            // =========================================
            // INPUT USER
            // =========================================

            inputBy: {
              select: {
                id:
                  true,

                name:
                  true,

                email:
                  true,
              },
            },
          },
        }
      );

    // ===================================================
    // GET UNIQUE PRODUCT IDS
    // FROM CURRENT PAGE ONLY
    // ===================================================

    const productIds =
      Array.from(
        new Set(
          productionRecords.map(
            (
              record
            ) =>
              record.productId
          )
        )
      );

    // ===================================================
    // GET PRODUCTION TARGETS
    // ONLY FOR PRODUCTS ON CURRENT PAGE
    // ===================================================

    const targets =
      productIds.length >
      0
        ? await prisma.productionTarget.findMany(
            {
              where: {
                productId: {
                  in:
                    productIds,
                },

                isActive:
                  true,
              },

              orderBy: {
                effectiveFrom:
                  "desc",
              },

              select: {
                id:
                  true,

                productId:
                  true,

                target8H:
                  true,

                effectiveFrom:
                  true,

                effectiveTo:
                  true,

                isActive:
                  true,
              },
            }
          )
        : [];

    // ===================================================
    // FORMAT RESULT
    // ===================================================

    const result =
      productionRecords.map(
        (
          record
        ) => {
          // =============================================
          // FIND TARGET FROM MEMORY
          // =============================================

          const target =
            findProductionTarget(
              targets,
              record.productId,
              record.productionDate
            );

          // =============================================
          // NUMBER VALUES
          // =============================================

          const outputQty =
            Number(
              record.outputQty
            );

          const okQty =
            Number(
              record.okQty
            );

          const actualRm =
            Number(
              record.actualRm
            );

          // =============================================
          // TOTAL NG
          // =============================================

          const ngQty =
            Math.max(
              0,
              outputQty -
                okQty
            );

          // =============================================
          // TARGET 8H
          // =============================================

          const target8H =
            target
              ? Number(
                  target.target8H
                )
              : 0;

          // =============================================
          // PRODUCT VARIANCE
          // =============================================

          const productVariance =
            target8H >
            0
              ? outputQty -
                target8H
              : 0;

          // =============================================
          // ACHIEVEMENT
          // =============================================

          const achievement =
            target8H >
            0
              ? (
                  outputQty /
                  target8H
                ) *
                100
              : 0;

          // =============================================
          // RETURN DATA
          // =============================================

          return {
            // =========================================
            // BASIC
            // =========================================

            id:
              record.id,

            productionDate:
              record.productionDate,

            // =========================================
            // MACHINE
            // =========================================

            machineNo:
              record.machineNo,

            // =========================================
            // AREA
            // =========================================

            area:
              record.area
                ? {
                    id:
                      record
                        .area
                        .id,

                    code:
                      record
                        .area
                        .code,

                    name:
                      record
                        .area
                        .name,
                  }
                : null,

            // =========================================
            // SHIFT
            // =========================================

            shift:
              record.shift
                ? {
                    id:
                      record
                        .shift
                        .id,

                    code:
                      record
                        .shift
                        .code,

                    name:
                      record
                        .shift
                        .name,
                  }
                : null,

            // =========================================
            // PRODUCT
            // =========================================

            product:
              record.product
                ? {
                    id:
                      record
                        .product
                        .id,

                    productCode:
                      record
                        .product
                        .productCode,

                    productName:
                      record
                        .product
                        .productName,

                    description:
                      record
                        .product
                        .description,

                    quantityUnit:
                      record
                        .product
                        .quantityUnit,

                    shotWeight:
                      Number(
                        record
                          .product
                          .shotWeight
                      ),

                    shotWeightUnit:
                      record
                        .product
                        .shotWeightUnit,

                    isActive:
                      record
                        .product
                        .isActive,
                  }
                : null,

            // =========================================
            // COMPUTER CODE
            // =========================================

            computerCode:
              record.computerCode,

            // =========================================
            // OPERATOR
            // =========================================

            operatorName:
              record.operatorName,

            // =========================================
            // PRODUCTION VALUES
            // =========================================

            outputQty,

            okQty,

            ngQty,

            actualRm,

            // =========================================
            // DASHBOARD ALIASES
            // =========================================

            quantityProductOk:
              okQty,

            totalNgProduct:
              ngQty,

            totalActualRawMaterialUsage:
              actualRm,

            // =========================================
            // TARGET
            // =========================================

            target8H,

            targetEffectiveFrom:
              target?.effectiveFrom ??
              null,

            targetEffectiveTo:
              target?.effectiveTo ??
              null,

            // =========================================
            // PRODUCT VARIANCE
            // =========================================

            productVariance,

            // =========================================
            // ACHIEVEMENT
            // =========================================

            achievement,

            // =========================================
            // OTHER
            // =========================================

            otReplace:
              record.otReplace,

            remarks:
              record.remarks,

            status:
              record.status,

            // =========================================
            // INPUT USER
            // =========================================

            inputBy:
              record.inputBy,

            // =========================================
            // TIMESTAMP
            // =========================================

            createdAt:
              record.createdAt,

            updatedAt:
              record.updatedAt,
          };
        }
      );

    // ===================================================
    // PAGINATION INFORMATION
    // ===================================================

    const totalPages =
      Math.ceil(
        total /
          limit
      );

    // ===================================================
    // RESPONSE
    // ===================================================

    return NextResponse.json(
      {
        success:
          true,

        data:
          result,

        // Total semua data
        // bukan jumlah data di halaman sekarang
        total,

        pagination: {
          page,

          limit,

          total,

          totalPages,

          hasNextPage:
            page <
            totalPages,

          hasPreviousPage:
            page >
            1,
        },
      }
    );
  } catch (error) {
    // ===================================================
    // ERROR LOG
    // ===================================================

    console.error(
      "GET /api/production error:",
      error
    );

    // ===================================================
    // ERROR RESPONSE
    // ===================================================

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Failed to fetch production data.",

        // Tampilkan detail error
        // hanya saat development
        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : String(
                  error
                )
            : undefined,
      },
      {
        status:
          500,
      }
    );
  }
}

// =====================================================
// POST PRODUCTION DATA
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    console.log(
      "POST /api/production body:",
      body
    );

    const {
      productionDate,
      areaId,
      shiftId,
      machineNo,
      productId,
      operatorName,
      computerCode,
      outputQty,
      okQty,
      actualRm,
      otReplace,
      remarks,
      inputById,
    } = body;

    // ===================================================
    // REQUIRED VALIDATION
    // ===================================================

    if (
      !productionDate
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Production date is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // AREA
    // ===================================================

    if (
      !areaId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Production area is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // SHIFT
    // ===================================================

    if (
      !shiftId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Shift is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // MACHINE NO.
    // ===================================================

    if (
      machineNo ===
        undefined ||
      machineNo ===
        null ||
      String(
        machineNo
      ).trim() ===
        ""
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Machine No. is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // PRODUCT
    // ===================================================

    if (
      !productId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Product could not be determined from Computer Code.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // COMPUTER CODE
    // ===================================================

    if (
      !computerCode?.trim()
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Computer Code is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // OUTPUT QTY
    // ===================================================

    if (
      outputQty ===
        undefined ||
      outputQty ===
        null ||
      outputQty ===
        ""
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Output quantity is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // OK QTY
    // ===================================================

    if (
      okQty ===
        undefined ||
      okQty ===
        null ||
      okQty ===
        ""
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "OK quantity is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // ACTUAL RM
    // ===================================================

    if (
      actualRm ===
        undefined ||
      actualRm ===
        null ||
      actualRm ===
        ""
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Actual raw material usage is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // INPUT USER
    // ===================================================

    if (
      !inputById
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Input user is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // NORMALIZE MACHINE NO.
    // ===================================================

    const normalizedMachineNo =
      String(
        machineNo
      ).trim();

    // ===================================================
    // NORMALIZE COMPUTER CODE
    // ===================================================

    const normalizedComputerCode =
      String(
        computerCode
      )
        .trim()
        .toUpperCase();

    // ===================================================
    // PARSE ID
    // ===================================================

    const parsedAreaId =
      Number(
        areaId
      );

    const parsedShiftId =
      Number(
        shiftId
      );

    const parsedProductId =
      Number(
        productId
      );

    const parsedInputById =
      Number(
        inputById
      );

    if (
      !Number.isInteger(
        parsedAreaId
      ) ||
      !Number.isInteger(
        parsedShiftId
      ) ||
      !Number.isInteger(
        parsedProductId
      ) ||
      !Number.isInteger(
        parsedInputById
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid ID value.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // PARSE NUMBER
    // ===================================================

    const parsedOutputQty =
      Number(
        outputQty
      );

    const parsedOkQty =
      Number(
        okQty
      );

    const parsedActualRm =
      Number(
        actualRm
      );

    if (
      !Number.isFinite(
        parsedOutputQty
      ) ||
      !Number.isFinite(
        parsedOkQty
      ) ||
      !Number.isFinite(
        parsedActualRm
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid production numeric values.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // VALIDATE OUTPUT
    // ===================================================

    if (
      parsedOutputQty <
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Output quantity cannot be negative.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // VALIDATE OK
    // ===================================================

    if (
      parsedOkQty <
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "OK quantity cannot be negative.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // OK CANNOT EXCEED OUTPUT
    // ===================================================

    if (
      parsedOkQty >
      parsedOutputQty
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "OK quantity cannot be greater than output quantity.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // VALIDATE ACTUAL RM
    // ===================================================

    if (
      parsedActualRm <
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Actual raw material cannot be negative.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // PRODUCTION DATE
    // ===================================================

    const productionDateValue =
      new Date(
        productionDate
      );

    if (
      Number.isNaN(
        productionDateValue.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid production date.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // CHECK AREA
    // ===================================================

    const area =
      await prisma.area.findUnique(
        {
          where: {
            id:
              parsedAreaId,
          },
        }
      );

    if (
      !area ||
      !area.isActive
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Production area not found or inactive.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // CHECK SHIFT
    // ===================================================

    const shift =
      await prisma.shift.findUnique(
        {
          where: {
            id:
              parsedShiftId,
          },
        }
      );

    if (
      !shift ||
      !shift.isActive
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Shift not found or inactive.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // CHECK PRODUCT
    // ===================================================

    const product =
      await prisma.product.findUnique(
        {
          where: {
            id:
              parsedProductId,
          },

          select: {
            id:
              true,

            productCode:
              true,

            productName:
              true,

            description:
              true,

            quantityUnit:
              true,

            shotWeight:
              true,

            shotWeightUnit:
              true,

            isActive:
              true,
          },
        }
      );

    if (
      !product ||
      !product.isActive
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Product not found or inactive.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // CHECK USER
    // ===================================================

    const user =
      await prisma.user.findUnique(
        {
          where: {
            id:
              parsedInputById,
          },

          select: {
            id:
              true,

            name:
              true,

            email:
              true,

            isActive:
              true,
          },
        }
      );

    if (
      !user ||
      !user.isActive
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Input user not found or inactive.",
        },
        {
          status:
            400,
        }
      );
    }

    // ===================================================
    // FIND TARGET 8H
    // ===================================================

    const target =
      await prisma.productionTarget.findFirst(
        {
          where: {
            productId:
              parsedProductId,

            isActive:
              true,

            effectiveFrom: {
              lte:
                productionDateValue,
            },

            OR: [
              {
                effectiveTo:
                  null,
              },

              {
                effectiveTo: {
                  gte:
                    productionDateValue,
                },
              },
            ],
          },

          orderBy: {
            effectiveFrom:
              "desc",
          },
        }
      );

    // ===================================================
    // FALLBACK TARGET
    // ===================================================

    const finalTarget =
      target ??
      (await prisma.productionTarget.findFirst(
        {
          where: {
            productId:
              parsedProductId,

            isActive:
              true,
          },

          orderBy: {
            effectiveFrom:
              "desc",
          },
        }
      ));

    // ===================================================
    // LOG TARGET
    // ===================================================

    console.log(
      "Production Target:",
      {
        productId:
          parsedProductId,

        targetId:
          finalTarget?.id ??
          null,

        target8H:
          finalTarget
            ? Number(
                finalTarget.target8H
              )
            : 0,

        effectiveFrom:
          finalTarget?.effectiveFrom ??
          null,

        effectiveTo:
          finalTarget?.effectiveTo ??
          null,
      }
    );

    // ===================================================
    // CREATE PRODUCTION RECORD
    // ===================================================

    const production =
      await prisma.productionRecord.create(
        {
          data: {
            // =============================================
            // DATE
            // =============================================

            productionDate:
              productionDateValue,

            // =============================================
            // AREA
            // =============================================

            areaId:
              parsedAreaId,

            // =============================================
            // SHIFT
            // =============================================

            shiftId:
              parsedShiftId,

            // =============================================
            // MACHINE NO.
            // =============================================

            machineNo:
              normalizedMachineNo,

            // =============================================
            // PRODUCT
            // =============================================

            productId:
              parsedProductId,

            // =============================================
            // OPERATOR
            // =============================================

            operatorName:
              operatorName
                ? String(
                    operatorName
                  ).trim()
                : null,

            // =============================================
            // COMPUTER CODE
            // =============================================

            computerCode:
              normalizedComputerCode,

            // =============================================
            // OUTPUT
            // =============================================

            outputQty:
              parsedOutputQty,

            // =============================================
            // OK
            // =============================================

            okQty:
              parsedOkQty,

            // =============================================
            // ACTUAL RM
            // =============================================

            actualRm:
              parsedActualRm,

            // =============================================
            // OTHER
            // =============================================

            otReplace:
              otReplace
                ? String(
                    otReplace
                  ).trim()
                : null,

            remarks:
              remarks
                ? String(
                    remarks
                  ).trim()
                : null,

            // =============================================
            // INPUT USER
            // =============================================

            inputById:
              parsedInputById,
          },
        }
      );

    // ===================================================
    // NG CALCULATION
    // ===================================================

    const calculatedNgQty =
      Math.max(
        0,
        parsedOutputQty -
          parsedOkQty
      );

    // ===================================================
    // TARGET VALUE
    // ===================================================

    const target8H =
      finalTarget
        ? Number(
            finalTarget.target8H
          )
        : 0;

    // ===================================================
    // PRODUCT VARIANCE
    // ===================================================

    const productVariance =
      target8H >
      0
        ? parsedOutputQty -
          target8H
        : 0;

    // ===================================================
    // ACHIEVEMENT
    // =====================================================

    const achievement =
      target8H >
      0
        ? (
            parsedOutputQty /
            target8H
          ) *
          100
        : 0;

    // ===================================================
    // RESPONSE
    // ===================================================

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Production record created successfully.",

        data: {
          // =============================================
          // BASIC
          // =============================================

          id:
            production.id,

          productionDate:
            production.productionDate,

          // =============================================
          // MACHINE NO.
          // =============================================

          machineNo:
            production.machineNo,

          // =============================================
          // AREA
          // =============================================

          area: {
            id:
              area.id,

            code:
              area.code,

            name:
              area.name,
          },

          // =============================================
          // SHIFT
          // =============================================

          shift: {
            id:
              shift.id,

            code:
              shift.code,

            name:
              shift.name,
          },

          // =============================================
          // PRODUCT
          // =============================================

          product: {
            id:
              product.id,

            productCode:
              product.productCode,

            productName:
              product.productName,

            description:
              product.description,

            quantityUnit:
              product.quantityUnit,

            shotWeight:
              Number(
                product.shotWeight
              ),

            shotWeightUnit:
              product.shotWeightUnit,

            isActive:
              product.isActive,
          },

          // =============================================
          // OPERATOR
          // =============================================

          operatorName:
            production.operatorName,

          // =============================================
          // COMPUTER CODE
          // =============================================

          computerCode:
            production.computerCode,

          // =============================================
          // PRODUCTION VALUES
          // =============================================

          outputQty:
            parsedOutputQty,

          okQty:
            parsedOkQty,

          ngQty:
            calculatedNgQty,

          actualRm:
            parsedActualRm,

          // =============================================
          // DASHBOARD ALIASES
          // =============================================

          quantityProductOk:
            parsedOkQty,

          totalNgProduct:
            calculatedNgQty,

          totalActualRawMaterialUsage:
            parsedActualRm,

          // =============================================
          // TARGET
          // =============================================

          target8H,

          targetEffectiveFrom:
            finalTarget?.effectiveFrom ??
            null,

          targetEffectiveTo:
            finalTarget?.effectiveTo ??
            null,

          // =============================================
          // PRODUCT VARIANCE
          // =============================================

          productVariance,

          // =============================================
          // ACHIEVEMENT
          // =============================================

          achievement,

          // =============================================
          // OTHER
          // =============================================

          otReplace:
            production.otReplace,

          remarks:
            production.remarks,

          // =============================================
          // INPUT USER
          // =============================================

          inputBy: {
            id:
              user.id,

            name:
              user.name,

            email:
              user.email,
          },

          // =============================================
          // TIMESTAMP
          // =============================================

          createdAt:
            production.createdAt,

          updatedAt:
            production.updatedAt,
        },
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    // ===================================================
    // ERROR LOG
    // ===================================================

    console.error(
      "POST /api/production error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Failed to create production record.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : String(
                  error
                )
            : undefined,
      },
      {
        status:
          500,
      }
    );
  }
}