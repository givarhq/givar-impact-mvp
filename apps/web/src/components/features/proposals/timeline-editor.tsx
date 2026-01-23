'use client';

import { useProposalStore, TimelineItem } from '../../../stores/proposal-store';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Trash2, PlusCircle } from 'lucide-react';

export function TimelineEditor() {
  const { executionTimeline, updateField } = useProposalStore();

  const handleUpdate = (id: string, field: keyof TimelineItem, value: any) => {
    const updatedTimeline = executionTimeline.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateField('executionTimeline', updatedTimeline);
  };

  const addItem = () => {
    const newItem: TimelineItem = {
      id: crypto.randomUUID(),
      phase: '',
      estimatedDate: '',
      deliverables: '',
    };
    updateField('executionTimeline', [...executionTimeline, newItem]);
  };
  
  const removeItem = (id: string) => {
    updateField('executionTimeline', executionTimeline.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
        {executionTimeline.map(item => (
            <div key={item.id} className="p-4 border rounded-xl bg-muted/30 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                    label="Phase" 
                    placeholder="e.g., Site Preparation"
                    value={item.phase}
                    onChange={(e) => handleUpdate(item.id, 'phase', e.target.value)}
                />
                <Input 
                    label="Estimated Date" 
                    type="date"
                    value={item.estimatedDate}
                    onChange={(e) => handleUpdate(item.id, 'estimatedDate', e.target.value)}
                />
                <div className="flex gap-2 items-end">
                    <Input 
                        label="Deliverables" 
                        placeholder="e.g., Land cleared"
                        className="flex-1"
                        value={item.deliverables}
                        onChange={(e) => handleUpdate(item.id, 'deliverables', e.target.value)}
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)} className="text-destructive mb-2.5">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        ))}
         <Button variant="outline" onClick={addItem} className="w-full border-dashed">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Phase
        </Button>
    </div>
  );
}