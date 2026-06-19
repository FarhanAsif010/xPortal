import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTellerTransactions } from "@/actions/transactions"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function HistoryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.branchId) redirect("/no-branch")

  const transactions = await getTellerTransactions(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Transactions</h1>
        <p className="text-muted-foreground text-sm mt-1">Your recent exchange history</p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {["Ref #", "Source", "Destination", "Customer Amount", "Rate", "Converted Amount", "Date"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{tx.transactionNumber}</td>
                <td className="px-4 py-3 font-mono font-semibold">{tx.sourceCurrency}</td>
                <td className="px-4 py-3 font-mono font-semibold">{tx.destCurrency}</td>
                <td className="px-4 py-3 font-mono">{Number(tx.sourceAmount).toLocaleString()} {tx.sourceCurrency}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{Number(tx.exchangeRate).toFixed(6)}</td>
                <td className="px-4 py-3 font-mono font-semibold">{Number(tx.destAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {tx.destCurrency}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, HH:mm")}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No transactions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
