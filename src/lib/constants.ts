import { Role } from "@prisma/client"

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  TELLER: "Teller",
}

export const SUPPORTED_CURRENCIES = [
  "USD","EUR","GBP","JPY","CAD","AUD","CHF","CNY","INR","MXN",
  "SGD","HKD","NZD","SEK","NOK","DKK","ZAR","BRL","KRW","TRY",
] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export const BASE_CURRENCY = "USD" as const

export const SESSION_INACTIVITY_TIMEOUT_MS =
  (Number(process.env.SESSION_INACTIVITY_TIMEOUT_MINUTES) || 10) * 60 * 1000

export const TRANSACTION_NUMBER_PREFIX = "TXN"

export const PAGINATION_DEFAULTS = { page: 1, pageSize: 20, maxPageSize: 100 } as const

export const AMOUNT_LIMITS = { min: 0.01, max: 1_000_000 } as const
