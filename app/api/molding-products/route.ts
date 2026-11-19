
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// GET
// =====================================================

export async function GET() {
  try {
    const moldingProducts = await prisma.moldingProduct.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: moldingProducts,
    });
  } catch (error) {
    console.error("GET /api/molding-products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data molding product",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// POST
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      computerCode,
      productName,
      productDescription,
      hardnessRequirements,
      colorRequirements,
      rawMaterialRequirements,
      shotWeight,
      setupWeight = 0,
      cavity,
      materialSetup,
      vulcanization,
      materialRemoval,
      productionTime,
    } = body;

    // ===================================================
    // REQUIRED STRING VALIDATION
    // ===================================================

    if (
      typeof computerCode !== "string" ||
      !computerCode.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Computer Code wajib diisi",
        },
        { status: 400 }
      );
    }

    if (
      typeof productName !== "string" ||
      !productName.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Product Name wajib diisi",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // NUMBER VALIDATION
    // ===================================================

    const parsedShotWeight = Number(shotWeight);
    const parsedSetupWeight = Number(setupWeight);
    const parsedCavity = Number(cavity);
    const parsedMaterialSetup = Number(materialSetup);
    const parsedVulcanization = Number(vulcanization);
    const parsedMaterialRemoval = Number(materialRemoval);
    const parsedProductionTime = Number(productionTime);

    const numericFields = [
      { name: "Shot Weight", value: parsedShotWeight },
      { name: "Setup Weight", value: parsedSetupWeight },
      { name: "Cavity", value: parsedCavity },
      { name: "Material Setup", value: parsedMaterialSetup },
      { name: "Vulcanization", value: parsedVulcanization },
      { name: "Material Removal", value: parsedMaterialRemoval },
      { name: "Production Time", value: parsedProductionTime },
    ];

    for (const field of numericFields) {
      if (!Number.isFinite(field.value)) {
        return NextResponse.json(
          {
            success: false,
            message: `${field.name} harus berupa angka yang valid`,
          },
          { status: 400 }
        );
      }
    }

    if (parsedShotWeight <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Shot Weight harus lebih besar dari 0",
        },
        { status: 400 }
      );
    }

    if (parsedSetupWeight < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Setup Weight tidak boleh negatif",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(parsedCavity) ||
      parsedCavity <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Cavity harus berupa bilangan bulat lebih dari 0",
        },
        { status: 400 }
      );
    }

    if (
      parsedMaterialSetup < 0 ||
      parsedVulcanization < 0 ||
      parsedMaterialRemoval < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Parameter material dan proses tidak boleh negatif",
        },
        { status: 400 }
      );
    }

    if (parsedProductionTime <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Production Time harus lebih besar dari 0",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // NORMALIZE STRING DATA
    // ===================================================

    const normalizedComputerCode = computerCode.trim();
    const normalizedProductName = productName.trim();

    const normalizeOptionalString = (value: unknown) =>
      typeof value === "string" && value.trim()
        ? value.trim()
        : null;

    // ===================================================
    // CHECK DUPLICATE COMPUTER CODE
    // ===================================================

    const existingProduct =
      await prisma.moldingProduct.findUnique({
        where: {
          computerCode: normalizedComputerCode,
        },
      });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Computer Code sudah digunakan",
        },
        { status: 409 }
      );
    }

    // ===================================================
    // CREATE MOLDING PRODUCT
    // ===================================================

    const moldingProduct =
      await prisma.moldingProduct.create({
        data: {
          computerCode: normalizedComputerCode,
          productName: normalizedProductName,

          productDescription:
            normalizeOptionalString(productDescription),

          hardnessRequirements:
            normalizeOptionalString(hardnessRequirements),

          colorRequirements:
            normalizeOptionalString(colorRequirements),

          rawMaterialRequirements:
            normalizeOptionalString(rawMaterialRequirements),

          shotWeight: parsedShotWeight,
          setupWeight: parsedSetupWeight,

          cavity: parsedCavity,

          materialSetup: parsedMaterialSetup,
          vulcanization: parsedVulcanization,
          materialRemoval: parsedMaterialRemoval,

          productionTime: parsedProductionTime,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Molding Product berhasil ditambahkan",
        data: moldingProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/molding-products error:", error);

    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Computer Code sudah digunakan",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan molding product",
      },
      { status: 500 }
    );
  }
}
