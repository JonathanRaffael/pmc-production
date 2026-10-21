import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// GET AREAS
// =====================================================

export async function GET() {
  try {
    const areas = await prisma.area.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      areas,
      data: areas,
    });
  } catch (error) {
    console.error("GET /api/areas error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch areas.",
        areas: [],
        data: [],
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST AREA
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const code = String(body.code || "").trim().toUpperCase();
    const name = String(body.name || "").trim();

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Area code is required.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Area name is required.",
        },
        { status: 400 }
      );
    }

    const existingArea = await prisma.area.findFirst({
      where: {
        OR: [
          {
            code,
          },
          {
            name,
          },
        ],
      },
    });

    if (existingArea) {
      return NextResponse.json(
        {
          success: false,
          message: "Area code or area name already exists.",
        },
        { status: 409 }
      );
    }

    const area = await prisma.area.create({
      data: {
        code,
        name,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Area created successfully.",
        data: area,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/areas error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create area.",
      },
      {
        status: 500,
      }
    );
  }
}