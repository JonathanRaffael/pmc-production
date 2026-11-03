
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ===================================================
// AUTHENTICATION - ADMIN ONLY
// ===================================================

async function getAdminUser() {
  const session = await getSession();

  if (!session?.userId) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Silakan login terlebih dahulu.",
        },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: Number(session.userId),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Akun tidak ditemukan atau tidak aktif.",
        },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "ADMIN") {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Forbidden. Hanya ADMIN yang dapat mengakses Audit Log.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

// ===================================================
// GET AUDIT LOG
// ===================================================

export async function GET(request: NextRequest) {
  try {
    // ===================================================
    // AUTH CHECK
    // ===================================================

    const auth = await getAdminUser();

    if (!auth.user) {
      return auth.response!;
    }

    // ===================================================
    // QUERY PARAMETERS
    // ===================================================

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const action = searchParams.get("action")?.toUpperCase() || "";
    const recordIdParam = searchParams.get("recordId");
    const actorIdParam = searchParams.get("actorId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        parseInt(searchParams.get("limit") || "25", 10) || 25
      )
    );

    const skip = (page - 1) * limit;

    // ===================================================
    // VALIDATION
    // ===================================================

    const validActions = ["UPDATE", "DELETE", "RESTORE"];

    if (action && !validActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Action tidak valid.",
        },
        { status: 400 }
      );
    }

    let recordId: number | undefined;
    let actorId: number | undefined;

    if (recordIdParam) {
      recordId = Number(recordIdParam);

      if (!Number.isInteger(recordId) || recordId <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Record ID tidak valid.",
          },
          { status: 400 }
        );
      }
    }

    if (actorIdParam) {
      actorId = Number(actorIdParam);

      if (!Number.isInteger(actorId) || actorId <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Actor ID tidak valid.",
          },
          { status: 400 }
        );
      }
    }

    // ===================================================
    // DATE FILTER
    // ===================================================

    const createdAt: any = {};

    if (fromDate) {
      const startDate = new Date(`${fromDate}T00:00:00.000`);

      if (Number.isNaN(startDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Format fromDate tidak valid.",
          },
          { status: 400 }
        );
      }

      createdAt.gte = startDate;
    }

    if (toDate) {
      const endDate = new Date(`${toDate}T23:59:59.999`);

      if (Number.isNaN(endDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Format toDate tidak valid.",
          },
          { status: 400 }
        );
      }

      createdAt.lte = endDate;
    }

    if (
      fromDate &&
      toDate &&
      new Date(`${fromDate}T00:00:00.000`) >
        new Date(`${toDate}T23:59:59.999`)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Rentang tanggal tidak valid.",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // BUILD WHERE
    // ===================================================

    const conditions: any[] = [];

    if (action) {
      conditions.push({
        action,
      });
    }

    if (recordId !== undefined) {
      conditions.push({
        recordId,
      });
    }

    if (actorId !== undefined) {
      conditions.push({
        actorId,
      });
    }

    if (Object.keys(createdAt).length > 0) {
      conditions.push({
        createdAt,
      });
    }

    if (search) {
      const searchConditions: any[] = [
        {
          actorEmail: {
            contains: search,
          },
        },
        {
          reason: {
            contains: search,
          },
        },
      ];

      // Jika pencarian berupa angka, cari juga berdasarkan Record ID.
      const searchAsNumber = Number(search);

      if (
        Number.isInteger(searchAsNumber) &&
        searchAsNumber > 0
      ) {
        searchConditions.push({
          recordId: searchAsNumber,
        });
      }

      conditions.push({
        OR: searchConditions,
      });
    }

    const where: any =
      conditions.length > 0
        ? {
            AND: conditions,
          }
        : {};

    // ===================================================
    // GET TOTAL DATA
    // ===================================================

    const total = await prisma.productionAuditLog.count({
      where,
    });

    // ===================================================
    // GET AUDIT LOG DATA
    // ===================================================

    const auditLogs = await prisma.productionAuditLog.findMany({
      where,

      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      skip,
      take: limit,
    });

    // ===================================================
    // RESPONSE
    // ===================================================

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      message: "Audit Log berhasil diambil.",

      data: auditLogs,

      total,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[PRODUCTION AUDIT GET ERROR]:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil Audit Log.",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
