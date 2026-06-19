import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Shield } from "lucide-react"
import { AuditClient } from "@/components/features/audit/audit-client"

export const dynamic = "force-dynamic"

export default async function AuditPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { actor: { select: { name: true, email: true } } },
  })

  const serialized = logs.map(l => ({
    id: l.id,
    actorId: l.actorId,
    actorName: l.actor?.name ?? null,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    oldData: l.oldData as Record<string, unknown> | null,
    newData: l.newData as Record<string, unknown> | null,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="size-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Full history of all system actions</p>
        </div>
      </div>

      <AuditClient logs={serialized} />
    </div>
  )
}
