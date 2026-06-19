import { Role, AuditAction } from "@prisma/client";

export type { Role, AuditAction };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
  isActive: boolean;
}

export interface BranchStats {
  branchId: string;
  branchName: string;
  transactionCount: number;
  totalVolume: number;
}

export interface CurrencyBreakdown {
  currencyCode: string;
  transactionCount: number;
  totalVolume: number;
}

export interface DashboardMetrics {
  totalTransactions: number;
  dailyVolume: number;
  monthlyVolume: number;
  branchComparison: BranchStats[];
  currencyBreakdown: CurrencyBreakdown[];
  topBranches: BranchStats[];
  topTellers: {
    tellerId: string;
    tellerName: string;
    branchName: string;
    transactionCount: number;
    totalVolume: number;
  }[];
}

export interface ReceiptData {
  transactionNumber: string;
  branchName: string;
  tellerName: string;
  sourceCurrency: string;
  destCurrency: string;
  sourceAmount: number;
  exchangeRate: number;
  destAmount: number;
  createdAt: Date;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
