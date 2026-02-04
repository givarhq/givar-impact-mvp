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

export function TimelineEditor({ items, onChange, readOnly = false }: TimelineEditorProps) {
  const store = useProposalStore();
  const executionTimeline = items || store.executionTimeline;
  const updateField = onChange ? (val: any) => onChange(val) : (val: any) => store.updateField('executionTimeline', val);

  // State to track which item is currently being expanded for editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the expanded editor when clicking outside
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

  const getPhaseSelectValue = (currentPhase: string) => {
    if (!currentPhase) return undefined;
    if (PREDEFINED_PHASES.includes(currentPhase)) return currentPhase;
    return 'CUSTOM_PHASE';
  };

  const fieldContainerClass = cn(
    "py-6 border-b border-border/40 last:border-0 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start animate-in fade-in slide-in-from-top-1 transition-all duration-300 relative",
    readOnly && "py-3 border-transparent"
  );

  const inputStyle = cn(
    "h-11 text-sm rounded-xl transition-all duration-300 w-full",
    readOnly
      ? "bg-transparent border-transparent shadow-none font-bold text-foreground cursor-default focus-visible:ring-0 px-1"
      : "bg-background/50 border-border focus:bg-background"
  );

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="space-y-2">
        {executionTimeline.map(item => {
          const selectValue = getPhaseSelectValue(item.phase);
          const isCustom = selectValue === 'CUSTOM_PHASE';
          const isEditing = editingId === item.id;

          return (
            <div key={item.id} className={fieldContainerClass}>

              {/* LINE 1: PHASE TITLE */}
              <div className="xl:col-span-4 space-y-1.5 w-full">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-1">Phase Title</label>

                {readOnly ? (
                  <Input
                    value={item.phase}
                    readOnly
                    className={cn(inputStyle, "text-base")}
                  />
                ) : (
                  <div className="space-y-2">
                    <Select
                      value={selectValue}
                      onValueChange={(val) => {
                        if (val === 'CUSTOM_PHASE') {
                          if (PREDEFINED_PHASES.includes(item.phase) || !item.phase) {
                            handleUpdate(item.id, 'phase', 'Custom Phase');
                          }
                        } else {
                          handleUpdate(item.id, 'phase', val);
                        }
                      }}
                    >
                      <SelectTrigger className={cn(inputStyle, "bg-background")}>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-xl max-h-[300px]">
                        {PREDEFINED_PHASES.map((p) => (
                          <SelectItem key={p} value={p} className="text-sm cursor-pointer py-2.5">
                            {p}
                          </SelectItem>
                        ))}
                        <SelectItem value="CUSTOM_PHASE" className="text-sm font-semibold text-primary cursor-pointer py-2.5 border-t border-border mt-1">
                          + Custom Phase Name
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {isCustom && (
                      <div className="relative animate-in fade-in slide-in-from-top-1">
                        <PenTool className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Phase name"
                          value={item.phase}
                          onChange={(e) => handleUpdate(item.id, 'phase', e.target.value)}
                          className={cn(inputStyle, "pl-9 border-primary/30 focus:border-primary bg-primary/5")}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* LINE 2: ESTIMATED DATE */}
              <div className="xl:col-span-3 space-y-1.5 w-full">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-1">Estimated Date</label>
                <div className="relative">

                  <Input
                    type={readOnly ? "text" : "date"}
                    value={item.estimatedDate}
                    onChange={(e) => handleUpdate(item.id, 'estimatedDate', e.target.value)}
                    readOnly={readOnly}
                    className={cn(inputStyle, "tabular-nums", readOnly && "text-primary font-black")}
                  />
                </div>
              </div>

              {/* LINE 3: DELIVERABLES (Expandable) */}
              <div className="xl:col-span-5 flex gap-3 items-end h-full w-full relative">
                <div className="flex-1 space-y-1.5 w-full min-w-0">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-1">Deliverables</label>

                  {/* Base Input: Shows truncated preview */}
                  <div className="relative">
                    <Input
                      placeholder="Key outcomes..."
                      className={cn(inputStyle, readOnly && "font-medium italic text-muted-foreground", "cursor-text")}
                      value={item.deliverables}
                      readOnly={true} // Prevent direct edit, force expansion
                      onClick={() => !readOnly && setEditingId(item.id)}
                      onFocus={() => !readOnly && setEditingId(item.id)}
                    />

                    {/* Expanded Textarea Popover */}
                    {!readOnly && isEditing && (
                      <div className="absolute top-0 left-0 w-full z-20 animate-in zoom-in-95 duration-200 origin-top-left">
                        <div className="bg-card border border-primary/30 rounded-xl shadow-2xl p-1 relative">
                          <Textarea
                            value={item.deliverables}
                            onChange={(e) => handleUpdate(item.id, 'deliverables', e.target.value)}
                            className="min-h-[120px] w-full border-none focus-visible:ring-0 resize-none text-sm p-3 bg-transparent"
                            placeholder="Describe the tangible outputs for this phase (e.g. 50 kits delivered, foundation laid)..."
                            autoFocus
                          />
                          <div className="flex justify-end p-2 border-t border-border/50 bg-muted/20 rounded-b-lg">
                            <Button size="sm" className="h-7 text-xs px-4" onClick={(e) => { e.stopPropagation(); setEditingId(null); }}>
                              Done
                            </Button>
                          </div>
                        </div>
                        {/* Overlay to catch outside clicks if global listener fails */}
                        <div className="fixed inset-0 z-[-1]" onClick={(e) => { e.stopPropagation(); setEditingId(null); }} />
                      </div>
                    )}
                  </div>
                </div>

                {!readOnly && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive h-11 w-11 rounded-xl hover:bg-destructive/10 mb-px transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

            </div>
          );
        })}
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