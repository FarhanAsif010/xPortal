import { prisma } from "@/lib/db"
import { AuditAction, Prisma } from "@prisma/client"

interface AuditParams {
  actorId: string | null
  action: AuditAction
  entityType: string
  entityId?: string | null
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export async function createAuditLog(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        oldData: params.oldData ? (params.oldData as Prisma.InputJsonValue) : Prisma.JsonNull,
        newData: params.newData ? (params.newData as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    })
  } catch (err) {
    console.error("[AuditLog] Failed:", err)
  }
}
