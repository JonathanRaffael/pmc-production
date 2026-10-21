import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// HELPER
// =====================================================

async function getProductionTarget(
  productId: number,
  productionDate: Date
) {
  // ===================================================
  // 1. CARI TARGET BERDASARKAN PERIODE BERLAKU
  // ===================================================

  const targetByPeriod =
    await prisma.productionTarget.findFirst({
      where: {
        productId,

        isActive: true,

        effectiveFrom: {
          lte: productionDate,
        },

        OR: [
          {
            effectiveTo: null,
          },
          {
            effectiveTo: {
              gte: productionDate,
            },
          },
        ],
      },

      orderBy: {
        effectiveFrom: "desc",
      },
    });

  if (targetByPeriod) {
    return targetByPeriod;
  }

  // ===================================================
  // 2. FALLBACK
  // ===================================================
  // Kalau tidak ada target yang cocok berdasarkan periode,
  // ambil target aktif terbaru dari product tersebut.
  //
  // Ini mencegah dashboard mendapatkan target 0 hanya
  // karena perbedaan waktu/tanggal effectiveFrom.
  // ===================================================

  const latestActiveTarget =
    await prisma.productionTarget.findFirst({
      where: {
        productId,
        isActive: true,
      },

      orderBy: {
        effectiveFrom: "desc",
      },
    });

  return latestActiveTarget;
}

// =====================================================
// GET PRODUCTION DATA
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } =
      new URL(request.url);

    const date =
      searchParams.get("date");

    const areaId =
      searchParams.get("areaId");

    const shiftId =
      searchParams.get("shiftId");

    const productId =
      searchParams.get("productId");

    const computerCode =
      searchParams.get("computerCode");

    // ===================================================
    // BUILD WHERE
    // ===================================================

    const where: {
      productionDate?: {
        gte: Date;
        lte: Date;
      };

      areaId?: number;

      shiftId?: number;

      productId?: number;

      computerCode?: string;
    } = {};

    // ===================================================
    // DATE
    // ===================================================

    if (date) {
      const startDate =
        new Date(
          `${date}T00:00:00`
        );

      const endDate =
        new Date(
          `${date}T23:59:59.999`
        );

      where.productionDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    // ===================================================
    // AREA
    // ===================================================

    if (areaId) {
      const parsedAreaId =
        Number(areaId);

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

    if (shiftId) {
      const parsedShiftId =
        Number(shiftId);

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

    if (productId) {
      const parsedProductId =
        Number(productId);

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
    // GET PRODUCTION RECORDS
    // ===================================================

    const productionRecords =
      await prisma.productionRecord.findMany({
        where,

        orderBy: [
          {
            productionDate:
              "desc",
          },

          {
            id: "desc",
          },
        ],

        include: {
          // =============================================
          // AREA
          // =============================================

          area: true,

          // =============================================
          // SHIFT
          // =============================================

          shift: true,

          // =============================================
          // PRODUCT
          // =============================================

          product: {
            select: {
              id: true,

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

          // =============================================
          // INPUT USER
          // =============================================

          inputBy: {
            select: {
              id: true,

              name: true,

              email: true,
            },
          },
        },
      });

    // ===================================================
    // FORMAT RESULT
    // ===================================================

    const result =
      await Promise.all(
        productionRecords.map(
          async (record) => {
            // =============================================
            // GET TARGET 8H
            // =============================================

            const target =
              await getProductionTarget(
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
            // TARGET
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
              target8H > 0
                ? outputQty -
                  target8H
                : 0;

            // =============================================
            // ACHIEVEMENT
            // =============================================

            const achievement =
              target8H > 0
                ? (
                    outputQty /
                    target8H
                  ) * 100
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
              // MACHINE NO.
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
                        record.area
                          .id,

                      code:
                        record.area
                          .code,

                      name:
                        record.area
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
                        record.shift
                          .id,

                      code:
                        record.shift
                          .code,

                      name:
                        record.shift
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
                        record.product
                          .id,

                      productCode:
                        record.product
                          .productCode,

                      productName:
                        record.product
                          .productName,

                      description:
                        record.product
                          .description,

                      quantityUnit:
                        record.product
                          .quantityUnit,

                      shotWeight:
                        Number(
                          record
                            .product
                            .shotWeight
                        ),

                      shotWeightUnit:
                        record.product
                          .shotWeightUnit,

                      isActive:
                        record.product
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
              // TARGET 8H
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

              // =========================================
              // INPUT BY
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
        )
      );

    // ===================================================
    // RESPONSE
    // ===================================================

    return NextResponse.json({
      success: true,

      data: result,

      total:
        result.length,
    });
  } catch (error) {
    console.error(
      "GET /api/production error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to fetch production data.",
      },
      {
        status: 500,
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

    if (!productionDate) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Production date is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // AREA
    // ===================================================

    if (!areaId) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Production area is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // SHIFT
    // ===================================================

    if (!shiftId) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Shift is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // MACHINE NO.
    // ===================================================

    if (
      machineNo ===
        undefined ||
      machineNo === null ||
      String(machineNo).trim() ===
        ""
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Machine No. is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // PRODUCT
    // ===================================================

    if (!productId) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Product could not be determined from Computer Code.",
        },
        {
          status: 400,
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
          success: false,

          message:
            "Computer Code is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // OUTPUT QTY
    // ===================================================

    if (
      outputQty ===
        undefined ||
      outputQty === null ||
      outputQty === ""
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Output quantity is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // OK QTY
    // ===================================================

    if (
      okQty ===
        undefined ||
      okQty === null ||
      okQty === ""
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "OK quantity is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // ACTUAL RM
    // ===================================================

    if (
      actualRm ===
        undefined ||
      actualRm === null ||
      actualRm === ""
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Actual raw material usage is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // INPUT USER
    // ===================================================

    if (!inputById) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Input user is required.",
        },
        {
          status: 400,
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
      Number(areaId);

    const parsedShiftId =
      Number(shiftId);

    const parsedProductId =
      Number(productId);

    const parsedInputById =
      Number(inputById);

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
          success: false,

          message:
            "Invalid ID value.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // PARSE NUMBER
    // ===================================================

    const parsedOutputQty =
      Number(outputQty);

    const parsedOkQty =
      Number(okQty);

    const parsedActualRm =
      Number(actualRm);

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
          success: false,

          message:
            "Invalid production numeric values.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // VALIDATE OUTPUT
    // ===================================================

    if (
      parsedOutputQty < 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Output quantity cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // VALIDATE OK
    // ===================================================

    if (
      parsedOkQty < 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "OK quantity cannot be negative.",
        },
        {
          status: 400,
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
          success: false,

          message:
            "OK quantity cannot be greater than output quantity.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // VALIDATE ACTUAL RM
    // ===================================================

    if (
      parsedActualRm < 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Actual raw material cannot be negative.",
        },
        {
          status: 400,
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
          success: false,

          message:
            "Invalid production date.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // CHECK AREA
    // ===================================================

    const area =
      await prisma.area.findUnique({
        where: {
          id: parsedAreaId,
        },
      });

    if (
      !area ||
      !area.isActive
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Production area not found or inactive.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // CHECK SHIFT
    // ===================================================

    const shift =
      await prisma.shift.findUnique({
        where: {
          id: parsedShiftId,
        },
      });

    if (
      !shift ||
      !shift.isActive
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Shift not found or inactive.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // CHECK PRODUCT
    // ===================================================

    const product =
      await prisma.product.findUnique({
        where: {
          id: parsedProductId,
        },

        select: {
          id: true,

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
      });

    if (
      !product ||
      !product.isActive
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Product not found or inactive.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // CHECK USER
    // ===================================================

    const user =
      await prisma.user.findUnique({
        where: {
          id: parsedInputById,
        },

        select: {
          id: true,

          name: true,

          email: true,

          isActive: true,
        },
      });

    if (
      !user ||
      !user.isActive
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Input user not found or inactive.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // FIND TARGET 8H
    // ===================================================

    const target =
      await getProductionTarget(
        parsedProductId,
        productionDateValue
      );

    // ===================================================
    // LOG TARGET
    // ===================================================

    console.log(
      "Production Target:",
      {
        productId:
          parsedProductId,

        targetId:
          target?.id ??
          null,

        target8H:
          target
            ? Number(
                target.target8H
              )
            : 0,

        effectiveFrom:
          target?.effectiveFrom ??
          null,

        effectiveTo:
          target?.effectiveTo ??
          null,
      }
    );

    // ===================================================
    // CREATE PRODUCTION RECORD
    // ===================================================

    const production =
      await prisma.productionRecord.create({
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
      });

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
      target
        ? Number(
            target.target8H
          )
        : 0;

    // ===================================================
    // PRODUCT VARIANCE
    // ===================================================

    const productVariance =
      target8H > 0
        ? parsedOutputQty -
          target8H
        : 0;

    // ===================================================
    // ACHIEVEMENT
    // ===================================================

    const achievement =
      target8H > 0
        ? (
            parsedOutputQty /
            target8H
          ) * 100
        : 0;

    // ===================================================
    // RESPONSE
    // ===================================================

    return NextResponse.json(
      {
        success: true,

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
            target?.effectiveFrom ??
            null,

          targetEffectiveTo:
            target?.effectiveTo ??
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
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/production error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to create production record.",
      },
      {
        status: 500,
      }
    );
  }
}