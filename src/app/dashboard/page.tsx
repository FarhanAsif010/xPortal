import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRates } from "@/actions/rates"
import { TransactionWorkspace } from "@/components/features/transactions/transaction-workspace"

export const dynamic = "force-dynamic"

export default async function TellerDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "SUPER_ADMIN") redirect("/admin/dashboard")
  if (!session.user.branchId) redirect("/no-branch")

  const rawRates = await getRates()

  const rates = rawRates.map((r) => ({
    id: r.id,
    currencyCode: r.currencyCode,
    buyRate: Number(r.buyRate),
    sellRate: Number(r.sellRate),
    updatedAt: r.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transaction Desk</h1>
        <p className="text-muted-foreground text-sm mt-1">Process currency exchange transactions</p>
      </div>
      <TransactionWorkspace
        rates={rates}
        teller={{
          id: session.user.id,
          name: session.user.name ?? "",
          branchId: session.user.branchId,
        }}
      />
    </div>
  )
}
