
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// =====================================================
// PRODUCTION RECORD RELATIONS
// =====================================================

const productionInclude = {
  area: true,
  shift: true,
  product: true,
  inputBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  materialUsages: {
    include: {
      rawMaterial: true,
    },
  },
} as const;

// =====================================================
// AUTHENTICATION
// =====================================================

async function getAuthenticatedUser() {
  const session = await getSession();

  if (!session) {
    return {
      user: null,
      status: 401,
      message: "Unauthorized.",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
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
      status: 401,
      message: "Account is inactive or unavailable.",
    };
  }

  return {
    user,
    status: 200,
    message: "Authenticated.",
  };
}

// =====================================================
// ADMIN AUTHORIZATION
// =====================================================

async function getAdminUser() {
  const auth = await getAuthenticatedUser();

  if (!auth.user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      ),
    };
  }

  if (auth.user.role !== "ADMIN") {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    user: auth.user,
    response: null,
  };
}

// =====================================================
// HELPER
// JSON SNAPSHOT FOR AUDIT LOG
// =====================================================

function createSnapshot(data: unknown) {
  return JSON.parse(JSON.stringify(data));
}

// =====================================================
// HELPER
// VALIDATE PRODUCTION ID
// =====================================================

function parseProductionId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

// =====================================================
// GET PRODUCTION DETAIL
// ADMIN & USER
// =====================================================

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // ===============================================
    // AUTHENTICATION
    // ===============================================

    const auth = await getAuthenticatedUser();

    if (!auth.user) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    // ===============================================
    // PARAMS
    // ===============================================

    const { id } = await context.params;
    const productionId = parseProductionId(id);

    if (!productionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid production ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ===============================================
    // FIND PRODUCTION
    // ===============================================

    const production = await prisma.productionRecord.findFirst({
      where: {
        id: productionId,
        deletedAt: null,
      },
      include: productionInclude,
    });

    if (!production) {
      return NextResponse.json(
        {
          success: false,
          message: "Production record not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ===============================================
    // RESPONSE
    // ===============================================

    return NextResponse.json({
      success: true,
      data: production,
    });
  } catch (error) {
    console.error(
      "GET /api/production/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch production detail.",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// PATCH PRODUCTION
// ADMIN ONLY
// =====================================================

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // ===============================================
    // ADMIN AUTHORIZATION
    // ===============================================

    const auth = await getAdminUser();

    if (!auth.user) {
      return auth.response;
    }

    const admin = auth.user;

    // ===============================================
    // PARAMS
    // ===============================================

    const { id } = await context.params;
    const productionId = parseProductionId(id);

    if (!productionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid production ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ===============================================
    // REQUEST BODY
    // ===============================================

    const body = await request.json();

    const reason =
      typeof body.reason === "string"
        ? body.reason.trim()
        : "";

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          message: "Reason for editing is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (reason.length > 191) {
      return NextResponse.json(
        {
          success: false,
          message: "Reason cannot exceed 191 characters.",
        },
        {
          status: 400,
        }
      );
    }

    // ===============================================
    // ALLOWED UPDATE FIELDS
    // ===============================================

    const allowedFields = [
      "productionDate",
      "machineNo",
      "areaId",
      "shiftId",
      "productId",
      "computerCode",
      "operatorName",
      "outputQty",
      "okQty",
      "actualRm",
      "otReplace",
      "remarks",
      "status",
    ];

    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          field
        )
      ) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No production fields provided for update.",
        },
        {
          status: 400,
        }
      );
    }

    // ===============================================
    // PRODUCTION DATE
    // ===============================================

    if (updateData.productionDate !== undefined) {
      const date = new Date(updateData.productionDate);

      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid production date.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.productionDate = date;
    }

    // ===============================================
    // VALIDATE FOREIGN KEYS
    // ===============================================

    if (updateData.areaId !== undefined) {
      const areaId = Number(updateData.areaId);

      if (!Number.isInteger(areaId) || areaId <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid area ID.",
          },
          {
            status: 400,
          }
        );
      }

      const area = await prisma.area.findFirst({
        where: {
          id: areaId,
          isActive: true,
        },
      });

      if (!area) {
        return NextResponse.json(
          {
            success: false,
            message: "Area not found or inactive.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.areaId = areaId;
    }

    if (updateData.shiftId !== undefined) {
      const shiftId = Number(updateData.shiftId);

      if (!Number.isInteger(shiftId) || shiftId <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid shift ID.",
          },
          {
            status: 400,
          }
        );
      }

      const shift = await prisma.shift.findFirst({
        where: {
          id: shiftId,
          isActive: true,
        },
      });

      if (!shift) {
        return NextResponse.json(
          {
            success: false,
            message: "Shift not found or inactive.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.shiftId = shiftId;
    }

    if (updateData.productId !== undefined) {
      const productId = Number(updateData.productId);

      if (!Number.isInteger(productId) || productId <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid product ID.",
          },
          {
            status: 400,
          }
        );
      }

      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          isActive: true,
        },
      });

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message: "Product not found or inactive.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.productId = productId;
    }

    // ===============================================
    // VALIDATE NUMERIC VALUES
    // ===============================================

    const numericFields = [
      "outputQty",
      "okQty",
      "actualRm",
    ];

    for (const field of numericFields) {
      if (updateData[field] !== undefined) {
        const value = Number(updateData[field]);

        if (!Number.isFinite(value) || value < 0) {
          return NextResponse.json(
            {
              success: false,
              message: `${field} must be a valid non-negative number.`,
            },
            {
              status: 400,
            }
          );
        }

        updateData[field] = value;
      }
    }

    // ===============================================
    // VALIDATE TEXT FIELDS
    // ===============================================

    const nullableTextFields = [
      "machineNo",
      "computerCode",
      "operatorName",
      "otReplace",
      "remarks",
    ];

    for (const field of nullableTextFields) {
      if (updateData[field] !== undefined) {
        updateData[field] =
          updateData[field] === null
            ? null
            : String(updateData[field]).trim() || null;
      }
    }

    // ===============================================
    // VALIDATE STATUS
    // ===============================================

    if (updateData.status !== undefined) {
      if (
        !["COMPLETED", "CANCELLED"].includes(
          updateData.status
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid production status.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ===============================================
    // UPDATE + AUDIT LOG TRANSACTION
    // ===============================================

    const result = await prisma.$transaction(
      async (tx) => {
        const existing =
          await tx.productionRecord.findFirst({
            where: {
              id: productionId,
              deletedAt: null,
            },
            include: productionInclude,
          });

        if (!existing) {
          throw new Error("PRODUCTION_NOT_FOUND");
        }

        const finalOutputQty =
          updateData.outputQty !== undefined
            ? Number(updateData.outputQty)
            : Number(existing.outputQty);

        const finalOkQty =
          updateData.okQty !== undefined
            ? Number(updateData.okQty)
            : Number(existing.okQty);

        if (finalOkQty > finalOutputQty) {
          throw new Error("OK_QTY_EXCEEDS_OUTPUT");
        }

        const beforeData = createSnapshot(existing);

        const updated =
          await tx.productionRecord.update({
            where: {
              id: productionId,
            },
            data: {
              ...updateData,
              updatedBy: admin.email,
            },
            include: productionInclude,
          });

        const afterData = createSnapshot(updated);

        await tx.productionAuditLog.create({
          data: {
            recordId: productionId,
            action: "UPDATE",
            actorId: admin.id,
            actorEmail: admin.email,
            reason,
            beforeData,
            afterData,
          },
        });

        return updated;
      }
    );

    // ===============================================
    // RESPONSE
    // ===============================================

    return NextResponse.json({
      success: true,
      message: "Production record updated successfully.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PRODUCTION_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Production record not found or already deleted.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message === "OK_QTY_EXCEEDS_OUTPUT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "OK quantity cannot exceed output quantity.",
        },
        {
          status: 400,
        }
      );
    }

    console.error(
      "PATCH /api/production/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update production record.",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// DELETE PRODUCTION
// SOFT DELETE - ADMIN ONLY
// =====================================================

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // ===============================================
    // ADMIN AUTHORIZATION
    // ===============================================

    const auth = await getAdminUser();

    if (!auth.user) {
      return auth.response;
    }

    const admin = auth.user;

    // ===============================================
    // PARAMS
    // ===============================================

    const { id } = await context.params;
    const productionId = parseProductionId(id);

    if (!productionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid production ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ===============================================
    // REQUEST BODY
    // ===============================================

    const body = await request.json();

    const reason =
      typeof body.reason === "string"
        ? body.reason.trim()
        : "";

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          message: "Deletion reason is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (reason.length > 191) {
      return NextResponse.json(
        {
          success: false,
          message: "Reason cannot exceed 191 characters.",
        },
        {
          status: 400,
        }
      );
    }

    // ===============================================
    // SOFT DELETE + AUDIT LOG
    // ===============================================

    const result = await prisma.$transaction(
      async (tx) => {
        const existing =
          await tx.productionRecord.findFirst({
            where: {
              id: productionId,
              deletedAt: null,
            },
            include: productionInclude,
          });

        if (!existing) {
          throw new Error("PRODUCTION_NOT_FOUND");
        }

        const beforeData = createSnapshot(existing);

        const deletedAt = new Date();

        const deleted =
          await tx.productionRecord.update({
            where: {
              id: productionId,
            },
            data: {
              deletedAt,
              deletedBy: admin.email,
              deleteReason: reason,
              updatedBy: admin.email,
            },
            include: productionInclude,
          });

        const afterData = createSnapshot(deleted);

        await tx.productionAuditLog.create({
          data: {
            recordId: productionId,
            action: "DELETE",
            actorId: admin.id,
            actorEmail: admin.email,
            reason,
            beforeData,
            afterData,
          },
        });

        return deleted;
      }
    );

    // ===============================================
    // RESPONSE
    // ===============================================

    return NextResponse.json({
      success: true,
      message: "Production record deleted successfully.",
      data: {
        id: result.id,
        deletedAt: result.deletedAt,
        deletedBy: result.deletedBy,
        deleteReason: result.deleteReason,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PRODUCTION_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Production record not found or already deleted.",
        },
        {
          status: 404,
        }
      );
    }

    console.error(
      "DELETE /api/production/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete production record.",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}
