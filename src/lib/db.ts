import { PrismaClient } from "@prisma/client";


const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDatasourceUrl(): string {
  const base = process.env.DATABASE_URL ?? "";
  // If already has pgbouncer param don't add twice
  if (base.includes("pgbouncer=true")) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}pgbouncer=true&statement_cache_size=0`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: buildDatasourceUrl(),
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]   // removed "query" — too noisy in dev, re-add if debugging
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
