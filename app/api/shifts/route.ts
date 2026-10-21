import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// GET SHIFTS
// =====================================================

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      where: {
        isActive: true,
      },

      orderBy: {
        id: "asc",
      },

      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    console.error("GET /api/shifts error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch shifts.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST SHIFT
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const code = String(body.code ?? "")
      .trim()
      .toUpperCase();

    const name = String(body.name ?? "").trim();

    // ===================================================
    // VALIDATION
    // ===================================================

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Shift code is required.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Shift name is required.",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // HANYA SHIFT A DAN B
    // ===================================================

    if (code !== "A" && code !== "B") {
      return NextResponse.json(
        {
          success: false,
          message: "Shift code hanya boleh A atau B.",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // CHECK DUPLICATE
    // ===================================================

    const existingShift = await prisma.shift.findUnique({
      where: {
        code,
      },
    });

    if (existingShift) {
      return NextResponse.json(
        {
          success: false,
          message: `Shift ${code} sudah tersedia.`,
        },
        { status: 409 }
      );
    }

    // ===================================================
    // CREATE SHIFT
    // ===================================================

    const shift = await prisma.shift.create({
      data: {
        code,
        name,
        isActive: true,
      },

      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Shift created successfully.",
        data: shift,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/shifts error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create shift.",
      },
      { status: 500 }
    );
  }
}