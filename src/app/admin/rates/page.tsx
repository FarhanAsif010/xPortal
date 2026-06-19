import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRates } from "@/actions/rates"
import { RatesClient } from "@/components/features/rates/rates-client"
import { SUPPORTED_CURRENCIES } from "@/lib/constants"

export const dynamic = "force-dynamic"

export default async function AdminRatesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const rawRates = await getRates()

  const rateMap = new Map(rawRates.map(r => [r.currencyCode, r]))

  // Predefined currency list (USD excluded — it's the base currency)
  const predefined = SUPPORTED_CURRENCIES.filter(c => c !== "USD").map(code => {
    const existing = rateMap.get(code)
    return existing
      ? {
          id: existing.id,
          currencyCode: existing.currencyCode,
          buyRate: Number(existing.buyRate),
          sellRate: Number(existing.sellRate),
          updatedAt: new Date(existing.updatedAt),
        }
      : {
          id: "",
          currencyCode: code,
          buyRate: 0,
          sellRate: 0,
          updatedAt: new Date(0),
        }
  })

  // Any custom currencies the admin added that aren't in the predefined list
  const predefinedCodes = new Set(predefined.map(r => r.currencyCode))
  const custom = rawRates
    .filter(r => !predefinedCodes.has(r.currencyCode))
    .map(r => ({
      id: r.id,
      currencyCode: r.currencyCode,
      buyRate: Number(r.buyRate),
      sellRate: Number(r.sellRate),
      updatedAt: new Date(r.updatedAt),
    }))

  const rates = [...predefined, ...custom]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exchange Rates</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Set buy and sell rates for each currency. Rates are applied immediately to all teller transactions.
        </p>
      </div>
      <RatesClient rates={rates} existingCodes={[...predefinedCodes, ...custom.map(c => c.currencyCode)]} />
    </div>
  )
}