"use server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { createTransactionSchema } from "@/schemas/transaction"
import { AuditAction, Prisma } from "@prisma/client"
import { generateTransactionNumber } from "@/lib/spread-engine"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function getAuthSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  return session
}

export async function createTransaction(data: {
  sourceCurrency: string
  destCurrency: string
  sourceAmount: number
  exchangeRate: number
  destAmount: number
  branchId?: string
}) {
  const session = await getAuthSession()

  const branchId = data.branchId ?? session.user.branchId
  if (!branchId) return { error: "No branch specified" }

  if (session.user.role === "TELLER" && branchId !== session.user.branchId) {
    return { error: "Unauthorized: cannot create transaction for another branch" }
  }

  const parsed = createTransactionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message }

  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

  // Retry a few times in case of a rare race condition where two
  // concurrent requests generate the same transaction number.
  let transaction
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      transaction = await prisma.transaction.create({
        data: {
          transactionNumber: await generateTransactionNumber(),
          branchId,
          tellerId: session.user.id,
          sourceCurrency: parsed.data.sourceCurrency,
          destCurrency: parsed.data.destCurrency,
          sourceAmount: parsed.data.sourceAmount,
          exchangeRate: parsed.data.exchangeRate,
          destAmount: parsed.data.destAmount,
        },
        include: {
          branch: { select: { name: true } },
          teller: { select: { name: true } },
        },
      })
      break
    } catch (err) {
      const isUniqueViolation =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
      if (isUniqueViolation && attempt < 2) continue
      throw err
    }
  }
  if (!transaction) return { error: "Failed to create transaction" }

  await createAuditLog({
    actorId: session.user.id,
    action: AuditAction.TRANSACTION_CREATED,
    entityType: "Transaction",
    entityId: transaction.id,
    newData: {
      transactionNumber: transaction.transactionNumber,
      sourceAmount: Number(transaction.sourceAmount),
      sourceCurrency: transaction.sourceCurrency,
      destCurrency: transaction.destCurrency,
      branchId,
    },
    ipAddress: ip,
  })

  revalidatePath("/admin/exchange")

  // Decimal fields can't cross the Server Action boundary to a Client
  // Component as-is — convert to plain numbers/strings first.
  return {
    success: true,
    transaction: {
      id: transaction.id,
      transactionNumber: transaction.transactionNumber,
      branchId: transaction.branchId,
      tellerId: transaction.tellerId,
      sourceCurrency: transaction.sourceCurrency,
      destCurrency: transaction.destCurrency,
      sourceAmount: Number(transaction.sourceAmount),
      exchangeRate: Number(transaction.exchangeRate),
      destAmount: Number(transaction.destAmount),
      createdAt: transaction.createdAt,
      branch: transaction.branch,
      teller: transaction.teller,
    },
  }
}

export async function getTellerTransactions(limit = 20) {
  const session = await getAuthSession()
  if (!session.user.branchId) throw new Error("No branch assigned")
  return prisma.transaction.findMany({
    where: { tellerId: session.user.id, branchId: session.user.branchId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { branch: { select: { name: true } }, teller: { select: { name: true } } },
  })
}

export async function getAllTransactions(filters?: {
  branchId?: string; from?: Date; to?: Date; limit?: number
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized")
  return prisma.transaction.findMany({
    where: {
      ...(filters?.branchId && { branchId: filters.branchId }),
      ...(filters?.from || filters?.to
        ? { createdAt: { ...(filters.from && { gte: filters.from }), ...(filters.to && { lte: filters.to }) } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 100,
    include: { branch: { select: { name: true } }, teller: { select: { name: true } } },
  })
}