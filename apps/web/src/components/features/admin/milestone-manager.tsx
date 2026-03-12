'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  Loader2,
  Calendar,
  RotateCcw,
  Check,
  Send
} from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '../../ui/dialog';
import { ImageUploader } from '../proposals/media-uploader';
import { Textarea } from '../../ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

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
  projectStatus?: string;
}

export const MilestoneManager = memo(function MilestoneManager({ projectId, timeline, projectStatus }: MilestoneManagerProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const [proofImage, setProofImage] = useState<{ key: string; url: string } | null>(null);

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [finalProofImage, setFinalProofImage] = useState<{ key: string; url: string } | null>(null);

  const isFullyCompleted = timeline.length > 0 && timeline.every(m => m.status === 'COMPLETED');

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
    const toastId = toast.loading("Updating project timeline...");
    try {
      await ApiService.admin.updateMilestone(projectId, milestoneId, status, imageUrl);
      toast.success('Project milestone successfully updated', { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error('We could not update this phase at the moment', { id: toastId });
    } finally {
      setProcessingId(null);
      setActiveMilestone(null);
      setProofImage(null);
    }
  };

  const handleFinalizeProject = async () => {
    if (!completionNote.trim()) {
      toast.error("Please provide a final completion note");
      return;
    }
    setIsFinalizing(true);
    const toastId = toast.loading("Finalizing project and notifying donors...");
    try {
      await ApiService.admin.finalizeProject(projectId, {
        completionNote: completionNote.trim(),
        imageUrl: finalProofImage?.key
      });
      toast.success("Project officially marked as completed", { id: toastId });
      setShowFinalizeModal(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to finalize project", { id: toastId });
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-foreground">Execution Tracking</h3>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-3xl font-bold text-[11px] px-3 py-1 shadow-none">
          {timeline.filter(m => m.status === 'COMPLETED').length} / {timeline.length} Phases Completed
        </Badge>
      </div>

      <div className="relative space-y-4">
        <div className="absolute top-8 bottom-8 left-[27px] md:left-[52px] w-0.5 bg-border/40 hidden sm:block" />

        <AnimatePresence mode="popLayout">
          {timeline.map((milestone, index) => {
            const isProcessing = processingId === milestone.id;
            const status = milestone.status;

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    "rounded-3xl border-border/40 shadow-sm transition-all duration-300 relative overflow-hidden group",
                    status === 'COMPLETED' ? "bg-emerald-500/[0.02] border-emerald-500/20" : "bg-card"
                  )}
                >
                  <CardContent className="p-5 md:p-7">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8 relative z-10">

                      <div className={cn(
                        "h-14 w-14 rounded-2xl shrink-0 flex items-center justify-center border transition-all duration-500 z-10 bg-background shadow-inner",
                        status === 'COMPLETED' ? "border-emerald-500 text-emerald-500 scale-105" :
                          status === 'IN_PROGRESS' ? "border-primary text-primary animate-pulse" : "border-border/60 text-muted-foreground"
                      )}>
                        {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> :
                          status === 'COMPLETED' ? <Check className="h-7 w-7 stroke-[3px]" /> :
                            status === 'IN_PROGRESS' ? <PlayCircle className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black text-muted-foreground">Phase {index + 1}</span>
                          <AnimatePresence>
                            {status === 'COMPLETED' && milestone.completedAt && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/10"
                              >
                                Completed On {new Date(milestone.completedAt).toLocaleDateString()}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                        <h4 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{milestone.phase}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 font-medium">{milestone.deliverables}</p>

                        <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-border/40">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                            <Calendar className="h-4 w-4 opacity-50" />
                            Target Date: <span className="text-foreground">{milestone.estimatedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-border/40">
                        {status !== 'COMPLETED' && (
                          <div className="flex gap-2.5 w-full md:w-auto">
                            {status === 'PENDING' && (
                              <Button
                                variant="outline"
                                className="flex-1 md:flex-none rounded-3xl h-11 text-[11px] font-bold border-primary/20 text-primary hover:bg-primary/5 px-5 active:scale-95 transition-all"
                                onClick={() => handleStatusChange(milestone.id, 'IN_PROGRESS')}
                                disabled={!!processingId}
                              >
                                Start This Phase
                              </Button>
                            )}
                            <Button
                              className="flex-1 md:flex-none rounded-3xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-11 px-7 text-[11px] border-0 active:scale-95 transition-all"
                              onClick={() => handleStatusChange(milestone.id, 'COMPLETED')}
                              disabled={!!processingId}
                            >
                              Mark as Completed
                            </Button>
                          </div>
                        )}
                        {status === 'COMPLETED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[11px] font-bold text-muted-foreground hover:text-primary h-10 rounded-3xl gap-2 transition-all active:scale-95"
                            onClick={() => handleStatusChange(milestone.id, 'IN_PROGRESS')}
                            disabled={!!processingId}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Re-Open Phase
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Impact Finalization Section */}
        {isFullyCompleted && projectStatus !== 'COMPLETED' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm"
          >
            <div>
              <h4 className="text-base font-bold text-emerald-900">All phases completed</h4>
              <p className="text-xs font-medium text-emerald-800 mt-1">Ready to officially close this project and notify donors of the final impact.</p>
            </div>
            <Button
              onClick={() => setShowFinalizeModal(true)}
              className="w-full md:w-auto h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl px-8 font-bold shadow-md border-0 active:scale-95 transition-all"
            >
              Finalize Project
            </Button>
          </motion.div>
        )}

        <Dialog open={!!activeMilestone} onOpenChange={(open) => !open && setActiveMilestone(null)}>
          <DialogContent className="rounded-3xl border-none shadow-2xl p-8 bg-card max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary" /> Confirm Phase Completion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Please share a photo of your progress to show the successful execution. This visual proof will be shared with donors to maintain transparency.
              </p>

              <AnimatePresence mode="wait">
                {proofImage ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-video rounded-[24px] overflow-hidden border border-border/40 bg-muted shadow-inner group"
                  >
                    <Image
                      src={proofImage.url}
                      alt="Phase Proof"
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="sm" className="rounded-full h-9 px-4" onClick={() => setProofImage(null)}>
                        Change Image
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ImageUploader
                      label="Upload Proof Of Progress (Optional)"
                      onUploadComplete={(data) => setProofImage({ key: data.key, url: data.previewUrl })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  className="w-full h-12 rounded-3xl font-bold text-sm shadow-xl shadow-primary/20 bg-primary text-white border-0 transition-all active:scale-[0.98]"
                  onClick={() => updateMilestone(activeMilestone!.id, 'COMPLETED', proofImage?.key || undefined)}
                  disabled={processingId === activeMilestone?.id}
                >
                  {processingId === activeMilestone?.id ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm and Finalize Phase'}
                </Button>
                <Button
                  variant="ghost"
                  className="h-10 rounded-3xl font-bold text-xs text-muted-foreground"
                  onClick={() => setActiveMilestone(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Finalize Project Dialog */}
        <Dialog open={showFinalizeModal} onOpenChange={setShowFinalizeModal}>
          <DialogContent className="rounded-3xl border-none shadow-2xl p-8 bg-card max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" /> Confirm Impact Achieved
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                This will officially close the project and email all donors a final summary of the impact they made possible.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground ml-1">Final Impact Note</label>
                <Textarea
                  placeholder="Summarize the final results and express gratitude to the donors..."
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  className="min-h-[100px] rounded-2xl bg-muted/20 border-border/60 focus:bg-background resize-none"
                  disabled={isFinalizing}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground ml-1">Final Evidence Photo</label>
                <AnimatePresence mode="wait">
                  {finalProofImage ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-video rounded-[24px] overflow-hidden border border-border/40 bg-muted shadow-inner group"
                    >
                      <Image
                        src={finalProofImage.url}
                        alt="Final Proof"
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="sm" className="rounded-full h-9 px-4" onClick={() => setFinalProofImage(null)}>
                          Change Image
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-32">
                      <ImageUploader
                        label="Upload final result photo"
                        onUploadComplete={(data) => setFinalProofImage({ key: data.key, url: data.previewUrl })}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  className="w-full h-12 rounded-3xl font-bold text-sm shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white border-0 transition-all active:scale-[0.98]"
                  onClick={handleFinalizeProject}
                  disabled={isFinalizing || !completionNote.trim()}
                >
                  {isFinalizing ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Mark as Completed</>}
                </Button>
                <Button
                  variant="ghost"
                  className="h-10 rounded-3xl font-bold text-xs text-muted-foreground"
                  onClick={() => setShowFinalizeModal(false)}
                  disabled={isFinalizing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
});