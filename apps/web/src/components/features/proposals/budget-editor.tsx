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
}

export function BudgetEditor({ items, onChange, readOnly = false }: BudgetEditorProps) {
  const store = useProposalStore();

  const budgetBreakdown = items || store.budgetBreakdown;
  const updateField = onChange ? (val: any) => onChange(val) : (val: any) => store.updateField('budgetBreakdown', val);

  const handleUpdate = (id: string, field: keyof BudgetItem, value: any) => {
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
    updateField(budgetBreakdown.filter(item => item.id !== id));
  };

  useEffect(() => {
    if (!onChange) {
      const total = budgetBreakdown.reduce((sum, item) => sum + item.cost, 0);
      store.updateField('targetAmount', total);
    }
  }, [budgetBreakdown, onChange]); // eslint-disable-line

  const totalCost = budgetBreakdown.reduce((sum, item) => sum + item.cost, 0);

  // SOTA Class Mapping for high-visibility read state
  const fieldContainerClass = cn(
    "grid grid-cols-1 md:grid-cols-4 gap-3 py-4 border-b border-border/40 last:border-0 items-end animate-in fade-in slide-in-from-top-1 transition-all duration-300",
    readOnly && "py-2 border-transparent"
  );

  const inputStyle = cn(
    "h-10 text-sm rounded-xl transition-all duration-300",
    readOnly
      ? "bg-transparent border-transparent shadow-none font-bold text-foreground cursor-default focus-visible:ring-0 px-1"
      : "bg-background/50 border-border focus:bg-background"
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {budgetBreakdown.map((item) => (
          <div key={item.id} className={fieldContainerClass}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-1">Item Description</label>
              <Input
                placeholder="e.g. Drilling Rig"
                value={item.item}
                onChange={(e) => handleUpdate(item.id, 'item', e.target.value)}
                readOnly={readOnly}
                className={inputStyle}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-1">Unit Cost</label>
              <div className="relative">
                {!readOnly && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">₦</span>}
                <Input
                  placeholder="0"
                  className={cn(inputStyle, !readOnly && "pl-7 font-medium", "tabular-nums")}
                  value={item.cost === 0 && !readOnly ? '' : (readOnly ? `₦${formatNumberInput(String(item.cost))}` : formatNumberInput(String(item.cost)))}
                  onChange={(e) => handleUpdate(item.id, 'cost', e.target.value)}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-1">Vendor Name</label>
              <Input
                placeholder="e.g. Jumia"
                value={item.vendor}
                onChange={(e) => handleUpdate(item.id, 'vendor', e.target.value)}
                readOnly={readOnly}
                className={inputStyle}
              />
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-1">Category</label>
                <Select value={item.type} onValueChange={(v) => handleUpdate(item.id, 'type', v)} disabled={readOnly}>
                  <SelectTrigger className={cn(inputStyle, "text-xs", readOnly && "font-bold text-primary px-1 capitalize")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-2xl border-border/50">
                    <SelectItem value="GOODS">Goods</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                    <SelectItem value="LOGISTICS">Logistics</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                  className="text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10 shrink-0 mb-px transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <Button type="button" variant="outline" onClick={addItem} className="w-full border-dashed rounded-xl h-11 text-xs font-bold gap-2 text-muted-foreground hover:text-primary transition-all active:scale-95">
          <PlusCircle className="h-4 w-4" /> Add Budget Line Item
        </Button>
      )}

      <div className={cn(
        "flex justify-between items-center px-5 py-4 rounded-2xl border transition-all duration-500",
        readOnly ? "bg-primary/[0.03] border-primary/20" : "bg-muted/30 border-border/50 mt-6"
      )}>
        <span className="text-[12px] font-black uppercase tracking-widest text-primary">Estimated Project Total</span>
        <span className="text-2xl font-bold text-foreground tabular-nums">₦ {formatNumberInput(String(totalCost))}</span>
      </div>
    </div>
  );
}