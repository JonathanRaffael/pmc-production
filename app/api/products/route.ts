import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// =====================================================
// GET PRODUCTS
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Bisa digunakan:
    // /api/products
    // /api/products?code=RRU16355100D5T
    const code = searchParams.get("code")?.trim().toUpperCase();

    // =================================================
    // GET SINGLE PRODUCT BY COMPUTER CODE / PRODUCT CODE
    // =================================================

    if (code) {
      const product = await prisma.product.findUnique({
        where: {
          productCode: code,
        },

        include: {
          productionTargets: {
            where: {
              isActive: true,
            },

            orderBy: {
              effectiveFrom: "desc",
            },

            take: 1,
          },
        },
      });

      // Product tidak ditemukan
      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message: "Computer Code tidak ditemukan.",
            product: null,
          },
          {
            status: 404,
          }
        );
      }

      // =================================================
      // FORMAT PRODUCT
      // =================================================

      const formattedProduct = {
        id: product.id,

        productCode: product.productCode,

        productName: product.productName,

        description: product.description,

        isActive: product.isActive,

        shotWeight: Number(product.shotWeight),

        shotWeightUnit: product.shotWeightUnit,

        quantityUnit: product.quantityUnit,

        productionTarget8H:
          product.productionTargets.length > 0
            ? Number(
                product.productionTargets[0].target8H
              )
            : null,
      };

      return NextResponse.json({
        success: true,

        product: formattedProduct,
      });
    }

    // =================================================
    // GET ALL PRODUCTS
    // =================================================

    const products = await prisma.product.findMany({
      orderBy: {
        id: "asc",
      },

      include: {
        productionTargets: {
          where: {
            isActive: true,
          },

          orderBy: {
            effectiveFrom: "desc",
          },

          take: 1,
        },
      },
    });

    // =================================================
    // FORMAT PRODUCTS
    // =================================================

    const formattedProducts = products.map(
      (product) => ({
        id: product.id,

        productCode: product.productCode,

        productName: product.productName,

        description: product.description,

        isActive: product.isActive,

        shotWeight: Number(product.shotWeight),

        shotWeightUnit: product.shotWeightUnit,

        quantityUnit: product.quantityUnit,

        productionTarget8H:
          product.productionTargets.length > 0
            ? Number(
                product.productionTargets[0].target8H
              )
            : null,
      })
    );

    return NextResponse.json({
      success: true,

      products: formattedProducts,
    });
  } catch (error) {
    console.error(
      "GET products error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Gagal mengambil data product.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST PRODUCT
// =====================================================

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    console.log(
      "POST /api/products body:",
      body
    );

    // =================================================
    // PRODUCT DATA
    // =================================================

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

    // =================================================
    // SHOT WEIGHT
    // =================================================

    const parsedShotWeight = Number(
      body.shotWeight
    );

    const shotWeightUnit = String(
      body.shotWeightUnit ?? "KG"
    ).toUpperCase();

    // =================================================
    // QUANTITY UNIT
    // =================================================

    const quantityUnit = String(
      body.quantityUnit ?? "PCS"
    ).toUpperCase();

    // =================================================
    // PRODUCTION TARGET
    // =================================================

    const parsedTarget8H = Number(
      body.productionTarget8H
    );

    // =================================================
    // VALIDATION
    // =================================================

    if (!productCode || !productName) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Product code dan product name wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(parsedShotWeight) ||
      parsedShotWeight <= 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Shot weight wajib diisi dan harus lebih dari 0.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      shotWeightUnit !== "KG" &&
      shotWeightUnit !== "GRAM"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Shot weight unit tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      quantityUnit !== "PCS" &&
      quantityUnit !== "METER"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Production quantity unit tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(parsedTarget8H) ||
      parsedTarget8H <= 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Production target / 8H wajib diisi dan harus lebih dari 0.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // CHECK DUPLICATE PRODUCT CODE
    // =================================================

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          productCode,
        },
      });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Product code sudah digunakan.",
        },
        {
          status: 409,
        }
      );
    }

    // =================================================
    // CREATE PRODUCT + PRODUCTION TARGET
    // =================================================

    const now = new Date();

    const product =
      await prisma.product.create({
        data: {
          productCode,

          productName,

          description,

          shotWeight: parsedShotWeight,

          shotWeightUnit,

          quantityUnit,

          isActive: true,

          productionTargets: {
            create: {
              target8H: parsedTarget8H,

              effectiveFrom: now,

              effectiveTo: null,

              isActive: true,
            },
          },
        },

        include: {
          productionTargets: true,
        },
      });

    // =================================================
    // RESPONSE
    // =================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Product berhasil ditambahkan.",

        product,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST product error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Gagal menambahkan product.",
      },
      {
        status: 500,
      }
    );
  }
}