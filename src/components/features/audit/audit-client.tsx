"use client"
import { useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Search, Shield, Trash2, Loader2, TriangleAlert } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { clearAuditLogs } from "@/actions/audit"
import type { AuditAction } from "@prisma/client"

type Log = {
  id: string
  actorId: string | null
  actorName: string | null
  action: AuditAction
  entityType: string
  entityId: string | null
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
}

const ACTION_COLORS: Record<string, "success" | "destructive" | "warning" | "default" | "secondary"> = {
  LOGIN: "success", LOGOUT: "secondary", LOGIN_FAILED: "destructive",
  BRANCH_CREATED: "success", BRANCH_UPDATED: "default", BRANCH_ACTIVATED: "success", BRANCH_DEACTIVATED: "warning",
  EMPLOYEE_CREATED: "success", EMPLOYEE_UPDATED: "default", EMPLOYEE_DISABLED: "destructive", EMPLOYEE_ENABLED: "success",
  RATE_UPDATED: "default",
  TRANSACTION_CREATED: "success", TRANSACTION_DELETED: "destructive",
}

export function AuditClient({ logs: initialLogs }: { logs: Log[] }) {
  const [logs, setLogs] = useState(initialLogs)
  const [search, setSearch] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.actorName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    l.entityType.toLowerCase().includes(search.toLowerCase())
  )

  const handleClear = () => {
    startTransition(async () => {
      const res = await clearAuditLogs()
      if (!res.success) {
        toast({ title: "Error", description: "Failed to clear audit logs", variant: "destructive" })
        return
      }
      toast({
        title: "Audit logs cleared",
        description: `${res.clearedCount} ${res.clearedCount === 1 ? "entry" : "entries"} deleted.`,
      })
      setLogs([])
      setShowConfirm(false)
      setConfirmText("")
    })
  }

  const canConfirm = confirmText.trim().toUpperCase() === "RESET"

  return (
    <div className="space-y-4">
      {/* Search + Reset button row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search actions, actors…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5 ml-auto"
          onClick={() => { setShowConfirm(true); setConfirmText("") }}
          disabled={logs.length === 0}
        >
          <Trash2 className="size-3.5" />
          Reset Audit Log
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Timestamp</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actor</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Entity</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(log => (
              <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs font-medium">
                        {(log.actorName ?? "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium truncate max-w-[120px]">{log.actorName ?? "System"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ACTION_COLORS[log.action] ?? "default"} className="text-xs font-mono">
                    {log.action.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-muted-foreground">{log.entityType}</span>
                  {log.entityId && (
                    <span className="ml-1 font-mono text-xs text-muted-foreground/60">
                      #{log.entityId.slice(-6)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden lg:table-cell">
                  {log.ipAddress ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
            {search ? "No entries match your search." : "No audit logs yet."}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {logs.length} entries.
      </p>

      {/* Confirm Reset Dialog */}
      <Dialog open={showConfirm} onOpenChange={(o) => { if (!o) { setShowConfirm(false); setConfirmText("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="size-4" />
              Reset Audit Log
            </DialogTitle>
            <DialogDescription className="pt-1">
              This will permanently delete all <strong>{logs.length}</strong> audit log{logs.length !== 1 ? "s" : ""} from the database. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              All login records, employee changes, transaction history, and system events will be wiped.
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Type <span className="font-mono font-bold">RESET</span> to confirm
              </label>
              <Input
                placeholder="RESET"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowConfirm(false); setConfirmText("") }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={!canConfirm || isPending}
              className="gap-2"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete All Logs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
