import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error("Database error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Database connection failed",
        code: error?.code || null,
        meta: error?.meta || null,
      },
      { status: 500 }
    );
  }
}