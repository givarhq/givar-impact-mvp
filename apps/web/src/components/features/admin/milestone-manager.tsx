'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Clock, PlayCircle, Loader2,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogTitle } from '../../ui/dialog';
import { DialogHeader } from '../../ui/dialog';
import { ImageUploader } from '../proposals/media-uploader';

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
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);

  const handleStatusChange = async (milestoneId: string, newStatus: Milestone['status']) => {
    if (newStatus === 'COMPLETED') {
      const milestone = timeline.find(m => m.id === milestoneId);
      setActiveMilestone(milestone || null);
      return;
    }
    await updateMilestone(milestoneId, newStatus);
  };

  const updateMilestone = async (milestoneId: string, status: Milestone['status'], imageUrl?: string) => {
    setProcessingId(milestoneId);
    try {
      await ApiService.admin.updateMilestone(projectId, milestoneId, status, imageUrl);
      toast.success('Milestone updated!');
      router.refresh();
    } catch (error) { toast.error('Update failed'); }
    finally {
      setProcessingId(null);
      setActiveMilestone(null);
      setProofImageUrl(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-foreground">Execution Tracking</h3>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-3xl font-bold text-[11px] uppercase tracking-widest px-3">
          {timeline.filter(m => m.status === 'COMPLETED').length} / {timeline.length} Phases Done
        </Badge>
      </div>

      <div className="relative space-y-4">
        {/* The connecting vertical line - Positioned relative to the icon center */}
        <div className="absolute top-6 bottom-6 left-[52px] w-0.5 bg-border/60 hidden md:block" />

        {timeline.map((milestone, index) => {
          const isProcessing = processingId === milestone.id;
          const status = milestone.status;

          return (
            <Card
              key={milestone.id}
              className={cn(
                "rounded-3xl border-border/40 shadow-sm transition-all relative overflow-hidden",
                status === 'COMPLETED' ? "bg-emerald-500/[0.02]" : "bg-card"
              )}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 relative z-10">

                  {/* Status Icon Indicator */}
                  <div className={cn(
                    "h-14 w-14 rounded-3xl shrink-0 flex items-center justify-center border transition-all z-10 bg-background",
                    status === 'COMPLETED' ? "border-emerald-500 text-emerald-500 shadow-sm" :
                      status === 'IN_PROGRESS' ? "border-blue-500 text-blue-500 animate-pulse shadow-sm" : "border-border text-muted-foreground"
                  )}>
                    {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> :
                      status === 'COMPLETED' ? <CheckCircle2 className="h-7 w-7" /> :
                        status === 'IN_PROGRESS' ? <PlayCircle className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                  </div>

                  {/* Content Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Phase {index + 1}</span>
                      {status === 'COMPLETED' && milestone.completedAt && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-3xl">
                          Finished {new Date(milestone.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-foreground leading-tight">{milestone.phase}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{milestone.deliverables}</p>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                        <Calendar className="h-3.5 w-3.5 opacity-70" />
                        Est. {milestone.estimatedDate}
                      </div>
                    </div>
                  </div>

                  {/* Action Group */}
                  <div className="flex items-center gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-border/40">
                    {status !== 'COMPLETED' && (
                      <div className="flex gap-2 w-full md:w-auto">
                        {status === 'PENDING' && (
                          <Button
                            variant="outline"
                            className="flex-1 md:flex-none rounded-3xl h-10 text-[11px] font-bold border-blue-500/20 text-blue-600 hover:bg-blue-500/5 uppercase tracking-widest px-4"
                            onClick={() => handleStatusChange(milestone.id, 'IN_PROGRESS')}
                            disabled={!!processingId}
                          >
                            Start Phase
                          </Button>
                        )}
                        <Button
                          className="flex-1 md:flex-none rounded-3xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 px-6 text-[11px] uppercase tracking-widest"
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
                        className="text-[11px] font-bold uppercase text-muted-foreground hover:text-foreground h-9 rounded-3xl"
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

        <Dialog open={!!activeMilestone} onOpenChange={(open) => !open && setActiveMilestone(null)}>
          <DialogContent className="rounded-3xl border-none shadow-2xl p-6">
            <DialogHeader><DialogTitle className="text-lg font-bold">Verify Completion</DialogTitle></DialogHeader>
            <div className="space-y-6 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload a "Proof of Work" image (e.g., photo of the completed borehole) to include in the public update.
              </p>

              {proofImageUrl ? (
                <div className="aspect-video rounded-3xl overflow-hidden border border-border/40">
                  <img src={proofImageUrl} className="w-full h-full object-cover" />
                </div>
              ) : (
                <ImageUploader
                  label="Upload Proof (Optional)"
                  onUploadComplete={(data) => setProofImageUrl(data.previewUrl)}
                />
              )}

              <Button
                className="w-full h-12 rounded-3xl font-bold text-sm shadow-sm"
                onClick={() => updateMilestone(activeMilestone!.id, 'COMPLETED', proofImageUrl || undefined)}
                disabled={processingId === activeMilestone?.id}
              >
                Confirm Completion
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}