'use client';

import { useEffect, memo } from 'react';
import { Trash2, PlusCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import { useProposalStore, BudgetItem } from '../../../stores/proposal-store';
import { cn } from '../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_COST_TYPES, DEFAULT_COST_TYPES } from '../../../lib/utils/category-constants';

interface BudgetEditorProps {
  budgetItems?: BudgetItem[];
  onBudgetChange?: (items: BudgetItem[]) => void;
  readOnly?: boolean;
  isLive?: boolean;
  isAdjustmentMode?: boolean;
  categorySlug?: string;
}

export const BudgetEditor = memo(function BudgetEditor({
  budgetItems,
  onBudgetChange,
  readOnly = false,
  isLive = false,
  isAdjustmentMode = false,
  categorySlug
}: BudgetEditorProps) {

  const storeBudget = useProposalStore(state => state.budgetBreakdown);
  const targetAmount = useProposalStore(state => state.targetAmount);
  const updateField = useProposalStore(state => state.updateField);

  const budgetBreakdown = budgetItems || storeBudget;
  const updateBudget = onBudgetChange ? (val: BudgetItem[]) => onBudgetChange(val) : (val: BudgetItem[]) => updateField('budgetBreakdown', val);

  const isLocked = readOnly || (isLive && !isAdjustmentMode);

  const activeCostTypes = categorySlug && CATEGORY_COST_TYPES[categorySlug]
    ? CATEGORY_COST_TYPES[categorySlug]
    : DEFAULT_COST_TYPES;

  const handleUpdate = (id: string, field: keyof BudgetItem, value: string | number) => {
    if (isLocked) return;

    let processedValue: string | number = value;

    if (field === 'amount') {
      const raw = parseFormattedNumber(String(value));
      processedValue = raw === '' ? 0 : Number(raw);
      if (isNaN(processedValue)) processedValue = 0;
    }

    const updatedBudget = budgetBreakdown.map(item =>
      item.id === id ? { ...item, [field]: processedValue } : item
    );
    updateBudget(updatedBudget);
  };

  const addItem = () => {
    if (isLocked) return;
    const newItem: BudgetItem = {
      id: crypto.randomUUID(),
      payTo: '',
      costType: activeCostTypes[0].value,
      amount: 0,
      description: '',
    };
    updateBudget([...budgetBreakdown, newItem]);
  };

  const removeItem = (id: string) => {
    if (isLocked) return;
    updateBudget(budgetBreakdown.filter(item => item.id !== id));
  };

  useEffect(() => {
    if (!onBudgetChange) {
      const total = budgetBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
      if (total !== targetAmount) {
        updateField('targetAmount', total);
      }
    }
  }, [budgetBreakdown, onBudgetChange, targetAmount, updateField]);

  const totalCost = budgetBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);

  const fieldContainerClass = cn(
    "py-3 border-b border-border/40 last:border-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-start",
    isLocked && "border-border/60"
  );

  const inputStyle = cn(
    "h-10 text-sm rounded-3xl transition-all duration-200 w-full",
    isLocked
      ? "bg-transparent border-transparent shadow-none font-bold text-foreground cursor-default focus-visible:ring-0 px-1"
      : "bg-muted/20 border-border/50 focus:bg-background focus:border-primary/50"
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <AnimatePresence initial={false} mode="popLayout">
          {budgetBreakdown.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.2 }}
              className={fieldContainerClass}
            >
              {/* PAY TO */}
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-muted-foreground ml-1">Who will receive the funds?</label>
                <Input
                  placeholder="e.g. Peace Hospital, ABC School..."
                  value={item.payTo}
                  onChange={(e) => handleUpdate(item.id, 'payTo', e.target.value)}
                  readOnly={isLocked}
                  className={inputStyle}
                />
              </div>

              {/* EXPENSE TYPE */}
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-muted-foreground ml-1">Expense type</label>
                {isLocked ? (
                  <Input value={item.costType} readOnly className={inputStyle} />
                ) : (
                  <Select value={item.costType} onValueChange={(v) => handleUpdate(item.id, 'costType', v)} disabled={isLocked}>
                    <SelectTrigger className={cn(inputStyle, "font-bold", isLocked && "text-primary")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl shadow-xl border-border/40">
                      {activeCostTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="rounded-2xl text-xs py-2.5">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* AMOUNT */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-muted-foreground ml-1">Amount</label>
                <div className="relative">
                  {!isLocked && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">₦</span>}
                  <Input
                    placeholder="0"
                    className={cn(inputStyle, !isLocked && "pl-7", "tabular-nums font-bold")}
                    value={item.amount === 0 && !isLocked ? '' : (isLocked ? `₦${formatNumberInput(String(item.amount))}` : formatNumberInput(String(item.amount)))}
                    onChange={(e) => handleUpdate(item.id, 'amount', e.target.value)}
                    readOnly={isLocked}
                  />
                </div>
              </div>

              {/* DESCRIPTION & DELETE CONTAINER */}
              <div className="md:col-span-4 flex gap-2 items-end">
                <div className="flex-1 space-y-1 min-w-0">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Description</label>
                  <Input
                    placeholder="Details..."
                    value={item.description}
                    onChange={(e) => handleUpdate(item.id, 'description', e.target.value)}
                    readOnly={isLocked}
                    className={inputStyle}
                  />
                </div>
                {!isLocked && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:bg-destructive/10 rounded-2xl h-10 w-10 shrink-0 transition-colors active:scale-90 mb-[1px]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isLocked && (
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full border-dashed border-2 rounded-3xl h-14 text-sm font-bold gap-2 text-muted-foreground hover:text-primary transition-all active:scale-[0.98] bg-muted/5 hover:bg-primary/5 hover:border-primary/30"
        >
          <PlusCircle className="h-4 w-4" /> Add expense entry
        </Button>
      )}

      <div className={cn(
        "flex justify-between items-center px-6 py-5 rounded-3xl border transition-all mt-4",
        isLocked ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-border/40 shadow-sm"
      )}>
        <span className="text-sm font-bold text-primary uppercase tracking-widest">Budget total</span>
        <span className="text-2xl font-black text-foreground tabular-nums tracking-tight">₦ {formatNumberInput(String(totalCost))}</span>
      </div>
    </div>
  );
});