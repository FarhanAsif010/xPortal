"use client"
import { useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import {
  CheckCircle2, RotateCcw, Printer, Clock, Building2, User, AlertCircle, ArrowRight
} from "lucide-react"
import { createTransaction } from "@/actions/transactions"
import { useToast } from "@/hooks/use-toast"
import { TransactionReceipt } from "./transaction-receipt"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"

type Rate = { id: string; currencyCode: string; buyRate: number; sellRate: number }
type Branch = { id: string; name: string }
type RecentTx = {
  id: string; transactionNumber: string
  sourceCurrency: string; destCurrency: string
  sourceAmount: number; destAmount: number; exchangeRate: number
  createdAt: string; branchName: string; tellerName: string
}
interface CompletedTx {
  transactionNumber: string
  sourceCurrency: string; destCurrency: string
  sourceAmount: number; exchangeRate: number; destAmount: number
  createdAt: Date; branchName: string; tellerName: string
}

const CURRENCY_NAMES: Record<string, string> = {
  EUR: "Euro", GBP: "Pound Sterling", JPY: "Japanese Yen", CAD: "Canadian Dollar",
  AUD: "Australian Dollar", CHF: "Swiss Franc", CNY: "Chinese Yuan", INR: "Indian Rupee",
  MXN: "Mexican Peso", SGD: "Singapore Dollar", HKD: "Hong Kong Dollar",
  NZD: "New Zealand Dollar", SEK: "Swedish Krona", NOK: "Norwegian Krone",
  DKK: "Danish Krone", ZAR: "South African Rand", BRL: "Brazilian Real",
  KRW: "Korean Won", TRY: "Turkish Lira",
}

export function ExchangeWorkspace({ rates, branches, adminName, recentTransactions }: {
  rates: Rate[]
  branches: Branch[]
  adminId: string
  adminName: string
  recentTransactions: RecentTx[]
}) {
  // Source = what the customer gives, Dest = what the customer receives
  const [sourceCurrency, setSourceCurrency] = useState("USD")
  const [destCurrency, setDestCurrency] = useState(rates[0]?.currencyCode ?? "EUR")
  const [sourceAmount, setSourceAmount] = useState("1000")
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id ?? "")
  const [loading, setLoading] = useState(false)
  const [completedTx, setCompletedTx] = useState<CompletedTx | null>(null)
  const [recent, setRecent] = useState(recentTransactions)
  const receiptRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const handlePrint = useReactToPrint({ contentRef: receiptRef })

  // Find the rate for this currency pair
  // All rates stored as: how many destCurrency per 1 sourceCurrency
  // We look up the non-USD currency's rate (stored as foreignPerUSD)
  const getRate = (): number => {
    if (sourceCurrency === "USD") {
      // Customer gives USD, gets foreign → use buyRate of dest
      const r = rates.find(r => r.currencyCode === destCurrency)
      return r ? r.buyRate : 1
    } else if (destCurrency === "USD") {
      // Customer gives foreign, gets USD → use sellRate of source
      const r = rates.find(r => r.currencyCode === sourceCurrency)
      return r ? r.sellRate : 1
    } else {
      // Cross rate: use buy of dest / buy of source (simplified)
      const src = rates.find(r => r.currencyCode === sourceCurrency)
      const dst = rates.find(r => r.currencyCode === destCurrency)
      if (src && dst) return dst.buyRate / src.buyRate
      return 1
    }
  }

  const exchangeRate = getRate()
  const numSourceAmount = parseFloat(sourceAmount) || 0
  const destAmount = numSourceAmount * exchangeRate

  const availableCurrencies = ["USD", ...rates.map(r => r.currencyCode)]

  const handleConfirm = async () => {
    if (!numSourceAmount || numSourceAmount <= 0 || !selectedBranchId) return
    setLoading(true)
    try {
      const res = await createTransaction({
        sourceCurrency,
        destCurrency,
        sourceAmount: numSourceAmount,
        exchangeRate,
        destAmount,
        branchId: selectedBranchId,
      })
      if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }); return }
      const tx = res.transaction!
      const branchObj = tx.branch as { name: string } | null
      const completed: CompletedTx = {
        transactionNumber: tx.transactionNumber,
        sourceCurrency: tx.sourceCurrency,
        destCurrency: tx.destCurrency,
        sourceAmount: Number(tx.sourceAmount),
        exchangeRate: Number(tx.exchangeRate),
        destAmount: Number(tx.destAmount),
        createdAt: new Date(tx.createdAt),
        branchName: branchObj?.name ?? branches.find(b => b.id === selectedBranchId)?.name ?? "—",
        tellerName: adminName,
      }
      setCompletedTx(completed)
      setRecent(prev => [{
        id: tx.id, transactionNumber: tx.transactionNumber,
        sourceCurrency: tx.sourceCurrency, destCurrency: tx.destCurrency,
        sourceAmount: Number(tx.sourceAmount), destAmount: Number(tx.destAmount),
        exchangeRate: Number(tx.exchangeRate),
        createdAt: tx.createdAt.toISOString(),
        branchName: completed.branchName, tellerName: adminName,
      }, ...prev.slice(0, 9)])
    } finally { setLoading(false) }
  }

  const reset = () => {
    setCompletedTx(null)
    setSourceAmount("1000")
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {/* ── Left: Form ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 space-y-5">

            {/* Branch */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch</label>
              <select
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {branches.length === 0
                  ? <option value="">No active branches</option>
                  : branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                }
              </select>
            </div>

            {/* Currency pair */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source Currency</label>
                <select
                  value={sourceCurrency}
                  onChange={e => setSourceCurrency(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {availableCurrencies.map(c => (
                    <option key={c} value={c}>{c} — {CURRENCY_NAMES[c] ?? c}</option>
                  ))}
                </select>
              </div>
              <div className="pb-1">
                <ArrowRight className="size-5 text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destination Currency</label>
                <select
                  value={destCurrency}
                  onChange={e => setDestCurrency(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {availableCurrencies.filter(c => c !== sourceCurrency).map(c => (
                    <option key={c} value={c}>{c} — {CURRENCY_NAMES[c] ?? c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Customer Amount ({sourceCurrency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={sourceAmount}
                  onChange={e => setSourceAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 pr-14 text-sm font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  {sourceCurrency}
                </span>
              </div>
            </div>

            {/* Rate display */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exchange Rate</label>
              <div className="h-10 flex items-center px-3 rounded-md border border-border bg-muted/30 text-sm font-mono font-semibold">
                1 {sourceCurrency} = {exchangeRate.toFixed(6)} {destCurrency}
              </div>
            </div>

            {/* Result */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Converted Amount ({destCurrency})
              </label>
              <div className={`relative h-10 flex items-center px-3 rounded-md border-2 font-mono font-bold ${
                numSourceAmount > 0
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "border-border bg-muted/30 text-muted-foreground"
              }`}>
                {numSourceAmount > 0
                  ? destAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                  : "0.00"}
                <span className="absolute right-3 text-xs font-bold text-muted-foreground">{destCurrency}</span>
              </div>
            </div>

            {/* Summary strip */}
            {numSourceAmount > 0 && (
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-center font-medium">
                Customer gives <span className="font-bold font-mono">{numSourceAmount.toLocaleString()} {sourceCurrency}</span>
                {" → "}receives <span className="font-bold font-mono">{destAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {destCurrency}</span>
              </div>
            )}

            {/* Confirm */}
            <button
              onClick={handleConfirm}
              disabled={loading || !numSourceAmount || numSourceAmount <= 0 || !selectedBranchId}
              className="w-full h-11 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : <CheckCircle2 className="size-4" />}
              Confirm Transaction
            </button>

            {branches.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                <AlertCircle className="size-4 shrink-0" />
                No active branches. Create a branch first before processing transactions.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Right: Receipt or Recent Transactions ────────────────────────── */}
      <div className="space-y-4">
        {completedTx ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
              <span className="font-semibold text-sm">Transaction Complete</span>
            </div>
            <div ref={receiptRef}>
              <TransactionReceipt tx={completedTx} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handlePrint()}
                className="flex-1 h-9 rounded-lg border border-border text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-accent transition-colors">
                <Printer className="size-3.5" /> Print Receipt
              </button>
              <button onClick={reset}
                className="flex-1 h-9 rounded-lg border border-border text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-accent transition-colors">
                <RotateCcw className="size-3.5" /> New Transaction
              </button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Clock className="size-4" /> Recent Transactions
              </div>
              {recent.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {recent.map(tx => (
                    <div key={tx.id} className="rounded-lg bg-muted/40 p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-muted-foreground">{tx.transactionNumber}</span>
                        <span className="font-mono text-xs font-bold">{tx.sourceCurrency} → {tx.destCurrency}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono">{tx.sourceAmount.toLocaleString()} {tx.sourceCurrency}</span>
                        <span className="font-mono font-semibold">{tx.destAmount.toFixed(2)} {tx.destCurrency}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Building2 className="size-2.5" />{tx.branchName}</span>
                        <span className="flex items-center gap-0.5"><User className="size-2.5" />{tx.tellerName}</span>
                        <span className="ml-auto">{format(new Date(tx.createdAt), "MMM d, HH:mm")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
