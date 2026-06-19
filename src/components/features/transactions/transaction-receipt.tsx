"use client"
import { format } from "date-fns"

interface ReceiptTx {
  transactionNumber: string
  sourceCurrency: string
  destCurrency: string
  sourceAmount: number
  exchangeRate: number
  destAmount: number
  createdAt: Date
  branchName: string
  tellerName: string
}

function fmtAmount(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function SingleReceipt({ tx }: { tx: ReceiptTx }) {
  return (
    <div className="bg-white text-black font-sans text-[12px] w-full">
      {/* Header */}
      <div className="flex border border-black">
        <div className="flex-1 p-3 border-r border-black">
          <p className="font-semibold text-sm">xPortal</p>
          <p className="mt-0.5">{tx.branchName}</p>
        </div>
        <div className="flex-1" />
      </div>

      {/* Receipt No / Date */}
      <div className="mt-3.5 border border-black">
        <div className="flex border-b border-black">
          <div className="flex-1 px-2 py-1 border-r border-black font-semibold">Receipt No.</div>
          <div className="flex-[2] px-2 py-1 text-center font-semibold">Date &amp; Time</div>
        </div>
        <div className="flex">
          <div className="flex-1 px-2 py-1 border-r border-black font-mono">{tx.transactionNumber}</div>
          <div className="flex-[2] px-2 py-1 text-center font-mono">{format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm")}</div>
        </div>
      </div>

      {/* Transaction table */}
      <div className="mt-3.5 border border-black">
        <div className="flex border-b border-black">
          <div className="flex-1 px-2 py-1 border-r border-black font-semibold">Foreign Currency</div>
          <div className="flex-1 px-2 py-1 border-r border-black font-semibold">Exchange Rate</div>
          <div className="flex-1 px-2 py-1 font-semibold">Local Currency Delivered</div>
        </div>
        <div className="flex min-h-[90px]">
          <div className="flex-1 px-2 py-1 border-r border-black font-mono">{fmtAmount(tx.sourceAmount)} {tx.sourceCurrency}</div>
          <div className="flex-1 px-2 py-1 border-r border-black font-mono">{tx.exchangeRate.toFixed(6)}</div>
          <div className="flex-1 px-2 py-1 font-mono">{fmtAmount(tx.destAmount)} {tx.destCurrency}</div>
        </div>
        <div className="flex border-t border-black">
          <div className="flex-[2] px-2 py-1.5 border-r border-black font-semibold">Total Receipt {tx.destCurrency}</div>
          <div className="flex-1 px-2 py-1.5 text-right font-semibold font-mono">{fmtAmount(tx.destAmount)} {tx.destCurrency}</div>
        </div>
      </div>
    </div>
  )
}

export function TransactionReceipt({ tx }: { tx: ReceiptTx }) {
  return (
    <div className="max-w-md mx-auto space-y-10 print:max-w-none print:space-y-16 print:p-8">
      <SingleReceipt tx={tx} />
      <SingleReceipt tx={tx} />
    </div>
  )
}