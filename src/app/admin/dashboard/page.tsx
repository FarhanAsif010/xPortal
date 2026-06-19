import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeftRight, Building2, TrendingUp, Users,
  DollarSign, Activity, ShieldCheck, Clock
} from 'lucide-react';
import { AdminAnalytics } from '@/components/features/analytics/admin-analytics';
import { startOfDay, startOfMonth, subDays, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN')
    redirect('/dashboard');

  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const last30 = subDays(now, 30);
  const yesterdayStart = startOfDay(subDays(now, 1));

  const [
    counters,
    totalBranches,
    activeBranches,
    totalTellers,
    activeTellers,
    branchStats,
    currencyStats,
    dailyVolume,
    recentTransactions,
    recentAuditLogs,
  ] = await Promise.all([
    // Single round trip for all transaction counts + volume sums
    prisma.$queryRaw<{
      total_txns: bigint; today_txns: bigint; yesterday_txns: bigint; month_txns: bigint;
      today_volume: string; month_volume: string;
    }[]>`
      SELECT
        COUNT(*)::bigint AS total_txns,
        COUNT(*) FILTER (WHERE "createdAt" >= ${todayStart})::bigint AS today_txns,
        COUNT(*) FILTER (WHERE "createdAt" >= ${yesterdayStart} AND "createdAt" < ${todayStart})::bigint AS yesterday_txns,
        COUNT(*) FILTER (WHERE "createdAt" >= ${monthStart})::bigint AS month_txns,
        COALESCE(SUM(source_amount) FILTER (WHERE "createdAt" >= ${todayStart}), 0)::text AS today_volume,
        COALESCE(SUM(source_amount) FILTER (WHERE "createdAt" >= ${monthStart}), 0)::text AS month_volume
      FROM transactions
    `,
    prisma.branch.count(),
    prisma.branch.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'TELLER' } }),
    prisma.user.count({ where: { role: 'TELLER', isActive: true } }),

    prisma.transaction.groupBy({
      by: ['branchId'],
      _count: { id: true },
      _sum: { sourceAmount: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    prisma.transaction.groupBy({
      by: ['sourceCurrency'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),
    prisma.$queryRaw<{ date: Date; count: bigint; volume: string }[]>`
      SELECT
        DATE("createdAt") AS date,
        COUNT(*)::bigint AS count,
        SUM(source_amount)::text AS volume
      FROM transactions
      WHERE "createdAt" >= ${last30}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
    prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        branch: { select: { name: true } },
        teller: { select: { name: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  const {
    total_txns: totalTxns,
    today_txns: todayTxns,
    yesterday_txns: yesterdayTxns,
    month_txns: monthTxns,
    today_volume: todayVolumeRaw,
    month_volume: monthVolumeRaw,
  } = counters[0];

  const todayVolume = parseFloat(todayVolumeRaw);
  const monthVolume = parseFloat(monthVolumeRaw);

  // Resolve branch names for stats — only needed if there are branch stats
  const branchIds = branchStats.map((b) => b.branchId);
  const branchRows = branchIds.length
    ? await prisma.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, name: true },
      })
    : [];
  const branchMap = Object.fromEntries(branchRows.map((b) => [b.id, b.name]));

  const topBranches = branchStats.map((b) => ({
    name: branchMap[b.branchId] ?? b.branchId.slice(0, 8),
    transactions: b._count.id,
    volume: Number(b._sum.sourceAmount ?? 0),
  }));

  const dailyData = dailyVolume.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    transactions: Number(d.count),
    volume: parseFloat(d.volume ?? '0'),
  }));

  const currencies = currencyStats.map((c) => ({
    currency: c.sourceCurrency,
    count: c._count.id,
  }));

  const txnChange = Number(yesterdayTxns) > 0
    ? (((Number(todayTxns) - Number(yesterdayTxns)) / Number(yesterdayTxns)) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Platform-wide overview — {format(now, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Badge variant="success" className="gap-1.5 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </Badge>
      </div>

      {/* KPI Cards — row 1 */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total Transactions',
            value: Number(totalTxns).toLocaleString(),
            sub: `${Number(todayTxns)} today${txnChange ? ` (${Number(txnChange) >= 0 ? '+' : ''}${txnChange}% vs yesterday)` : ''}`,
            icon: ArrowLeftRight,
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
          {
            label: 'Month Volume',
            value: `$${monthVolume >= 1000 ? (monthVolume / 1000).toFixed(1) + 'K' : monthVolume.toFixed(0)}`,
            sub: `$${todayVolume.toFixed(0)} today`,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          },
          {
            label: 'Branches',
            value: activeBranches,
            sub: `${totalBranches - activeBranches} inactive`,
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950/30',
          },
          {
            label: 'Active Tellers',
            value: activeTellers,
            sub: `${totalTellers - activeTellers} disabled`,
            icon: Users,
            color: 'text-violet-600',
            bg: 'bg-violet-50 dark:bg-violet-950/30',
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`size-4 ${color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Cards — row 2 */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'This Month Txns',
            value: Number(monthTxns).toLocaleString(),
            sub: 'current month',
            icon: TrendingUp,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
          },
          {
            label: 'Top Currency',
            value: currencies[0]?.currency ?? '—',
            sub: `${currencies[0]?.count ?? 0} transactions`,
            icon: Activity,
            color: 'text-pink-600',
            bg: 'bg-pink-50 dark:bg-pink-950/30',
          },
          {
            label: 'Yesterday Txns',
            value: Number(yesterdayTxns).toLocaleString(),
            sub: 'completed yesterday',
            icon: Clock,
            color: 'text-slate-600',
            bg: 'bg-slate-100 dark:bg-slate-800/30',
          },
          {
            label: 'System Status',
            value: 'Operational',
            sub: 'All services running',
            icon: ShieldCheck,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-950/30',
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`size-4 ${color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <AdminAnalytics
        dailyData={dailyData}
        topBranches={topBranches}
        currencies={currencies}
      />

      {/* Bottom row: Recent Transactions + Recent Audit Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowLeftRight className="size-4 text-muted-foreground" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentTransactions.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No transactions yet</p>
              ) : (
                recentTransactions.map((tx) => {
                  const branch = tx.branch as { name: string } | null;
                  const teller = tx.teller as { name: string } | null;
                  return (
                    <div key={tx.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-primary/10 text-primary">
                        <ArrowLeftRight className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{tx.sourceCurrency} → {tx.destCurrency}</span>
                          <span className="text-xs text-muted-foreground truncate">{tx.transactionNumber}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {branch?.name ?? '—'} · {teller?.name ?? '—'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm font-semibold">{Number(tx.sourceAmount).toFixed(2)} {tx.sourceCurrency}</p>
                        <p className="text-[10px] text-muted-foreground">{format(tx.createdAt, 'MMM d, HH:mm')}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Audit Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground" />
              Recent Audit Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentAuditLogs.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No audit logs yet</p>
              ) : (
                recentAuditLogs.map((log) => {
                  const actor = log.actor as { name: string } | null;
                  const isDestructive = ['LOGIN_FAILED', 'BRANCH_DEACTIVATED', 'EMPLOYEE_DISABLED', 'TRANSACTION_DELETED'].includes(log.action);
                  const isPositive = ['LOGIN', 'BRANCH_CREATED', 'EMPLOYEE_CREATED', 'TRANSACTION_CREATED', 'BRANCH_ACTIVATED'].includes(log.action);
                  return (
                    <div key={log.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        isDestructive ? 'bg-destructive' : isPositive ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{actor?.name ?? 'System'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{log.action}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground shrink-0">{format(log.createdAt, 'HH:mm:ss')}</p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
