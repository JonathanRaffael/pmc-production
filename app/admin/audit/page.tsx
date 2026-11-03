import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import ProductionAuditPage from "@/components/admin/ProductionAuditPage";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  // =====================================================
  // CHECK SESSION
  // =====================================================

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // =====================================================
  // VALIDATE USER FROM DATABASE
  // =====================================================

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }

  // =====================================================
  // ADMIN ONLY
  // =====================================================

  if (user.role !== "ADMIN") {
    redirect("/admin");
  }

  return <ProductionAuditPage />;
}