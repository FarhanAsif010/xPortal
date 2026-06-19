import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { BranchDetailClient } from "@/components/features/branches/branch-detail-client"

export const dynamic = "force-dynamic"

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ branchId: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const { branchId } = await params

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      _count: { select: { users: true, transactions: true } },
      users: {
        where: { role: "TELLER" },
        select: { id: true, name: true, email: true, isActive: true },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!branch) notFound()

  const rawTransactions = await prisma.transaction.findMany({
    where: { branchId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      teller: { select: { name: true } },
    },
  })

  // Aggregate stats
  const totalVolumeByCurrency: Record<string, { sourceTotal: number; destTotal: number }> = {}
  for (const t of rawTransactions) {
    const key = `${t.sourceCurrency}→${t.destCurrency}`
    if (!totalVolumeByCurrency[key]) totalVolumeByCurrency[key] = { sourceTotal: 0, destTotal: 0 }
    totalVolumeByCurrency[key].sourceTotal += Number(t.sourceAmount)
    totalVolumeByCurrency[key].destTotal += Number(t.destAmount)
  }

  const transactions = rawTransactions.map((t) => ({
    id: t.id,
    transactionNumber: t.transactionNumber,
    sourceCurrency: t.sourceCurrency,
    destCurrency: t.destCurrency,
    sourceAmount: Number(t.sourceAmount),
    destAmount: Number(t.destAmount),
    exchangeRate: Number(t.exchangeRate),
    tellerName: t.teller?.name ?? "—",
    createdAt: t.createdAt.toISOString(),
  }))

  return (
    <BranchDetailClient
      branch={{
        id: branch.id,
        name: branch.name,
        location: branch.location,
        isActive: branch.isActive,
        createdAt: branch.createdAt.toISOString(),
        _count: branch._count,
        tellers: branch.users,
      }}
      transactions={transactions}
    />
  )
}
