import { z } from "zod"
import { AMOUNT_LIMITS } from "@/lib/constants"

export const createTransactionSchema = z.object({
  sourceCurrency: z.string().length(3).toUpperCase(),
  destCurrency: z.string().length(3).toUpperCase(),
  sourceAmount: z.number().min(AMOUNT_LIMITS.min).max(AMOUNT_LIMITS.max),
  exchangeRate: z.number().positive(),
  destAmount: z.number().positive(),
  branchId: z.string().optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
