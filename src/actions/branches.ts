"use server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { createBranchSchema, updateBranchSchema } from "@/schemas/branch"
import { AuditAction } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

async function getAdminSession() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized")
  return session
}

async function getIp() {
  const h = await headers()
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
}

export async function createBranch(formData: FormData) {
  const session = await getAdminSession()
  const parsed = createBranchSchema.safeParse({ name: formData.get("name"), location: formData.get("location") })
  if (!parsed.success) return { error: parsed.error.errors[0]?.message }
  const branch = await prisma.branch.create({ data: parsed.data })
  await createAuditLog({ actorId: session.user.id, action: AuditAction.BRANCH_CREATED, entityType: "Branch", entityId: branch.id, newData: parsed.data, ipAddress: await getIp() })
  revalidatePath("/admin/branches")
  return { success: true, branch }
}

export async function updateBranch(formData: FormData) {
  const session = await getAdminSession()
  const parsed = updateBranchSchema.safeParse({ id: formData.get("id"), name: formData.get("name"), location: formData.get("location") })
  if (!parsed.success) return { error: parsed.error.errors[0]?.message }
  const old = await prisma.branch.findUnique({ where: { id: parsed.data.id } })
  const branch = await prisma.branch.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name, location: parsed.data.location } })
  await createAuditLog({ actorId: session.user.id, action: AuditAction.BRANCH_UPDATED, entityType: "Branch", entityId: branch.id, oldData: old as Record<string,unknown>, newData: parsed.data, ipAddress: await getIp() })
  revalidatePath("/admin/branches")
  return { success: true, branch }
}

export async function toggleBranchStatus(id: string, isActive: boolean) {
  const session = await getAdminSession()
  const branch = await prisma.branch.update({ where: { id }, data: { isActive } })
  await createAuditLog({ actorId: session.user.id, action: isActive ? AuditAction.BRANCH_ACTIVATED : AuditAction.BRANCH_DEACTIVATED, entityType: "Branch", entityId: id, ipAddress: await getIp() })
  revalidatePath("/admin/branches")
  return { success: true, branch }
}

export async function getBranches() {
  await getAdminSession()
  return prisma.branch.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { users: true, transactions: true } } } })
}
