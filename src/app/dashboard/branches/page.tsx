import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { TellerBranchesView } from '@/components/features/branches/teller-branches-view';

export const dynamic = 'force-dynamic';

export default async function TellerBranchesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === 'SUPER_ADMIN') redirect('/admin/branches');
  if (!session.user.branchId) redirect('/no-branch');

  // Tellers can see all active branches — no mutation access
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      location: true,
      isActive: true,
      createdAt: true,
      _count: { select: { users: true, transactions: true } },
    },
  });

  // Serialize Date before passing to Client Component
  const serialized = branches.map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    // Highlight the teller's own branch
    isOwn: b.id === session.user.branchId,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Active branches in your network
        </p>
      </div>
      <TellerBranchesView branches={serialized} />
    </div>
  );
}
