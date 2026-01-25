'use client';

import { useProposalStore, BudgetItem } from '../../../stores/proposal-store';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import { useEffect } from 'react';

export function BudgetEditor() {
  const { budgetBreakdown, updateField } = useProposalStore();

  const handleUpdate = (id: string, field: keyof BudgetItem, value: any) => {
    let processedValue = value;

    if (field === 'cost') {
      const raw = parseFormattedNumber(value);
      processedValue = raw === '' ? 0 : Number(raw);
      
      if (isNaN(processedValue)) processedValue = 0;
    }

    const updatedBudget = budgetBreakdown.map(item =>
      item.id === id ? { ...item, [field]: processedValue } : item
    );
    updateField('budgetBreakdown', updatedBudget);
  };

  const addItem = () => {
    const newItem: BudgetItem = {
      id: crypto.randomUUID(),
      item: '',
      cost: 0,
      vendor: '',
      type: 'GOODS',
    };
    updateField('budgetBreakdown', [...budgetBreakdown, newItem]);
  };
  
  const removeItem = (id: string) => {
    updateField('budgetBreakdown', budgetBreakdown.filter(item => item.id !== id));
  };

  useEffect(() => {
    const total = budgetBreakdown.reduce((sum, item) => sum + item.cost, 0);
    updateField('targetAmount', total);
  }, [budgetBreakdown, updateField]);

  const totalCost = budgetBreakdown.reduce((sum, item) => sum + item.cost, 0);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {budgetBreakdown.map((item) => (
          <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border/50 rounded-2xl bg-card/50 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-2">
            <Input 
              placeholder="Item/Service"
              value={item.item}
              onChange={(e) => handleUpdate(item.id, 'item', e.target.value)}
            />
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">₦</span>
              <Input 
                placeholder="Cost"
                className="pl-7" // Extra padding for the symbol
                value={item.cost === 0 ? '' : formatNumberInput(String(item.cost))}
                onChange={(e) => handleUpdate(item.id, 'cost', e.target.value)}
              />
            </div>

            <Input 
              placeholder="Vendor"
              value={item.vendor}
              onChange={(e) => handleUpdate(item.id, 'vendor', e.target.value)}
            />
            
            <div className="flex gap-2">
              <Select value={item.type} onValueChange={(v) => handleUpdate(item.id, 'type', v)}>
                <SelectTrigger className="flex-1 rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOODS">Goods</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                  <SelectItem value="LOGISTICS">Logistics</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => removeItem(item.id)} 
                className="text-destructive hover:bg-destructive/10 rounded-xl h-11 w-11 shrink-0"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addItem} className="w-full border-dashed rounded-2xl h-12 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
      </Button>

      <div className="flex justify-end items-center pt-6 border-t border-border/50 mt-6">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Estimated Budget:</span>
        <span className="text-2xl font-bold ml-4 text-primary">₦{formatNumberInput(String(totalCost))}</span>
      </div>
    </div>
  );
}