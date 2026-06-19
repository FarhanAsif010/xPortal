import { z } from "zod"

export const updateRateSchema = z.object({
  currencyCode: z.string().length(3).toUpperCase(),
  buyRate: z.number().positive(),
  sellRate: z.number().positive(),
})

export type UpdateRateInput = z.infer<typeof updateRateSchema>
