import { z } from "zod"
import { Role } from "@prisma/client"

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(128, "Password too long")
  .regex(/[a-z]/, "At least one lowercase letter")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[0-9]/, "At least one number")
  .regex(/[^A-Za-z0-9]/, "At least one special character")

export const createEmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase().trim(),
  password: passwordSchema,
  role: z.nativeEnum(Role),
  branchId: z.string().cuid().nullable().optional(),
})
export const updateEmployeeSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).max(100).optional(),
  branchId: z.string().cuid().nullable().optional(),
  isActive: z.boolean().optional(),
})
export const resetPasswordSchema = z.object({
  id: z.string().cuid(),
  password: passwordSchema,
})
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>