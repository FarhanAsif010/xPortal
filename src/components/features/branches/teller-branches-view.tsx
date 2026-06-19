"use client"
import { useState } from "react"
import { MapPin, Users, ArrowLeftRight, Building2, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

type Branch = {
  id: string
  name: string
  location: string
  isActive: boolean
  createdAt: string
  isOwn: boolean
  _count: { users: number; transactions: number }
}

export function TellerBranchesView({ branches }: { branches: Branch[] }) {
  const [search, setSearch] = useState("")

  const filtered = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} active {filtered.length === 1 ? "branch" : "branches"}
      </p>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((b) => (
          <Card
            key={b.id}
            className={b.isOwn ? "border-primary/40 ring-1 ring-primary/20" : ""}
          >
            <CardContent className="p-5 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{b.name}</p>
                    {b.isOwn && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">
                        Your Branch
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{b.location}</span>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  {b._count.users} {b._count.users === 1 ? "teller" : "tellers"}
                </span>
                <span className="flex items-center gap-1">
                  <ArrowLeftRight className="size-3" />
                  {b._count.transactions.toLocaleString()} transactions
                </span>
              </div>

              {/* Created date */}
              <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-1">
                Opened {format(new Date(b.createdAt), "MMM d, yyyy")}
              </p>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Building2 className="size-10 mb-3 opacity-30" />
            <p className="font-medium">No branches found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  )
}
