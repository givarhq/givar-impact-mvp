'use client';

import { useProposalStore, BudgetItem } from '../../../stores/proposal-store';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';

export function BudgetEditor() {
  const { budgetBreakdown, updateField } = useProposalStore();

  const handleUpdate = (id: string, field: keyof BudgetItem, value: any) => {
    const updatedBudget = budgetBreakdown.map(item =>
      item.id === id ? { ...item, [field]: value } : item
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

  const totalCost = budgetBreakdown.reduce((sum, item) => sum + item.cost, 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {budgetBreakdown.map((item) => (
          <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-xl bg-muted/30">
            <Input 
              placeholder="Item/Service (e.g., Water Tank)"
              value={item.item}
              onChange={(e) => handleUpdate(item.id, 'item', e.target.value)}
            />
            <Input 
              placeholder="Cost (e.g., 150,000)"
              value={formatNumberInput(String(item.cost))}
              onChange={(e) => handleUpdate(item.id, 'cost', Number(parseFormattedNumber(e.target.value)))}
            />
            <Input 
              placeholder="Vendor (e.g., Jumia)"
              value={item.vendor}
              onChange={(e) => handleUpdate(item.id, 'vendor', e.target.value)}
            />
            <div className="flex gap-2">
              <Select value={item.type} onValueChange={(v) => handleUpdate(item.id, 'type', v)}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOODS">Goods</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                  <SelectItem value="LOGISTICS">Logistics</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addItem} className="w-full border-dashed">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
      </Button>

      <div className="flex justify-end items-center pt-4 border-t mt-4">
        <span className="text-sm font-medium text-muted-foreground">Total Budget:</span>
        <span className="text-lg font-bold ml-2">₦{formatNumberInput(String(totalCost))}</span>
      </div>
    </div>
  );
}