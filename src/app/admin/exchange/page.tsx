import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRates } from "@/actions/rates"
import { prisma } from "@/lib/db"
import { ExchangeWorkspace } from "@/components/features/transactions/exchange-workspace"

export const dynamic = "force-dynamic"

export default async function AdminExchangePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const [rawRates, branches, recentRaw] = await Promise.all([
    getRates(),
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        branch: { select: { name: true } },
        teller: { select: { name: true } },
      },
    }),
  ])

  const rates = rawRates.map((r) => ({
    id: r.id,
    currencyCode: r.currencyCode,
    buyRate: Number(r.buyRate),
    sellRate: Number(r.sellRate),
  }))

  const recent = recentRaw.map((t) => ({
    id: t.id,
    transactionNumber: t.transactionNumber,
    sourceCurrency: t.sourceCurrency,
    destCurrency: t.destCurrency,
    sourceAmount: Number(t.sourceAmount),
    destAmount: Number(t.destAmount),
    exchangeRate: Number(t.exchangeRate),
    createdAt: t.createdAt.toISOString(),
    branchName: (t.branch as { name: string } | null)?.name ?? "—",
    tellerName: (t.teller as { name: string } | null)?.name ?? "—",
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Currency Exchange</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Process currency exchange transactions using rates set by the administrator
        </p>
      </div>
      <ExchangeWorkspace
        rates={rates}
        branches={branches}
        adminId={session.user.id}
        adminName={session.user.name ?? "Admin"}
        recentTransactions={recent}
      />
    </div>
  )
}
