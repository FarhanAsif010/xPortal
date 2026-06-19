import { z } from "zod"
export const createBranchSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  location: z.string().min(2, "Location must be at least 2 characters").max(200),
})
export const updateBranchSchema = createBranchSchema.partial().extend({ id: z.string().cuid() })
export type CreateBranchInput = z.infer<typeof createBranchSchema>
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>
