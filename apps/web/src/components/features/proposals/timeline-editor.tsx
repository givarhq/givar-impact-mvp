'use client';

import { TimelineItem } from '../../../stores/proposal-store';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Trash2, PlusCircle } from 'lucide-react';
import { useProposalStore } from '../../../stores/proposal-store';

interface TimelineEditorProps {
  items?: TimelineItem[];
  onChange?: (items: TimelineItem[]) => void;
  readOnly?: boolean;
}

export function TimelineEditor({ items, onChange, readOnly = false }: TimelineEditorProps) {
  const store = useProposalStore();
  const executionTimeline = items || store.executionTimeline;
  const updateField = onChange ? (val: any) => onChange(val) : (val: any) => store.updateField('executionTimeline', val);

  const handleUpdate = (id: string, field: keyof TimelineItem, value: any) => {
    const updatedTimeline = executionTimeline.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateField(updatedTimeline);
  };

  const addItem = () => {
    const newItem: TimelineItem = {
      id: crypto.randomUUID(),
      phase: '',
      estimatedDate: '',
      deliverables: '',
    };
    updateField([...executionTimeline, newItem]);
  };
  
  const removeItem = (id: string) => {
    updateField(executionTimeline.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
        <div className="space-y-2">
            {executionTimeline.map(item => (
                <div key={item.id} className="py-5 border-b border-border/40 last:border-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-in fade-in slide-in-from-top-1">
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-muted-foreground ml-1">Phase Title</label>
                        <Input 
                            placeholder="e.g. Site Preparation"
                            value={item.phase}
                            onChange={(e) => handleUpdate(item.id, 'phase', e.target.value)}
                            disabled={readOnly}
                            className="h-10 text-sm rounded-xl bg-background/50 border-transparent focus:bg-background"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-muted-foreground ml-1">Estimated Date</label>
                        <Input 
                            type="date"
                            value={item.estimatedDate}
                            onChange={(e) => handleUpdate(item.id, 'estimatedDate', e.target.value)}
                            disabled={readOnly}
                            className="h-10 text-sm rounded-xl bg-background/50 border-transparent focus:bg-background"
                        />
                    </div>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1.5">
                            <label className="text-[12px] font-bold text-muted-foreground ml-1">Deliverables</label>
                            <Input 
                                placeholder="Key outcomes..."
                                className="h-10 text-sm rounded-xl bg-background/50 border-transparent focus:bg-background"
                                value={item.deliverables}
                                onChange={(e) => handleUpdate(item.id, 'deliverables', e.target.value)}
                                disabled={readOnly}
                            />
                        </div>
                        {!readOnly && (
                            <Button 
                              type="button" 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => removeItem(item.id)} 
                              className="text-destructive h-10 w-10 rounded-xl hover:bg-destructive/10 mb-px"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
         {!readOnly && (
             <Button type="button" variant="outline" onClick={addItem} className="w-full border-dashed rounded-xl h-11 text-xs font-bold gap-2 text-muted-foreground hover:text-primary transition-all">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Execution Phase
            </Button>
         )}
    </div>
  );
}