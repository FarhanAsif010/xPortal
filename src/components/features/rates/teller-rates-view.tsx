"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

type Rate = {
  id: string
  currencyCode: string
  buyRate: number
  sellRate: number
  updatedAt: string
}

const CURRENCY_NAMES: Record<string, string> = {
  EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen", CAD: "Canadian Dollar",
  AUD: "Australian Dollar", CHF: "Swiss Franc", CNY: "Chinese Yuan", INR: "Indian Rupee",
  MXN: "Mexican Peso", SGD: "Singapore Dollar", HKD: "Hong Kong Dollar",
  NZD: "New Zealand Dollar", SEK: "Swedish Krona", NOK: "Norwegian Krone",
  DKK: "Danish Krone", ZAR: "South African Rand", BRL: "Brazilian Real",
  KRW: "Korean Won", TRY: "Turkish Lira",
}

export function TellerRatesView({ rates }: { rates: Rate[] }) {
  const [search, setSearch] = useState("")

  const filtered = rates.filter(r =>
    r.currencyCode.toLowerCase().includes(search.toLowerCase()) ||
    (CURRENCY_NAMES[r.currencyCode] ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search currency..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Currency</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Buy Rate</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Sell Rate</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold">{r.currencyCode}</td>
                    <td className="px-4 py-3 text-muted-foreground">{CURRENCY_NAMES[r.currencyCode] ?? r.currencyCode}</td>
                    <td className="px-4 py-3 text-right font-mono">{r.buyRate.toFixed(4)}</td>
                    <td className="px-4 py-3 text-right font-mono">{r.sellRate.toFixed(4)}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">{format(new Date(r.updatedAt), "MMM d, HH:mm")}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No rates found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Rates are set by the administrator. Last updated: {rates[0] ? format(new Date(rates[0].updatedAt), "MMM d, yyyy HH:mm") : "—"}
      </p>
    </div>
  )
}
