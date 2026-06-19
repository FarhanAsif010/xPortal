"use server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createEmployeeSchema, updateEmployeeSchema, resetPasswordSchema } from "@/schemas/employee"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

async function getAdminSession() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized")
  return session
}

export async function createEmployee(formData: FormData) {
  await getAdminSession()
  const parsed = createEmployeeSchema.safeParse({
    name: formData.get("name"), email: formData.get("email"),
    password: formData.get("password"), role: formData.get("role"),
    branchId: formData.get("branchId") || null,
  })
  if (!parsed.success) return { error: parsed.error.errors[0]?.message }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { error: "An employee with this email already exists" }
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const user = await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash, role: parsed.data.role, branchId: parsed.data.branchId ?? null },
  })
  revalidatePath("/admin/employees")
  return { success: true, user }
}

export async function updateEmployee(formData: FormData) {
  await getAdminSession()
  const isActiveRaw = formData.get("isActive")
  const parsed = updateEmployeeSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    branchId: formData.get("branchId") || null,
    isActive: isActiveRaw === null ? undefined : isActiveRaw === "true",
  })
  if (!parsed.success) return { error: parsed.error.errors[0]?.message }
  const user = await prisma.user.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name, branchId: parsed.data.branchId, isActive: parsed.data.isActive },
  })
  revalidatePath("/admin/employees")
  return { success: true, user }
}

export async function resetEmployeePassword(formData: FormData) {
  await getAdminSession()
  const parsed = resetPasswordSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { error: parsed.error.errors[0]?.message }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.id } })
  if (!target) return { error: "Employee not found" }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  await prisma.user.update({
    where: { id: parsed.data.id },
    data: { passwordHash },
  })

  revalidatePath("/admin/employees")
  return { success: true }
}

export async function deleteEmployee(formData: FormData) {
  const session = await getAdminSession()
  const id = formData.get("id") as string
  if (!id) return { error: "Missing employee id" }

  if (id === session.user.id) {
    return { error: "You cannot delete your own account" }
  }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return { error: "Employee not found" }

  // Transactions reference the teller with onDelete: Restrict — deleting
  // a user who has processed transactions would violate that constraint
  // and erase audit trail. Check first and give a clear message instead
  // of a raw database error.
  const txnCount = await prisma.transaction.count({ where: { tellerId: id } })
  if (txnCount > 0) {
    return {
      error: `${target.name} has processed ${txnCount} transaction${txnCount === 1 ? "" : "s"} and cannot be deleted. Disable their account instead to preserve transaction history.`,
    }
  }

  await prisma.user.delete({ where: { id } })
  revalidatePath("/admin/employees")
  return { success: true }
}

export async function getEmployees() {
  await getAdminSession()
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { branch: { select: { name: true } } },
  })
}