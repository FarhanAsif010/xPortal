'use client';
import { useState, useTransition } from 'react';
import { Pencil, Loader2, Check, X, Plus } from 'lucide-react';
import { updateExchangeRate } from '@/actions/rates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Rate = {
  id: string;
  currencyCode: string;
  buyRate: unknown;
  sellRate: unknown;
  updatedAt: Date;
};

export function RatesClient({ rates: initial, existingCodes }: { rates: Rate[]; existingCodes: string[] }) {
  const [rates] = useState(initial);
  const [editRate, setEditRate] = useState<Rate | null>(null);
  const [buyVal, setBuyVal] = useState('');
  const [sellVal, setSellVal] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newBuy, setNewBuy] = useState('');
  const [newSell, setNewSell] = useState('');

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fmt = (v: unknown) => Number(v).toFixed(4);

  const openEdit = (rate: Rate) => {
    setEditRate(rate);
    setBuyVal(fmt(rate.buyRate));
    setSellVal(fmt(rate.sellRate));
  };

  const handleSave = () => {
    if (!editRate) return;
    startTransition(async () => {
      const res = await updateExchangeRate({
        currencyCode: editRate.currencyCode,
        buyRate: parseFloat(buyVal),
        sellRate: parseFloat(sellVal),
      });
      if (res.error) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      } else {
        toast({ title: 'Rate updated' });
        setEditRate(null);
        location.reload();
      }
    });
  };

  const openAdd = () => {
    setNewCode('');
    setNewBuy('');
    setNewSell('');
    setAddOpen(true);
  };

  const handleAdd = () => {
    const code = newCode.trim().toUpperCase();

    if (code.length !== 3 || !/^[A-Z]{3}$/.test(code)) {
      toast({ title: 'Invalid code', description: 'Currency code must be 3 letters (e.g. USD)', variant: 'destructive' });
      return;
    }
    if (existingCodes.includes(code)) {
      toast({ title: 'Already exists', description: `${code} already has a rate — edit it from the table instead`, variant: 'destructive' });
      return;
    }
    const buy = parseFloat(newBuy);
    const sell = parseFloat(newSell);
    if (!buy || !sell || buy <= 0 || sell <= 0) {
      toast({ title: 'Invalid rates', description: 'Buy and sell rates must be positive numbers', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const res = await updateExchangeRate({ currencyCode: code, buyRate: buy, sellRate: sell });
      if (res.error) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      } else {
        toast({ title: 'Currency added', description: code });
        setAddOpen(false);
        location.reload();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="size-3.5" /> Add Currency
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Currency</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Buy Rate</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Sell Rate</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Last Updated</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rates.map((rate) => (
              <tr key={rate.currencyCode} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono font-bold">{rate.currencyCode}</td>
                <td className="px-4 py-3 text-right font-mono">{fmt(rate.buyRate)}</td>
                <td className="px-4 py-3 text-right font-mono">{fmt(rate.sellRate)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                  {format(new Date(rate.updatedAt), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(rate)}>
                    <Pencil className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {rates.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No currencies yet — click &quot;Add Currency&quot; to get started</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit dialog */}
      {editRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-lg p-6 w-full max-w-sm space-y-4 border border-border">
            <h3 className="font-bold text-base">Edit Rate — <span className="font-mono">{editRate.currencyCode}</span></h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buy Rate</label>
                <Input
                  type="number"
                  step="0.000001"
                  value={buyVal}
                  onChange={e => setBuyVal(e.target.value)}
                  placeholder="e.g. 1.0850"
                  className="font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Rate when customer gives this currency (buying from customer)</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sell Rate</label>
                <Input
                  type="number"
                  step="0.000001"
                  value={sellVal}
                  onChange={e => setSellVal(e.target.value)}
                  placeholder="e.g. 1.0920"
                  className="font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Rate when customer receives this currency (selling to customer)</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditRate(null)} disabled={isPending}>
                <X className="size-3.5 mr-1" /> Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isPending}>
                {isPending ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <Check className="size-3.5 mr-1" />}
                Save Rate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Currency dialog */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-lg p-6 w-full max-w-sm space-y-4 border border-border">
            <h3 className="font-bold text-base">Add Currency</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currency Code</label>
                <Input
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AED"
                  maxLength={3}
                  className="font-mono uppercase"
                />
                <p className="text-[10px] text-muted-foreground">3-letter ISO currency code</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buy Rate</label>
                <Input
                  type="number"
                  step="0.000001"
                  value={newBuy}
                  onChange={e => setNewBuy(e.target.value)}
                  placeholder="e.g. 1.0850"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sell Rate</label>
                <Input
                  type="number"
                  step="0.000001"
                  value={newSell}
                  onChange={e => setNewSell(e.target.value)}
                  placeholder="e.g. 1.0920"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)} disabled={isPending}>
                <X className="size-3.5 mr-1" /> Cancel
              </Button>
              <Button className="flex-1" onClick={handleAdd} disabled={isPending}>
                {isPending ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <Plus className="size-3.5 mr-1" />}
                Add Currency
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}