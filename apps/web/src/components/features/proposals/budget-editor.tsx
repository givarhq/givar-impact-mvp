'use client';

import { BudgetItem } from '../../../stores/proposal-store';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import { useEffect } from 'react';
import { useProposalStore } from '../../../stores/proposal-store';
import { cn } from '../../../lib/utils/cn';

interface BudgetEditorProps {
  items?: BudgetItem[];
  onChange?: (items: BudgetItem[]) => void;
  readOnly?: boolean;
  isLive?: boolean;
  isAdjustmentMode?: boolean;
}

export function BudgetEditor({
  items,
  onChange,
  readOnly = false,
  isLive = false,
  isAdjustmentMode = false
}: BudgetEditorProps) {
  const store = useProposalStore();

  const budgetBreakdown = items || store.budgetBreakdown;
  const updateField = onChange ? (val: any) => onChange(val) : (val: any) => store.updateField('budgetBreakdown', val);

  const isLocked = readOnly || (isLive && !isAdjustmentMode);

  const handleUpdate = (id: string, field: keyof BudgetItem, value: any) => {
    if (isLocked) return;
    let processedValue = value;

    if (field === 'cost') {
      const raw = parseFormattedNumber(String(value));
      processedValue = raw === '' ? 0 : Number(raw);
      if (isNaN(processedValue)) processedValue = 0;
    }

    const updatedBudget = budgetBreakdown.map(item =>
      item.id === id ? { ...item, [field]: processedValue } : item
    );
    updateField(updatedBudget);
  };

  const addItem = () => {
    if (isLocked) return;
    const newItem: BudgetItem = {
      id: crypto.randomUUID(),
      item: '',
      cost: 0,
      vendor: '',
      type: 'GOODS',
    };
    updateField([...budgetBreakdown, newItem]);
  };

  const removeItem = (id: string) => {
    if (isLocked) return;
    updateField(budgetBreakdown.filter(item => item.id !== id));
  };

  useEffect(() => {
    if (!onChange) {
      const total = budgetBreakdown.reduce((sum, item) => sum + item.cost, 0);
      store.updateField('targetAmount', total);
    }
  }, [budgetBreakdown, onChange]);

  const totalCost = budgetBreakdown.reduce((sum, item) => sum + item.cost, 0);

  const fieldContainerClass = cn(
    "py-2.5 border-b border-border/40 last:border-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-start animate-in fade-in duration-200",
    isLocked && "border-border/60"
  );

  const inputStyle = cn(
    "h-9 text-xs rounded-3xl transition-all duration-200 w-full",
    isLocked
      ? "bg-transparent border-transparent shadow-none font-bold text-foreground cursor-default focus-visible:ring-0 px-1"
      : "bg-muted/20 border-border/50 focus:bg-background focus:border-primary/50"
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {budgetBreakdown.map((item) => (
          <div key={item.id} className={fieldContainerClass}>
            {/* ITEM DESCRIPTION */}
            <div className="md:col-span-4 space-y-1">
              <label className="text-xs font-bold text-muted-foreground  tracking-tight ml-1">Item</label>
              <Input
                placeholder="Description..."
                value={item.item}
                onChange={(e) => handleUpdate(item.id, 'item', e.target.value)}
                readOnly={isLocked}
                className={inputStyle}
              />
            </div>

            {/* UNIT COST */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-muted-foreground  tracking-tight ml-1">Cost</label>
              <div className="relative">
                {!isLocked && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">₦</span>}
                <Input
                  placeholder="0"
                  className={cn(inputStyle, !isLocked && "pl-6", "tabular-nums")}
                  value={item.cost === 0 && !isLocked ? '' : (isLocked ? `₦${formatNumberInput(String(item.cost))}` : formatNumberInput(String(item.cost)))}
                  onChange={(e) => handleUpdate(item.id, 'cost', e.target.value)}
                  readOnly={isLocked}
                />
              </div>
            </div>

            {/* VENDOR */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-bold text-muted-foreground  tracking-tight ml-1">Vendor</label>
              <Input
                placeholder="Payee..."
                value={item.vendor}
                onChange={(e) => handleUpdate(item.id, 'vendor', e.target.value)}
                readOnly={isLocked}
                className={inputStyle}
              />
            </div>

            {/* CATEGORY & DELETE */}
            <div className="md:col-span-3 flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-muted-foreground  tracking-tight ml-1">Category</label>
                <Select value={item.type} onValueChange={(v) => handleUpdate(item.id, 'type', v)} disabled={isLocked}>
                  <SelectTrigger className={cn(inputStyle, "text-xs  font-bold", isLocked && "text-primary")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl shadow-xl">
                    <SelectItem value="GOODS" className="rounded-3xl text-xs">Goods</SelectItem>
                    <SelectItem value="SERVICE" className="rounded-3xl text-xs">Service</SelectItem>
                    <SelectItem value="LOGISTICS" className="rounded-3xl text-xs">Logistics</SelectItem>
                    <SelectItem value="OTHER" className="rounded-3xl text-xs">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!isLocked && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                  className="text-destructive hover:bg-destructive/10 rounded-3xl h-9 w-9 shrink-0 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isLocked && (
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full border-dashed rounded-3xl h-10 text-xs font-bold gap-2 text-muted-foreground hover:text-primary transition-all"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Add Budget Item
        </Button>
      )}

      <div className={cn(
        "flex justify-between items-center px-5 py-3 rounded-3xl border transition-all",
        isLocked ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-border/40"
      )}>
        <span className="text-xs font-bold  tracking-widest text-primary">Budget Total</span>
        <span className="text-xl font-bold text-foreground tabular-nums">₦ {formatNumberInput(String(totalCost))}</span>
      </div>
    </div>
  );
}