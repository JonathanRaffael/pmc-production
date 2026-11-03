import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// GET
// GET /api/molding-products
// =====================================================

export async function GET() {
  try {
    const moldingProducts =
      await prisma.moldingProduct.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      success: true,
      data: moldingProducts,
    });
  } catch (error) {
    console.error(
      "GET /api/molding-products error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal mengambil data molding product",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST
// POST /api/molding-products
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const {
      computerCode,
      productName,
      productDescription,
      hardnessRequirements,
      colorRequirements,
      rawMaterialRequirements,
      bufferPercent,
      quotaPerHourShot,
      quotaPerHourPcs,
      productionTime,
      productionTargetPerDay,
    } = body;

    // ===================================================
    // REQUIRED VALIDATION
    // ===================================================

    if (
      !computerCode ||
      typeof computerCode !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Computer Code wajib diisi",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !productName ||
      typeof productName !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product Name wajib diisi",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // NUMBER VALIDATION
    // ===================================================

    const parsedBufferPercent =
      Number(bufferPercent);

    const parsedQuotaPerHourShot =
      Number(quotaPerHourShot);

    const parsedQuotaPerHourPcs =
      Number(quotaPerHourPcs);

    const parsedProductionTime =
      Number(productionTime);

    const parsedProductionTargetPerDay =
      Number(productionTargetPerDay);

    if (
      Number.isNaN(parsedBufferPercent) ||
      parsedBufferPercent < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Buffer (%) harus berupa angka yang valid",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(parsedQuotaPerHourShot) ||
      parsedQuotaPerHourShot < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Quota/Hour (Shot) harus berupa angka yang valid",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(parsedQuotaPerHourPcs) ||
      parsedQuotaPerHourPcs < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Quota/Hour (PCS) harus berupa angka yang valid",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(parsedProductionTime) ||
      parsedProductionTime < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Production Time harus berupa angka yang valid",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(
        parsedProductionTargetPerDay
      ) ||
      parsedProductionTargetPerDay < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Production Target/Day harus berupa angka yang valid",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // NORMALIZE STRING DATA
    // ===================================================

    const normalizedComputerCode =
      computerCode.trim();

    const normalizedProductName =
      productName.trim();

    const normalizedProductDescription =
      typeof productDescription ===
        "string" &&
      productDescription.trim() !== ""
        ? productDescription.trim()
        : null;

    const normalizedHardness =
      typeof hardnessRequirements ===
        "string" &&
      hardnessRequirements.trim() !== ""
        ? hardnessRequirements.trim()
        : null;

    const normalizedColor =
      typeof colorRequirements ===
        "string" &&
      colorRequirements.trim() !== ""
        ? colorRequirements.trim()
        : null;

    const normalizedRawMaterial =
      typeof rawMaterialRequirements ===
        "string" &&
      rawMaterialRequirements.trim() !== ""
        ? rawMaterialRequirements.trim()
        : null;

    // ===================================================
    // CHECK DUPLICATE COMPUTER CODE
    // ===================================================

    const existingProduct =
      await prisma.moldingProduct.findUnique({
        where: {
          computerCode:
            normalizedComputerCode,
        },
      });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Computer Code sudah digunakan",
        },
        {
          status: 409,
        }
      );
    }

    // ===================================================
    // CREATE MOLDING PRODUCT
    // ===================================================

    const moldingProduct =
      await prisma.moldingProduct.create({
        data: {
          computerCode:
            normalizedComputerCode,

          productName:
            normalizedProductName,

          productDescription:
            normalizedProductDescription,

          hardnessRequirements:
            normalizedHardness,

          colorRequirements:
            normalizedColor,

          rawMaterialRequirements:
            normalizedRawMaterial,

          bufferPercent:
            parsedBufferPercent,

          quotaPerHourShot:
            parsedQuotaPerHourShot,

          quotaPerHourPcs:
            parsedQuotaPerHourPcs,

          productionTime:
            parsedProductionTime,

          productionTargetPerDay:
            parsedProductionTargetPerDay,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Molding Product berhasil ditambahkan",
        data: moldingProduct,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/molding-products error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error";

    console.error(
      "Error detail:",
      errorMessage
    );

    // ===================================================
    // UNIQUE CONSTRAINT
    // ===================================================

    if (
      errorMessage.includes(
        "Unique constraint"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Computer Code sudah digunakan",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal menambahkan molding product",
      },
      {
        status: 500,
      }
    );
  }
}