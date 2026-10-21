import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const productId =
      searchParams.get("productId");

    const date =
      searchParams.get("date");

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Date is required.",
        },
        {
          status: 400,
        }
      );
    }

    const productionDate =
      new Date(
        `${date}T00:00:00`
      );

    if (
      Number.isNaN(
        productionDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid date.",
        },
        {
          status: 400,
        }
      );
    }

    const target =
      await prisma.productionTarget.findFirst(
        {
          where: {
            productId:
              Number(productId),

            isActive: true,

            effectiveFrom: {
              lte:
                productionDate,
            },

            OR: [
              {
                effectiveTo: null,
              },
              {
                effectiveTo: {
                  gte:
                    productionDate,
                },
              },
            ],
          },

          orderBy: {
            effectiveFrom:
              "desc",
          },
        }
      );

    return NextResponse.json({
      success: true,

      data: target
        ? {
            id: target.id,

            productId:
              target.productId,

            target8H:
              Number(
                target.target8H
              ),

            effectiveFrom:
              target.effectiveFrom,

            effectiveTo:
              target.effectiveTo,

            isActive:
              target.isActive,
          }
        : null,
    });

  } catch (error) {
    console.error(
      "GET /api/production/target error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch production target.",
      },
      {
        status: 500,
      }
    );
  }
}