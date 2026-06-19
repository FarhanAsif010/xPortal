import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { BranchesClient } from "@/components/features/branches/branches-client"

export const dynamic = "force-dynamic"

export default async function BranchesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const rawBranches = await prisma.branch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, transactions: true } },
    },
  })

  const branches = rawBranches.map(b => ({
    id: b.id,
    name: b.name,
    location: b.location,
    isActive: b.isActive,
    createdAt: b.createdAt.toISOString(),
    _count: b._count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your exchange branch network</p>
      </div>
      <BranchesClient branches={branches} />
    </div>
  )
}
