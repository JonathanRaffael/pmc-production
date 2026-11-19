
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalProducts,
      purchaseOrders,
      productionRecords,
    ] = await Promise.all([
      prisma.moldingProduct.count({
        where: {
          isActive: true,
        },
      }),

      prisma.moldingPO.findMany({
        include: {
          moldingProduct: {
            select: {
              computerCode: true,
              productName: true,
            },
          },
          allocations: {
            select: {
              allocatedQty: true,
            },
          },
        },
        orderBy: [
          {
            deliveryDeadline: "asc",
          },
          {
            poDate: "asc",
          },
          {
            id: "asc",
          },
        ],
      }),

      prisma.moldingProductionRecord.findMany({
        select: {
          outputQty: true,
          okQty: true,
          allocations: {
            select: {
              allocatedQty: true,
            },
          },
        },
      }),
    ]);

    // =================================================
    // PO STATUS CALCULATION
    // =================================================

    let openPO = 0;
    let inProgressPO = 0;
    let completedPO = 0;

    const formattedPOs = purchaseOrders.map((po) => {
      const totalPOQty = Number(po.totalPOQty);

      const allocatedQty = po.allocations.reduce(
        (sum, allocation) =>
          sum + Number(allocation.allocatedQty),
        0
      );

      let status: "OPEN" | "IN_PROGRESS" | "COMPLETED";

      if (totalPOQty > 0 && allocatedQty >= totalPOQty) {
        status = "COMPLETED";
        completedPO++;
      } else if (allocatedQty > 0) {
        status = "IN_PROGRESS";
        inProgressPO++;
      } else {
        status = "OPEN";
        openPO++;
      }

      const remainingQty = Math.max(
        0,
        totalPOQty - allocatedQty
      );

      const progress =
        totalPOQty > 0
          ? Math.min(
              100,
              (allocatedQty / totalPOQty) * 100
            )
          : 0;

      return {
        id: po.id,
        poNumber: po.poNumber,
        computerCode: po.moldingProduct.computerCode,
        productName: po.moldingProduct.productName,
        poDate: po.poDate,
        deliveryDeadline: po.deliveryDeadline,
        actualPOQty: Number(po.actualPOQty),
        bufferQty: Number(po.bufferQty),
        totalPOQty,
        allocatedQty,
        remainingQty,
        progress: Number(progress.toFixed(2)),
        status,
      };
    });

    // =================================================
    // PRODUCTION CALCULATION
    // =================================================

    const totalProductionOutput = productionRecords.reduce(
      (sum, record) =>
        sum + Number(record.outputQty),
      0
    );

    const totalOKQty = productionRecords.reduce(
      (sum, record) =>
        sum + Number(record.okQty),
      0
    );

    const totalAllocatedQty = productionRecords.reduce(
      (sum, record) =>
        sum +
        record.allocations.reduce(
          (allocationSum, allocation) =>
            allocationSum + Number(allocation.allocatedQty),
          0
        ),
      0
    );

    const totalUnallocatedOutput = Math.max(
      0,
      totalOKQty - totalAllocatedQty
    );

    // =================================================
    // RESPONSE
    // =================================================

    return NextResponse.json({
      success: true,

      summary: {
        totalProducts,
        totalPO: purchaseOrders.length,
        openPO,
        inProgressPO,
        completedPO,
        totalProductionOutput,
        totalOKQty,
        totalAllocatedQty,
        totalUnallocatedOutput,
      },

      recentPOs: formattedPOs.slice(0, 8),
    });
  } catch (error) {
    console.error("Molding Dashboard API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load Molding Dashboard data.",
      },
      {
        status: 500,
      }
    );
  }
}
