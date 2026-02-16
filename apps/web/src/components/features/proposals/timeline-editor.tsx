'use client';

import { useState, useRef, useEffect } from 'react';
import { TimelineItem } from '../../../stores/proposal-store';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Trash2, PlusCircle, Calendar as CalendarIcon, PenTool, X } from 'lucide-react';
import { useProposalStore } from '../../../stores/proposal-store';
import { cn } from '../../../lib/utils/cn';
import { Textarea } from '../../ui/textarea';

interface TimelineEditorProps {
  items?: TimelineItem[];
  onChange?: (items: TimelineItem[]) => void;
  readOnly?: boolean;
  isLive?: boolean;
  isAdjustmentMode?: boolean;
}

const PREDEFINED_PHASES = [
  "Planning & preparation",
  "Procurement of materials",
  "Vendor engagement",
  "Training / capacity building",
  "Construction / setup",
  "Distribution / delivery",
  "Implementation",
  "Monitoring & evaluation",
  "Reporting & close-out"
];

export function TimelineEditor({
  items,
  onChange,
  readOnly = false,
  isLive = false,
  isAdjustmentMode = false
}: TimelineEditorProps) {
  const store = useProposalStore();
  const executionTimeline = items || store.executionTimeline;
  const updateField = onChange ? (val: any) => onChange(val) : (val: any) => store.updateField('executionTimeline', val);

  const [editingId, setEditingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLocked = readOnly || (isLive && !isAdjustmentMode);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setEditingId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdate = (id: string, field: keyof TimelineItem, value: any) => {
    if (isLocked) return;
    const updatedTimeline = executionTimeline.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateField(updatedTimeline);
  };

  const addItem = () => {
    if (isLocked) return;
    const newItem: TimelineItem = {
      id: crypto.randomUUID(),
      phase: '',
      estimatedDate: '',
      deliverables: '',
    };
    updateField([...executionTimeline, newItem]);
  };

  const removeItem = (id: string) => {
    if (isLocked) return;
    updateField(executionTimeline.filter(item => item.id !== id));
  };

  const getPhaseSelectValue = (currentPhase: string) => {
    if (!currentPhase) return undefined;
    if (PREDEFINED_PHASES.includes(currentPhase)) return currentPhase;
    return 'CUSTOM_PHASE';
  };

  const fieldContainerClass = cn(
    "py-2.5 border-b border-border/40 last:border-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-start animate-in fade-in duration-200 relative",
    isLocked && "border-border/60"
  );

  const inputStyle = cn(
    "h-9 text-xs rounded-3xl transition-all duration-200 w-full",
    isLocked
      ? "bg-transparent border-transparent shadow-none font-bold text-foreground cursor-default focus-visible:ring-0 px-1"
      : "bg-muted/20 border-border/50 focus:bg-background focus:border-primary/50"
  );

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="space-y-1">
        {executionTimeline.map(item => {
          const selectValue = getPhaseSelectValue(item.phase);
          const isCustom = selectValue === 'CUSTOM_PHASE';
          const isEditing = editingId === item.id;

          return (
            <div key={item.id} className={fieldContainerClass}>
              {/* PHASE TITLE */}
              <div className="md:col-span-4 space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight ml-1">Phase</label>
                {isLocked ? (
                  <Input value={item.phase} readOnly className={inputStyle} />
                ) : (
                  <div className="space-y-2">
                    <Select value={selectValue} onValueChange={(val) => {
                      if (val === 'CUSTOM_PHASE') {
                        if (PREDEFINED_PHASES.includes(item.phase) || !item.phase) {
                          handleUpdate(item.id, 'phase', 'New Phase');
                        }
                      } else {
                        handleUpdate(item.id, 'phase', val);
                      }
                    }}>
                      <SelectTrigger className={cn(inputStyle, "bg-muted/20")}>
                        <SelectValue placeholder="Select phase..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-3xl max-h-64 shadow-xl">
                        {PREDEFINED_PHASES.map((p) => (
                          <SelectItem key={p} value={p} className="rounded-3xl text-xs">{p}</SelectItem>
                        ))}
                        <SelectItem value="CUSTOM_PHASE" className="rounded-3xl text-xs font-bold text-primary border-t border-border/40 mt-1">
                          + Custom Label
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {isCustom && (
                      <div className="relative animate-in slide-in-from-top-1">
                        <PenTool className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          placeholder="Name..."
                          value={item.phase}
                          onChange={(e) => handleUpdate(item.id, 'phase', e.target.value)}
                          className={cn(inputStyle, "pl-8 bg-primary/5 border-primary/20")}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ESTIMATED DATE */}
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight ml-1">Due Date</label>
                <div className="relative">
                  {!isLocked && <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />}
                  <Input
                    type={isLocked ? "text" : "date"}
                    value={item.estimatedDate}
                    onChange={(e) => handleUpdate(item.id, 'estimatedDate', e.target.value)}
                    readOnly={isLocked}
                    className={cn(inputStyle, "tabular-nums", isLocked && "text-primary font-bold")}
                  />
                </div>
              </div>

              {/* DELIVERABLES */}
              <div className="md:col-span-5 flex gap-2 items-end relative">
                <div className="flex-1 space-y-1 min-w-0">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight ml-1">Deliverables</label>
                  <div className="relative">
                    <Input
                      placeholder="Outcome details..."
                      className={cn(inputStyle, isLocked && "italic font-medium text-muted-foreground")}
                      value={item.deliverables}
                      readOnly={true}
                      onClick={() => !isLocked && setEditingId(item.id)}
                    />
                    {!isLocked && isEditing && (
                      <div className="absolute top-0 left-0 w-full z-20 animate-in zoom-in-95 duration-150 origin-top-left">
                        <div className="bg-card border border-border/60 rounded-3xl shadow-2xl p-1">
                          <Textarea
                            value={item.deliverables}
                            onChange={(e) => handleUpdate(item.id, 'deliverables', e.target.value)}
                            className="min-h-[100px] w-full border-none focus-visible:ring-0 text-xs p-3 bg-transparent rounded-3xl"
                          />
                          <div className="flex justify-end p-2 border-t border-border/40 bg-muted/10 rounded-b-[24px]">
                            <Button size="sm" className="h-7 text-xs font-bold rounded-3xl px-4" onClick={() => setEditingId(null)}>Done</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {!isLocked && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive h-9 w-9 rounded-3xl hover:bg-destructive/10 shrink-0 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isLocked && (
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full border-dashed rounded-3xl h-10 text-xs font-bold gap-2 text-muted-foreground hover:text-primary transition-all"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Add Phase
        </Button>
      )}
    </div>
  );
}