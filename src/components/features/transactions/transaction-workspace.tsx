"use client"
import { useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { ArrowLeftRight, ArrowRight, Printer, CheckCircle, Loader2 } from "lucide-react"
import { createTransaction } from "@/actions/transactions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { TransactionReceipt } from "./transaction-receipt"

type Rate = { id: string; currencyCode: string; buyRate: number; sellRate: number; updatedAt: string }
type Teller = { id: string; name: string; branchId: string }

interface CompletedTx {
  transactionNumber: string
  sourceCurrency: string; destCurrency: string
  sourceAmount: number; exchangeRate: number; destAmount: number
  createdAt: Date; branchName: string; tellerName: string
}

const CURRENCY_NAMES: Record<string, string> = {
  EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen", CAD: "Canadian Dollar",
  AUD: "Australian Dollar", CHF: "Swiss Franc", CNY: "Chinese Yuan", INR: "Indian Rupee",
  MXN: "Mexican Peso", SGD: "Singapore Dollar", HKD: "Hong Kong Dollar",
  NZD: "New Zealand Dollar", SEK: "Swedish Krona", NOK: "Norwegian Krone",
  DKK: "Danish Krone", ZAR: "South African Rand", BRL: "Brazilian Real",
  KRW: "Korean Won", TRY: "Turkish Lira",
}

export function TransactionWorkspace({ rates, teller }: { rates: Rate[], teller: Teller }) {
  const [sourceCurrency, setSourceCurrency] = useState("USD")
  const [destCurrency, setDestCurrency] = useState(rates[0]?.currencyCode ?? "EUR")
  const [sourceAmount, setSourceAmount] = useState<string>("1000")
  const [loading, setLoading] = useState(false)
  const [completedTx, setCompletedTx] = useState<CompletedTx | null>(null)
  const { toast } = useToast()
  const receiptRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({ contentRef: receiptRef })

  const availableCurrencies = ["USD", ...rates.map(r => r.currencyCode)]

  const getRate = (): number => {
    if (sourceCurrency === "USD") {
      const r = rates.find(r => r.currencyCode === destCurrency)
      return r ? r.buyRate : 1
    } else if (destCurrency === "USD") {
      const r = rates.find(r => r.currencyCode === sourceCurrency)
      return r ? r.sellRate : 1
    } else {
      const src = rates.find(r => r.currencyCode === sourceCurrency)
      const dst = rates.find(r => r.currencyCode === destCurrency)
      if (src && dst) return dst.buyRate / src.buyRate
      return 1
    }
  }

  const exchangeRate = getRate()
  const numSourceAmount = parseFloat(sourceAmount) || 0
  const destAmount = numSourceAmount * exchangeRate

  const handleSubmit = async () => {
    if (!numSourceAmount || numSourceAmount <= 0) return
    setLoading(true)
    try {
      const res = await createTransaction({
        sourceCurrency,
        destCurrency,
        sourceAmount: numSourceAmount,
        exchangeRate,
        destAmount,
      })
      if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }); return }
      const tx = res.transaction!
      const branchObj = tx.branch as { name: string } | null
      const tellerObj = tx.teller as { name: string } | null
      setCompletedTx({
        transactionNumber: tx.transactionNumber,
        sourceCurrency: tx.sourceCurrency,
        destCurrency: tx.destCurrency,
        sourceAmount: Number(tx.sourceAmount),
        exchangeRate: Number(tx.exchangeRate),
        destAmount: Number(tx.destAmount),
        createdAt: new Date(tx.createdAt),
        branchName: branchObj?.name ?? "",
        tellerName: tellerObj?.name ?? teller.name,
      })
      toast({ title: "Transaction complete", description: tx.transactionNumber })
    } finally { setLoading(false) }
  }

  if (completedTx) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle className="size-5" />
          <span className="font-semibold">Transaction Complete — {completedTx.transactionNumber}</span>
        </div>
        <div ref={receiptRef}>
          <TransactionReceipt tx={completedTx} />
        </div>
        <div className="flex gap-3">
          <Button onClick={() => handlePrint()} variant="outline" className="gap-2"><Printer className="size-4" />Print Receipt</Button>
          <Button onClick={() => setCompletedTx(null)}>New Transaction</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-5">
        {/* Currency pair */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div className="space-y-1.5">
            <Label>Source Currency</Label>
            <Select value={sourceCurrency} onValueChange={setSourceCurrency}>
              <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableCurrencies.map(c => (
                  <SelectItem key={c} value={c} className="font-mono">{c} — {CURRENCY_NAMES[c] ?? c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="pb-1">
            <ArrowRight className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <Label>Destination Currency</Label>
            <Select value={destCurrency} onValueChange={setDestCurrency}>
              <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableCurrencies.filter(c => c !== sourceCurrency).map(c => (
                  <SelectItem key={c} value={c} className="font-mono">{c} — {CURRENCY_NAMES[c] ?? c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label>Customer Amount ({sourceCurrency})</Label>
          <Input type="number" value={sourceAmount} onChange={e => setSourceAmount(e.target.value)} placeholder="0.00" className="font-mono" />
        </div>

        <Button onClick={handleSubmit} disabled={loading || !numSourceAmount || numSourceAmount <= 0} className="w-full gap-2" size="lg">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />}
          Confirm Transaction
        </Button>
      </div>

      {/* Calculation Panel */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {numSourceAmount > 0 ? (
            <>
              <Row label="Source Currency" value={sourceCurrency} />
              <Row label="Destination Currency" value={destCurrency} />
              <Row label="Customer Gives" value={`${numSourceAmount.toLocaleString()} ${sourceCurrency}`} />
              <Row label="Exchange Rate" value={`${exchangeRate.toFixed(6)}`} dim />
              <div className="border-t border-border pt-3 mt-3">
                <Row label="Customer Receives" value={`${destAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${destCurrency}`} highlight />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
              <ArrowLeftRight className="size-8 mb-2 opacity-30" />
              Enter an amount to preview
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value, dim, highlight }: { label: string; value: string; dim?: boolean; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className={dim ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`font-mono font-medium ${highlight ? "text-primary text-base" : dim ? "text-muted-foreground" : ""}`}>{value}</span>
    </div>
  )
}
