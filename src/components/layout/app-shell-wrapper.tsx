"use client"
import dynamic from "next/dynamic"

// AppShell uses Radix UI (DropdownMenu) which generates incremental IDs during
// render. Server and client produce different sequences → hydration mismatch.
// ssr: false renders the shell only on the client, eliminating the mismatch.
const AppShellClient = dynamic(
  () => import("./app-shell").then((m) => m.AppShell),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex fixed inset-y-0 left-0 w-60 bg-card border-r border-border flex-col">
          <div className="h-14 border-b border-border px-4 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary/20 animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          </div>
          <div className="p-3 space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        </div>
        {/* Main skeleton */}
        <div className="flex-1 md:ml-60">
          <div className="h-14 border-b border-border bg-card" />
        </div>
      </div>
    ),
  }
)

export function AppShell({ children }: { children: React.ReactNode }) {
  return <AppShellClient>{children}</AppShellClient>
}
