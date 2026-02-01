'use client';

import { TimelineItem } from '../../../stores/proposal-store';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Trash2, PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { useProposalStore } from '../../../stores/proposal-store';
import { cn } from '../../../lib/utils/cn';

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

  // SOTA Class Mapping for high-visibility read state
  const fieldContainerClass = cn(
    "py-5 border-b border-border/40 last:border-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-in fade-in slide-in-from-top-1 transition-all duration-300",
    readOnly && "py-3 border-transparent"
  );

  const inputStyle = cn(
    "h-10 text-sm rounded-xl transition-all duration-300",
    readOnly
      ? "bg-transparent border-transparent shadow-none font-bold text-foreground cursor-default focus-visible:ring-0 px-1"
      : "bg-background/50 border-border focus:bg-background"
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {executionTimeline.map(item => (
          <div key={item.id} className={fieldContainerClass}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-1">Phase Title</label>
              <Input
                placeholder="e.g. Site Preparation"
                value={item.phase}
                onChange={(e) => handleUpdate(item.id, 'phase', e.target.value)}
                readOnly={readOnly}
                className={cn(inputStyle, readOnly && "text-base")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-1">Estimated Date</label>
              <div className="relative">
                {!readOnly && <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />}
                <Input
                  type={readOnly ? "text" : "date"}
                  value={item.estimatedDate}
                  onChange={(e) => handleUpdate(item.id, 'estimatedDate', e.target.value)}
                  readOnly={readOnly}
                  className={cn(inputStyle, "tabular-nums", readOnly && "text-primary font-black")}
                />
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-1">Deliverables</label>
                <Input
                  placeholder="Key outcomes..."
                  className={cn(inputStyle, readOnly && "font-medium italic text-muted-foreground")}
                  value={item.deliverables}
                  onChange={(e) => handleUpdate(item.id, 'deliverables', e.target.value)}
                  readOnly={readOnly}
                />
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                  className="text-destructive h-10 w-10 rounded-xl hover:bg-destructive/10 mb-px transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full border-dashed rounded-xl h-11 text-xs font-bold gap-2 text-muted-foreground hover:text-primary transition-all active:scale-95"
        >
          <PlusCircle className="h-4 w-4" /> Add Execution Phase
        </Button>
      )}
    </div>
  );
}