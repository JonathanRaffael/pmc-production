import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import ProductionHistoryPage from "@/components/admin/ProductionHistoryPage";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
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
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  // =====================================================
  // CHECK USER STATUS
  // =====================================================

  if (!user || !user.isActive) {
    redirect("/login");
  }

  // =====================================================
  // RENDER PRODUCTION HISTORY
  // =====================================================

  return (
    <ProductionHistoryPage
      isAdmin={user.role === "ADMIN"}
    />
  );
}