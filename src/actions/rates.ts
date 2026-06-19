"use server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { updateRateSchema } from "@/schemas/rate"
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

export async function updateExchangeRate(data: {
  currencyCode: string
  buyRate: number
  sellRate: number
}) {
  const session = await getAdminSession()
  const parsed = updateRateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message }

  const old = await prisma.exchangeRate.findUnique({ where: { currencyCode: parsed.data.currencyCode } })
  const rate = await prisma.exchangeRate.upsert({
    where: { currencyCode: parsed.data.currencyCode },
    update: { buyRate: parsed.data.buyRate, sellRate: parsed.data.sellRate, updatedById: session.user.id },
    create: { currencyCode: parsed.data.currencyCode, buyRate: parsed.data.buyRate, sellRate: parsed.data.sellRate, updatedById: session.user.id },
  })

  await createAuditLog({
    actorId: session.user.id,
    action: AuditAction.RATE_UPDATED,
    entityType: "ExchangeRate",
    entityId: rate.id,
    oldData: old as Record<string, unknown>,
    newData: parsed.data,
    ipAddress: await getIp(),
  })

  revalidatePath("/admin/rates")
  revalidatePath("/dashboard/rates")
  return { success: true, rate }
}

export async function getRates() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const rates = await prisma.exchangeRate.findMany({
    orderBy: { currencyCode: "asc" },
  })

  return rates.map((rate) => ({
    ...rate,
    buyRate: rate.buyRate.toString(),
    sellRate: rate.sellRate.toString(),
  }))
}
