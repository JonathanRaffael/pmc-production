import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("GET products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data product",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    if (!productCode || !productName) {
      return NextResponse.json(
        {
          success: false,
          message: "Product code dan product name wajib diisi",
        },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        productCode,
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

    const product = await prisma.product.create({
      data: {
        productCode,
        productName,
        description,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product berhasil ditambahkan",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan product",
      },
      { status: 500 }
    );
  }
}