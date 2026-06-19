// "use server"
import { format } from "date-fns"
import { prisma } from "@/lib/db"

export async function generateTransactionNumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd")
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const count = await prisma.transaction.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } },
  })

  const seq = String(count + 1).padStart(6, "0")
  return `TXN-${today}-${seq}`
}

export function roundRate(value: number) { return Math.round(value * 1e8) / 1e8 }
export function roundAmount(value: number) { return Math.round(value * 1e4) / 1e4 }