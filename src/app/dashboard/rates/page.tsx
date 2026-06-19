import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRates } from "@/actions/rates"
import { TellerRatesView } from "@/components/features/rates/teller-rates-view"

export const dynamic = "force-dynamic"

export default async function TellerRatesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "SUPER_ADMIN") redirect("/admin/rates")
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
        <h1 className="text-2xl font-bold tracking-tight">Exchange Rates</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Current buy and sell rates set by the administrator
        </p>
      </div>
      <TellerRatesView rates={rates} />
    </div>
  )
}
