"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, MapPin, Users, ArrowLeftRight, CheckCircle2,
  XCircle, TrendingUp, Calendar, Hash, User, Search, Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

type Teller = { id: string; name: string; email: string; isActive: boolean }

type Transaction = {
  id: string
  transactionNumber: string
  sourceCurrency: string
  destCurrency: string
  sourceAmount: number
  destAmount: number
  exchangeRate: number
  tellerName: string
  createdAt: string
}

type Branch = {
  id: string
  name: string
  location: string
  isActive: boolean
  createdAt: string
  _count: { users: number; transactions: number }
  tellers: Teller[]
}

export function BranchDetailClient({
  branch,
  transactions,
}: {
  branch: Branch
  transactions: Transaction[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const filtered = transactions.filter(
    (t) =>
      t.transactionNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.sourceCurrency.toLowerCase().includes(search.toLowerCase()) ||
      t.destCurrency.toLowerCase().includes(search.toLowerCase()) ||
      t.tellerName.toLowerCase().includes(search.toLowerCase())
  )

  // Summary stats
  const totalTransactions = transactions.length
  const totalSourceVolume = transactions.reduce((s, t) => s + t.sourceAmount, 0)
  const avgRate =
    transactions.length > 0
      ? transactions.reduce((s, t) => s + t.exchangeRate, 0) / transactions.length
      : 0

  // Currency pair breakdown
  const pairMap: Record<string, number> = {}
  for (const t of transactions) {
    const key = `${t.sourceCurrency} → ${t.destCurrency}`
    pairMap[key] = (pairMap[key] ?? 0) + 1
  }
  const topPairs = Object.entries(pairMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  function exportCSV() {
    const header = "Transaction ID,Txn Number,From,To,Source Amount,Dest Amount,Rate,Teller,Date\n"
    const rows = transactions
      .map(
        (t) =>
          `${t.id},${t.transactionNumber},${t.sourceCurrency},${t.destCurrency},${t.sourceAmount},${t.destAmount},${t.exchangeRate},${t.tellerName},${t.createdAt}`
      )
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${branch.name.replace(/\s+/g, "_")}_transactions.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0"
          onClick={() => router.push("/admin/branches")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{branch.name}</h1>
            <Badge variant={branch.isActive ? "success" : "secondary"}>
              {branch.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="size-3.5 shrink-0" />
            <span>{branch.location}</span>
            <span className="mx-1">·</span>
            <Calendar className="size-3.5 shrink-0" />
            <span>Since {format(new Date(branch.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <ArrowLeftRight className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
                <p className="text-xl font-bold">{totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-500/10">
                <TrendingUp className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Volume (source)</p>
                <p className="text-xl font-bold">
                  {totalSourceVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500/10">
                <Users className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tellers</p>
                <p className="text-xl font-bold">{branch._count.users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-purple-500/10">
                <Hash className="size-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Exchange Rate</p>
                <p className="text-xl font-bold">
                  {avgRate > 0 ? avgRate.toFixed(4) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tellers + Top Pairs row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tellers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="size-4" /> Tellers at this Branch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {branch.tellers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tellers assigned.</p>
            ) : (
              branch.tellers.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                    </div>
                  </div>
                  {t.isActive ? (
                    <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="size-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top currency pairs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowLeftRight className="size-4" /> Top Currency Pairs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topPairs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              topPairs.map(([pair, count]) => (
                <div key={pair} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-mono">{pair}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-primary/20 w-24 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, (count / totalTransactions) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm font-semibold">
              Transactions ({filtered.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, currency, teller…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 w-56 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
                <Download className="size-3.5" /> Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Txn Number</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Pair</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Source Amt</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Dest Amt</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Rate</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Teller</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      {search ? "No transactions match your search." : "No transactions yet."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {t.transactionNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">{t.sourceCurrency}</span>
                          <ArrowLeftRight className="size-3 text-muted-foreground" />
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">{t.destCurrency}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                        {t.sourceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                        {t.destAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums whitespace-nowrap text-muted-foreground">
                        {t.exchangeRate.toFixed(6)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="size-5 rounded-full bg-muted flex items-center justify-center">
                            <User className="size-3 text-muted-foreground" />
                          </div>
                          {t.tellerName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {format(new Date(t.createdAt), "MMM d, yyyy · HH:mm")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
