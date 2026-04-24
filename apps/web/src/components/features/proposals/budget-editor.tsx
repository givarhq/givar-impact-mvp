'use client';

import { BudgetItem, TimelineItem } from '../../../stores/proposal-store';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Trash2, PlusCircle, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import { useEffect, memo } from 'react';
import { useProposalStore } from '../../../stores/proposal-store';
import { cn } from '../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface BudgetEditorProps {
  budgetItems?: BudgetItem[];
  timelineItems?: TimelineItem[];
  onBudgetChange?: (items: BudgetItem[]) => void;
  onTimelineChange?: (items: TimelineItem[]) => void;
  readOnly?: boolean;
  isLive?: boolean;
  isAdjustmentMode?: boolean;
  categorySlug?: string;
}

export const BudgetEditor = memo(function BudgetEditor({
  budgetItems,
  timelineItems,
  onBudgetChange,
  onTimelineChange,
  readOnly = false,
  isLive = false,
  isAdjustmentMode = false
}: BudgetEditorProps) {

  // CRITICAL FIX: Extract granular, stable state to prevent infinite loops
  const storeBudget = useProposalStore(state => state.budgetBreakdown);
  const storeTimeline = useProposalStore(state => state.executionTimeline);
  const targetAmount = useProposalStore(state => state.targetAmount);
  const updateField = useProposalStore(state => state.updateField);

  const budgetBreakdown = budgetItems || storeBudget;
  const executionTimeline = timelineItems || storeTimeline;

  const updateBudget = onBudgetChange ? onBudgetChange : (val: any) => updateField('budgetBreakdown', val);
  const updateTimeline = onTimelineChange ? onTimelineChange : (val: any) => updateField('executionTimeline', val);

  const isLocked = readOnly || (isLive && !isAdjustmentMode);

  const maxLength = Math.max(budgetBreakdown.length, executionTimeline.length);
  const phases = Array.from({ length: maxLength }).map((_, i) => {
    const b = budgetBreakdown[i] || { id: crypto.randomUUID(), payTo: '', costType: 'SERVICE', amount: 0, description: '' };
    const t = executionTimeline[i] || { id: b.id, phase: '', estimatedDate: '', deliverables: '' };
    return { budget: b, timeline: t, index: i };
  });

  const handleUpdate = (index: number, field: string, value: any) => {
    if (isLocked) return;

    const newBudget = [...budgetBreakdown];
    const newTimeline = [...executionTimeline];

    if (!newBudget[index]) newBudget[index] = { id: crypto.randomUUID(), payTo: '', costType: 'SERVICE', amount: 0, description: '' };
    if (!newTimeline[index]) newTimeline[index] = { id: newBudget[index].id, phase: '', estimatedDate: '', deliverables: '' };

    if (field === 'title') {
      newBudget[index].description = value;
      newTimeline[index].phase = value;
    } else if (field === 'amount') {
      const raw = parseFormattedNumber(String(value));
      let num = raw === '' ? 0 : Number(raw);
      if (isNaN(num)) num = 0;
      newBudget[index].amount = num;
    } else if (field === 'vendor') {
      newBudget[index].payTo = value;
    } else if (field === 'deliverables') {
      newTimeline[index].deliverables = value;
    } else if (field === 'estimatedDate') {
      newTimeline[index].estimatedDate = value;
    }

    updateBudget(newBudget);
    updateTimeline(newTimeline);
  };

  const addItem = () => {
    if (isLocked) return;
    const newId = crypto.randomUUID();
    updateBudget([...budgetBreakdown, { id: newId, payTo: '', costType: 'SERVICE', amount: 0, description: '' }]);
    updateTimeline([...executionTimeline, { id: newId, phase: '', estimatedDate: '', deliverables: '' }]);
  };

  const removeItem = (index: number) => {
    if (isLocked) return;
    const newBudget = [...budgetBreakdown];
    const newTimeline = [...executionTimeline];
    newBudget.splice(index, 1);
    newTimeline.splice(index, 1);
    updateBudget(newBudget);
    updateTimeline(newTimeline);
  };

  useEffect(() => {
    if (!onBudgetChange) {
      const total = budgetBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
      // CRITICAL FIX: Only dispatch update if the total actually mathematically changed
      if (total !== targetAmount) {
        updateField('targetAmount', total);
      }
    }
  }, [budgetBreakdown, onBudgetChange, targetAmount, updateField]);

  const totalCost = budgetBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);

  const inputStyle = cn(
    "h-10 text-sm rounded-2xl transition-all duration-200 w-full",
    isLocked
      ? "bg-transparent border-transparent shadow-none font-bold text-foreground cursor-default focus-visible:ring-0 px-1"
      : "bg-muted/20 border-border/50 focus:bg-background focus:border-primary/50"
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <AnimatePresence initial={false} mode="popLayout">
          {phases.map(({ budget, timeline, index }) => (
            <motion.div
              key={budget.id}
              layout
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.2 }}
              className={cn(
                "p-5 md:p-6 rounded-3xl border transition-all relative group",
                isLocked ? "bg-muted/5 border-border/40" : "bg-card border-border/60 hover:border-primary/30 shadow-sm"
              )}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-black border",
                    isLocked ? "bg-primary text-white border-primary" : "bg-primary/10 text-primary border-primary/20"
                  )}>
                    {isLocked ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Phase {index + 1}</h4>
                </div>
                {!isLocked && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                    className="text-destructive hover:bg-destructive/10 rounded-2xl h-8 w-8 shrink-0 transition-colors active:scale-90 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Phase Title */}
                <div className="md:col-span-8 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Phase objective</label>
                  <Input
                    placeholder="e.g. Foundation construction"
                    value={budget.description}
                    onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                    readOnly={isLocked}
                    className={inputStyle}
                  />
                </div>

                {/* Phase Cost */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Capital required (NGN)</label>
                  <div className="relative">
                    {!isLocked && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₦</span>}
                    <Input
                      placeholder="0"
                      className={cn(inputStyle, !isLocked && "pl-8", "tabular-nums font-bold")}
                      value={budget.amount === 0 && !isLocked ? '' : (isLocked ? `₦${formatNumberInput(String(budget.amount))}` : formatNumberInput(String(budget.amount)))}
                      onChange={(e) => handleUpdate(index, 'amount', e.target.value)}
                      readOnly={isLocked}
                    />
                  </div>
                </div>

                {/* Vendor Allocation */}
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Assigned vendor or payee</label>
                  <Input
                    placeholder="e.g. ABC Engineering Ltd"
                    value={budget.payTo}
                    onChange={(e) => handleUpdate(index, 'vendor', e.target.value)}
                    readOnly={isLocked}
                    className={inputStyle}
                  />
                </div>

                {/* Estimated Date */}
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Estimated completion date (Optional)</label>
                  <div className="relative">
                    {!isLocked && <CalendarIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />}
                    <Input
                      type={isLocked ? "text" : "date"}
                      value={timeline.estimatedDate}
                      onChange={(e) => handleUpdate(index, 'estimatedDate', e.target.value)}
                      readOnly={isLocked}
                      className={cn(inputStyle, isLocked && "text-primary font-bold")}
                    />
                  </div>
                </div>

                {/* Deliverables */}
                <div className="md:col-span-12 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Expected deliverables (Proof of work)</label>
                  <Textarea
                    placeholder="What specific visual proof will the vendor provide upon completion?"
                    value={timeline.deliverables}
                    onChange={(e) => handleUpdate(index, 'deliverables', e.target.value)}
                    readOnly={isLocked}
                    className={cn(
                      "min-h-[80px] text-sm rounded-2xl transition-all duration-200 resize-none",
                      isLocked
                        ? "bg-transparent border-transparent shadow-none font-medium italic text-muted-foreground p-1"
                        : "bg-muted/20 border-border/50 focus:bg-background focus:border-primary/50 p-3.5"
                    )}
                  />
                </div>
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
          className="w-full border-dashed border-2 rounded-3xl h-14 text-sm font-bold gap-2 text-muted-foreground hover:text-primary transition-all active:scale-[0.98] bg-muted/10 hover:bg-primary/5 hover:border-primary/30"
        >
          <PlusCircle className="h-4 w-4" /> Add execution phase
        </Button>
      )}

      <div className={cn(
        "flex justify-between items-center px-6 py-4 rounded-3xl border transition-all mt-8 shadow-sm",
        isLocked ? "bg-primary/5 border-primary/20" : "bg-card border-border/40"
      )}>
        <span className="text-sm font-bold text-primary uppercase">Total Capital Goal</span>
        <span className="text-2xl font-black text-foreground tabular-nums tracking-tight">₦ {formatNumberInput(String(totalCost))}</span>
      </div>
    </div>
  );
});