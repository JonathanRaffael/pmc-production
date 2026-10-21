import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// =====================================================
// GET PRODUCT BY ID
// =====================================================

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID product tidak valid",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },

      include: {
        productionTargets: {
          where: {
            isActive: true,
          },

          orderBy: {
            effectiveFrom: "desc",
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil product",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH PRODUCT
// =====================================================

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID product tidak valid",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // ===================================================
    // PRODUCT DATA
    // ===================================================

    const productCode = String(
      body.productCode ?? ""
    )
      .trim()
      .toUpperCase();

    const productName = String(
      body.productName ?? ""
    ).trim();

    const description =
      body.description !== undefined &&
      body.description !== null &&
      String(body.description).trim() !== ""
        ? String(body.description).trim()
        : null;

    const isActive =
      body.isActive === undefined
        ? true
        : Boolean(body.isActive);

    // ===================================================
    // SHOT WEIGHT
    // ===================================================

    const shotWeight =
      body.shotWeight === undefined ||
      body.shotWeight === null ||
      body.shotWeight === ""
        ? null
        : Number(body.shotWeight);

    if (
      shotWeight === null ||
      !Number.isFinite(shotWeight) ||
      shotWeight <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Shot weight wajib diisi dan harus lebih besar dari 0",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // SHOT WEIGHT UNIT
    // ===================================================

    const shotWeightUnit =
      String(
        body.shotWeightUnit ?? "KG"
      ).toUpperCase();

    if (
      shotWeightUnit !== "KG" &&
      shotWeightUnit !== "GRAM"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Shot weight unit harus KG atau GRAM",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // QUANTITY UNIT
    // ===================================================

    const quantityUnit =
      String(
        body.quantityUnit ?? "PCS"
      ).toUpperCase();

    if (
      quantityUnit !== "PCS" &&
      quantityUnit !== "METER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Quantity unit harus PCS atau METER",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // TARGET 8H
    // ===================================================

    const target8H =
      body.target8H === undefined ||
      body.target8H === null ||
      body.target8H === ""
        ? null
        : Number(body.target8H);

    if (
      target8H !== null &&
      (!Number.isFinite(target8H) ||
        target8H < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Production target / 8H tidak valid",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // REQUIRED VALIDATION
    // ===================================================

    if (!productCode || !productName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product code dan product name wajib diisi",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // CHECK DUPLICATE PRODUCT CODE
    // ===================================================

    const existingProduct =
      await prisma.product.findFirst({
        where: {
          productCode,

          NOT: {
            id: productId,
          },
        },
      });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product code sudah digunakan",
        },
        { status: 409 }
      );
    }

    // ===================================================
    // CHECK PRODUCT
    // ===================================================

    const currentProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!currentProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // ===================================================
    // UPDATE PRODUCT
    // ===================================================

    const product =
      await prisma.product.update({
        where: {
          id: productId,
        },

        data: {
          productCode,
          productName,
          description,

          shotWeight,
          shotWeightUnit,

          quantityUnit,

          isActive,
        },
      });

    // ===================================================
    // UPDATE PRODUCTION TARGET
    // ===================================================

    let productionTarget = null;

    if (target8H !== null) {
      // Nonaktifkan target aktif sebelumnya

      await prisma.productionTarget.updateMany({
        where: {
          productId,

          isActive: true,
        },

        data: {
          isActive: false,

          effectiveTo: new Date(),
        },
      });

      // Buat target baru

      productionTarget =
        await prisma.productionTarget.create({
          data: {
            productId,

            target8H,

            effectiveFrom:
              new Date(),

            effectiveTo:
              null,

            isActive: true,
          },
        });
    }

    // ===================================================
    // RESPONSE
    // ===================================================

    return NextResponse.json({
      success: true,

      message:
        "Product berhasil diperbarui",

      product,

      productionTarget,
    });
  } catch (error) {
    console.error(
      "PATCH product error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal memperbarui product",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE PRODUCT
// =====================================================

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID product tidak valid",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // CHECK PRODUCT
    // ===================================================

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // ===================================================
    // SOFT DELETE
    // ===================================================

    const product =
      await prisma.product.update({
        where: {
          id: productId,
        },

        data: {
          isActive: false,
        },
      });

    // ===================================================
    // NONAKTIFKAN TARGET
    // ===================================================

    await prisma.productionTarget.updateMany({
      where: {
        productId,

        isActive: true,
      },

      data: {
        isActive: false,

        effectiveTo:
          new Date(),
      },
    });

    // ===================================================
    // RESPONSE
    // ===================================================

    return NextResponse.json({
      success: true,

      message:
        "Product berhasil dinonaktifkan",

      product,
    });
  } catch (error) {
    console.error(
      "DELETE product error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal menonaktifkan product",
      },
      { status: 500 }
    );
  }
}