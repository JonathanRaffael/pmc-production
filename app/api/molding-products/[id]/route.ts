import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// GET
// GET /api/molding-products/[id]
// =====================================================

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID molding product tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    const moldingProduct =
      await prisma.moldingProduct.findUnique({
        where: {
          id: productId,
        },
      });

    if (!moldingProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Molding Product tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: moldingProduct,
    });
  } catch (error) {
    console.error(
      "GET /api/molding-products/[id] error:",
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
// PATCH
// PATCH /api/molding-products/[id]
// =====================================================

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID molding product tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // CHECK EXISTING DATA
    // ===================================================

    const existingProduct =
      await prisma.moldingProduct.findUnique({
        where: {
          id: productId,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Molding Product tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

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
      isActive,
    } = body;

    // ===================================================
    // STRING VALIDATION
    // ===================================================

    if (
      computerCode !== undefined &&
      (typeof computerCode !== "string" ||
        computerCode.trim() === "")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Computer Code tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    if (
      productName !== undefined &&
      (typeof productName !== "string" ||
        productName.trim() === "")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product Name tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // CHECK DUPLICATE COMPUTER CODE
    // ===================================================

    if (
      computerCode !== undefined &&
      computerCode.trim() !==
        existingProduct.computerCode
    ) {
      const duplicate =
        await prisma.moldingProduct.findFirst({
          where: {
            computerCode:
              computerCode.trim(),
            NOT: {
              id: productId,
            },
          },
        });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Computer Code sudah digunakan oleh produk lain",
          },
          {
            status: 409,
          }
        );
      }
    }

    // ===================================================
    // BUILD UPDATE DATA
    // ===================================================

    const updateData: {
      computerCode?: string;
      productName?: string;
      productDescription?: string | null;
      hardnessRequirements?: string | null;
      colorRequirements?: string | null;
      rawMaterialRequirements?: string | null;
      bufferPercent?: number;
      quotaPerHourShot?: number;
      quotaPerHourPcs?: number;
      productionTime?: number;
      productionTargetPerDay?: number;
      isActive?: boolean;
    } = {};

    // ===================================================
    // COMPUTER CODE
    // ===================================================

    if (computerCode !== undefined) {
      updateData.computerCode =
        computerCode.trim();
    }

    // ===================================================
    // PRODUCT NAME
    // ===================================================

    if (productName !== undefined) {
      updateData.productName =
        productName.trim();
    }

    // ===================================================
    // PRODUCT DESCRIPTION
    // ===================================================

    if (productDescription !== undefined) {
      updateData.productDescription =
        typeof productDescription ===
          "string" &&
        productDescription.trim() !== ""
          ? productDescription.trim()
          : null;
    }

    // ===================================================
    // HARDNESS
    // ===================================================

    if (
      hardnessRequirements !== undefined
    ) {
      updateData.hardnessRequirements =
        typeof hardnessRequirements ===
          "string" &&
        hardnessRequirements.trim() !== ""
          ? hardnessRequirements.trim()
          : null;
    }

    // ===================================================
    // COLOR
    // ===================================================

    if (
      colorRequirements !== undefined
    ) {
      updateData.colorRequirements =
        typeof colorRequirements ===
          "string" &&
        colorRequirements.trim() !== ""
          ? colorRequirements.trim()
          : null;
    }

    // ===================================================
    // RAW MATERIAL
    // ===================================================

    if (
      rawMaterialRequirements !==
      undefined
    ) {
      updateData.rawMaterialRequirements =
        typeof rawMaterialRequirements ===
          "string" &&
        rawMaterialRequirements.trim() !==
          ""
          ? rawMaterialRequirements.trim()
          : null;
    }

    // ===================================================
    // BUFFER
    // ===================================================

    if (bufferPercent !== undefined) {
      const value = Number(
        bufferPercent
      );

      if (
        Number.isNaN(value) ||
        value < 0
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

      updateData.bufferPercent = value;
    }

    // ===================================================
    // QUOTA / HOUR - SHOT
    // ===================================================

    if (
      quotaPerHourShot !== undefined
    ) {
      const value = Number(
        quotaPerHourShot
      );

      if (
        Number.isNaN(value) ||
        value < 0
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

      updateData.quotaPerHourShot =
        value;
    }

    // ===================================================
    // QUOTA / HOUR - PCS
    // ===================================================

    if (
      quotaPerHourPcs !== undefined
    ) {
      const value = Number(
        quotaPerHourPcs
      );

      if (
        Number.isNaN(value) ||
        value < 0
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

      updateData.quotaPerHourPcs =
        value;
    }

    // ===================================================
    // PRODUCTION TIME
    // ===================================================

    if (
      productionTime !== undefined
    ) {
      const value = Number(
        productionTime
      );

      if (
        Number.isNaN(value) ||
        value < 0
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

      updateData.productionTime =
        value;
    }

    // ===================================================
    // PRODUCTION TARGET / DAY
    // ===================================================

    if (
      productionTargetPerDay !==
      undefined
    ) {
      const value = Number(
        productionTargetPerDay
      );

      if (
        Number.isNaN(value) ||
        value < 0
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

      updateData.productionTargetPerDay =
        value;
    }

    // ===================================================
    // ACTIVE STATUS
    // ===================================================

    if (isActive !== undefined) {
      if (
        typeof isActive !== "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Status aktif tidak valid",
          },
          {
            status: 400,
          }
        );
      }

      updateData.isActive =
        isActive;
    }

    // ===================================================
    // UPDATE
    // ===================================================

    const updatedProduct =
      await prisma.moldingProduct.update({
        where: {
          id: productId,
        },
        data: updateData,
      });

    return NextResponse.json({
      success: true,
      message:
        "Molding Product berhasil diperbarui",
      data: updatedProduct,
    });
  } catch (error) {
    console.error(
      "PATCH /api/molding-products/[id] error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error";

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
          "Gagal memperbarui molding product",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// DELETE
// DELETE /api/molding-products/[id]
// =====================================================

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID molding product tidak valid",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // CHECK EXISTING DATA
    // ===================================================

    const existingProduct =
      await prisma.moldingProduct.findUnique({
        where: {
          id: productId,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Molding Product tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    // ===================================================
    // DELETE
    // ===================================================

    await prisma.moldingProduct.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Molding Product berhasil dihapus",
    });
  } catch (error) {
    console.error(
      "DELETE /api/molding-products/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal menghapus molding product",
      },
      {
        status: 500,
      }
    );
  }
}