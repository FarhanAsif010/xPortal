"use server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { AuditAction } from "@prisma/client"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function getAdminSession() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized")
  return session
}

async function getIp() {
  const h = await headers()
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
}

export async function clearAuditLogs() {
  const session = await getAdminSession()

  const count = await prisma.auditLog.count()
  await prisma.auditLog.deleteMany({})

  // Record the clear action itself — this will be the first entry after the reset
  await createAuditLog({
    actorId: session.user.id,
    action: AuditAction.EMPLOYEE_UPDATED, // reusing closest available action
    entityType: "AuditLog",
    entityId: null,
    newData: { clearedRows: count, clearedBy: session.user.email },
    ipAddress: await getIp(),
  })

  revalidatePath("/admin/audit")
  return { success: true, clearedCount: count }
}
