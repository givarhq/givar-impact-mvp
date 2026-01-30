'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Clock, PlayCircle, Loader2, 
  Calendar, AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';

interface Milestone {
  id: string;
  phase: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  estimatedDate: string;
  deliverables: string;
  completedAt?: string;
  updatedAt?: string;
}

interface MilestoneManagerProps {
  projectId: string;
  timeline: Milestone[];
}

export function MilestoneManager({ projectId, timeline }: MilestoneManagerProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleStatusChange = async (milestoneId: string, newStatus: Milestone['status']) => {
    setProcessingId(milestoneId);
    try {
      await ApiService.admin.updateMilestone(projectId, milestoneId, newStatus);
      toast.success(`Milestone updated to ${newStatus.replace('_', ' ')}`);
      router.refresh();
    } catch (error) {
      toast.error('Failed to update milestone');
    } finally {
      setProcessingId(null);
    }
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
        <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-3" />
        <p className="text-muted-foreground font-medium">No execution map defined for this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold text-foreground">Execution Tracking</h3>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          {timeline.filter(m => m.status === 'COMPLETED').length} / {timeline.length} Phases Done
        </Badge>
      </div>

      <div className="relative space-y-4">
        {/* The connecting vertical line */}
        <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-border hidden md:block" />

        {timeline.map((milestone, index) => {
          const isProcessing = processingId === milestone.id;
          const status = milestone.status;

          return (
            <Card 
              key={milestone.id} 
              className={cn(
                "rounded-[24px] border-border/50 shadow-sm transition-all relative overflow-hidden",
                status === 'COMPLETED' ? "bg-emerald-500/[0.02]" : "bg-card"
              )}
            >
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  
                  {/* Status Icon Indicator */}
                  <div className={cn(
                    "h-14 w-14 rounded-2xl shrink-0 flex items-center justify-center border transition-all z-10 bg-background",
                    status === 'COMPLETED' ? "border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10" : 
                    status === 'IN_PROGRESS' ? "border-blue-500 text-blue-500 animate-pulse" : "border-border text-muted-foreground"
                  )}>
                    {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : 
                     status === 'COMPLETED' ? <CheckCircle2 className="h-7 w-7" /> : 
                     status === 'IN_PROGRESS' ? <PlayCircle className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                  </div>

                  {/* Content Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phase {index + 1}</span>
                        {status === 'COMPLETED' && milestone.completedAt && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                Finished {new Date(milestone.completedAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    <h4 className="text-lg font-bold text-foreground leading-tight">{milestone.phase}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{milestone.deliverables}</p>
                    
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            Est. {milestone.estimatedDate}
                        </div>
                    </div>
                  </div>

                  {/* Action Group */}
                  <div className="flex items-center gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-border/40">
                    {status !== 'COMPLETED' && (
                        <div className="flex gap-2 w-full">
                            {status === 'PENDING' && (
                                <Button 
                                    variant="outline" 
                                    className="flex-1 rounded-xl h-10 text-xs font-bold border-blue-500/20 text-blue-600 hover:bg-blue-500/5"
                                    onClick={() => handleStatusChange(milestone.id, 'IN_PROGRESS')}
                                    disabled={!!processingId}
                                >
                                    Start Phase
                                </Button>
                            )}
                            <Button 
                                className="flex-1 rounded-xl h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                onClick={() => handleStatusChange(milestone.id, 'COMPLETED')}
                                disabled={!!processingId}
                            >
                                Mark Complete
                            </Button>
                        </div>
                    )}
                    {status === 'COMPLETED' && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground"
                            onClick={() => handleStatusChange(milestone.id, 'IN_PROGRESS')}
                            disabled={!!processingId}
                        >
                            Re-open
                        </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}