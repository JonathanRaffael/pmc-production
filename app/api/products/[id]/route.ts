import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

    const productCode = String(body.productCode ?? "")
      .trim()
      .toUpperCase();

    const productName = String(body.productName ?? "").trim();

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

    if (!productCode || !productName) {
      return NextResponse.json(
        {
          success: false,
          message: "Product code dan product name wajib diisi",
        },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findFirst({
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
          message: "Product code sudah digunakan",
        },
        { status: 409 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        productCode,
        productName,
        description,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product berhasil diperbarui",
      product,
    });
  } catch (error) {
    console.error("PATCH product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui product",
      },
      { status: 500 }
    );
  }
}

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
          message: "ID product tidak valid",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product berhasil dinonaktifkan",
      product,
    });
  } catch (error) {
    console.error("DELETE product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menonaktifkan product",
      },
      { status: 500 }
    );
  }
}