import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// =====================================================
// GET PRODUCT BY COMPUTER CODE / PRODUCT CODE
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams
      .get("code")
      ?.trim()
      .toUpperCase();

    console.log("====================================");
    console.log("SEARCH COMPUTER CODE:", code);
    console.log("====================================");

    // =================================================
    // VALIDATION
    // =================================================

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          found: false,
          message: "Computer Code wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // CARI PRODUCT BERDASARKAN CODE
    // =================================================

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

    console.log(
      "FOUND PRODUCT:",
      product
        ? {
            id: product.id,
            productCode: product.productCode,
            productName: product.productName,
          }
        : null
    );

    // =================================================
    // PRODUCT TIDAK DITEMUKAN
    // =================================================

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          found: false,

          message:
            "Computer Code tidak ditemukan di master Product.",
        },

        {
          status: 404,
        }
      );
    }

    // =================================================
    // TARGET 8H
    // =================================================

    const target =
      product.productionTargets?.[0] ?? null;

    // =================================================
    // RESPONSE
    // =================================================

    return NextResponse.json({
      success: true,

      found: true,

      data: {
        // =================================================
        // COMPUTER CODE
        // =================================================

        computerCode:
          product.productCode,

        // =================================================
        // PRODUCT
        // =================================================

        product: {
          id: product.id,

          productCode:
            product.productCode,

          productName:
            product.productName,

          description:
            product.description,

          isActive:
            product.isActive,

          shotWeight:
            Number(product.shotWeight),

          shotWeightUnit:
            product.shotWeightUnit,

          quantityUnit:
            product.quantityUnit,

          productionTarget8H:
            target
              ? Number(target.target8H)
              : null,
        },

        // =================================================
        // OPERATOR
        // =================================================

        operatorName: "",

        // =================================================
        // AREA
        // =================================================

        area: null,

        // =================================================
        // SHIFT
        // =================================================

        shift: null,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/production/computer-codes error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        found: false,

        message:
          "Gagal mencari Computer Code.",
      },

      {
        status: 500,
      }
    );
  }
}