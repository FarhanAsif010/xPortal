"use client"
import dynamic from "next/dynamic"
import type { AdminAnalyticsProps } from "./admin-analytics-charts"

// ssr: false — Recharts generates incremental DOM IDs during render.
// The server and client produce different ID sequences, causing hydration
// mismatches. Disabling SSR means the charts only render on the client
// where there is exactly one consistent ID sequence.
const AdminAnalyticsCharts = dynamic(
  () => import("./admin-analytics-charts").then((m) => m.AdminAnalyticsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`rounded-xl border border-border bg-card animate-pulse ${i === 0 ? "lg:col-span-2 h-[284px]" : "h-[264px]"}`}
          />
        ))}
      </div>
    ),
  }
)

export function AdminAnalytics(props: AdminAnalyticsProps) {
  return <AdminAnalyticsCharts {...props} />
}
