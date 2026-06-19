"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, ArrowLeftRight, DollarSign, GitBranch } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const CHART_COLORS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#8b5cf6","#14b8a6","#f97316","#ec4899"]

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n/1_000).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

interface Metrics {
  totalTransactions: number; dailyVolume: number; monthlyVolume: number
  branchStats: { id: string; name: string; isActive: boolean; txCount: number; volume: number }[]
  tellerStats: { id: string; name: string; branchName: string; txCount: number; volume: number }[]
  currencyStats: { code: string; count: number; volume: number }[]
  recentTransactions: {
    id: string; transactionNumber: string
    sourceCurrency: string; destCurrency: string
    sourceAmount: number; destAmount: number; exchangeRate: number
    branchName: string; tellerName: string; createdAt: string
  }[]
}

export function AnalyticsDashboard({ metrics }: { metrics: Metrics }) {
  const statCards = [
    { label: "Total Transactions", value: metrics.totalTransactions.toLocaleString(), icon: ArrowLeftRight, color: "text-primary" },
    { label: "Daily Volume", value: fmt(metrics.dailyVolume), icon: DollarSign, color: "text-green-600" },
    { label: "Monthly Volume", value: fmt(metrics.monthlyVolume), icon: TrendingUp, color: "text-blue-600" },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="branches">
        <TabsList>
          <TabsTrigger value="branches">Branch Performance</TabsTrigger>
          <TabsTrigger value="currencies">Currency Breakdown</TabsTrigger>
          <TabsTrigger value="tellers">Top Tellers</TabsTrigger>
          <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
        </TabsList>

        {/* Branch Performance */}
        <TabsContent value="branches" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Volume by Branch</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={metrics.branchStats} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [fmt(v), "Volume"]} />
                    <Bar dataKey="volume" fill="#6366f1" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Branch Table</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Branch</th><th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Transactions</th><th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Volume</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {metrics.branchStats.map(b => (
                      <tr key={b.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 flex items-center gap-2"><GitBranch className="h-3.5 w-3.5 text-muted-foreground" />{b.name}<Badge variant={b.isActive ? "success" : "secondary"} className="text-xs">{b.isActive ? "Active" : "Off"}</Badge></td>
                        <td className="px-4 py-2.5 text-right">{b.txCount}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{fmt(b.volume)}</td>
                      </tr>
                    ))}
                    {metrics.branchStats.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No branch data yet</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Currency Breakdown */}
        <TabsContent value="currencies" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Volume by Currency</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                {metrics.currencyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={metrics.currencyStats} dataKey="volume" nameKey="code" cx="50%" cy="50%" outerRadius={110} label={({ code, percent }) => `${code} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                        {metrics.currencyStats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [fmt(v), "Volume"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="py-16 text-muted-foreground text-sm">No transactions yet</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Currency Stats</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Currency</th><th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Count</th><th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Volume</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {metrics.currencyStats.map((c, i) => (
                      <tr key={c.code} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{c.code}</div></td>
                        <td className="px-4 py-2.5 text-right">{c.count}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{fmt(c.volume)}</td>
                      </tr>
                    ))}
                    {metrics.currencyStats.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No data yet</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Tellers */}
        <TabsContent value="tellers" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Top Performing Tellers</CardTitle><CardDescription>Ranked by transaction count</CardDescription></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border"><th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Teller</th><th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Branch</th><th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Transactions</th><th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Volume</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {metrics.tellerStats.map((t, i) => (
                    <tr key={t.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">#{i+1}</div><span className="font-medium">{t.name}</span></div></td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.branchName}</td>
                      <td className="px-4 py-3 text-right">{t.txCount}</td>
                      <td className="px-4 py-3 text-right font-mono">{fmt(t.volume)}</td>
                    </tr>
                  ))}
                  {metrics.tellerStats.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No teller data yet</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Transactions */}
        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">TXN #</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">From → To</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Customer Gives</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Customer Receives</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Branch</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Time</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {metrics.recentTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs">{t.transactionNumber}</td>
                        <td className="px-4 py-3 font-mono font-semibold">{t.sourceCurrency} → {t.destCurrency}</td>
                        <td className="px-4 py-3 text-right font-mono">{t.sourceAmount.toFixed(2)} {t.sourceCurrency}</td>
                        <td className="px-4 py-3 text-right font-mono">{t.destAmount.toFixed(2)} {t.destCurrency}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{t.branchName}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{new Date(t.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {metrics.recentTransactions.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No transactions yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
