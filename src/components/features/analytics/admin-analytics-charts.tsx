"use client"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = [
  "oklch(0.55_0.2_255)", "oklch(0.6_0.15_180)", "oklch(0.65_0.18_145)",
  "oklch(0.7_0.15_85)",  "oklch(0.6_0.2_25)",   "oklch(0.65_0.18_310)",
  "oklch(0.7_0.2_60)",   "oklch(0.6_0.15_220)",
]

export interface AdminAnalyticsProps {
  dailyData:   { date: string; transactions: number; volume: number }[]
  topBranches: { name: string; transactions: number; volume: number }[]
  currencies:  { currency: string; count: number }[]
}

// This component is NEVER server-rendered — imported with ssr:false in the
// wrapper below. Recharts uses incrementing IDs (recharts1-clip, recharts2-clip)
// that differ between server and client, causing hydration mismatches.
// Rendering client-only eliminates the mismatch entirely.
export function AdminAnalyticsCharts({ dailyData, topBranches, currencies }: AdminAnalyticsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Area chart — daily volume */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Daily Transaction Volume (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="oklch(0.55 0.2 255)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="oklch(0.55 0.2 255)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.01 247)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [v.toLocaleString(), ""]} />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="oklch(0.55 0.2 255)"
                fill="url(#volGrad)"
                strokeWidth={2}
                name="Volume (USD)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar chart — top branches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Branches by Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topBranches} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.01 247)" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="transactions" fill="oklch(0.55 0.2 255)" radius={[0, 4, 4, 0]} name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie chart — currency distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Currency Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center gap-6">
          <PieChart width={160} height={160}>
            <Pie
              data={currencies}
              cx={75} cy={75}
              innerRadius={45} outerRadius={70}
              dataKey="count"
              paddingAngle={3}
            >
              {currencies.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => [v, "transactions"]} />
          </PieChart>
          <div className="space-y-1.5">
            {currencies.slice(0, 6).map((c, i) => (
              <div key={c.currency} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="font-mono font-medium">{c.currency}</span>
                <span className="text-muted-foreground">{c.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
