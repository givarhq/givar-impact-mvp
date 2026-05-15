'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Clock, PlayCircle, Loader2, Calendar,
  RotateCcw, Check, Send, Unlock, Users,
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
import { SmartCurrency } from '../../ui/smart-currency';

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
  projectTitle: string;
  raisedAmount: string;
  targetAmount: string;
  currency: string;
  timeline: Milestone[];
  budgetBreakdown?: any[];
  projectStatus?: string;
  waitlistCount?: number;
}

export const MilestoneManager = memo(function MilestoneManager({
  projectId,
  projectTitle,
  raisedAmount,
  targetAmount,
  currency,
  timeline,
  budgetBreakdown = [],
  projectStatus,
  waitlistCount = 0,
}: MilestoneManagerProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Admin Verification States
  const [activeMilestone, setActiveMilestone] = useState<Milestone & { index: number } | null>(null);
  const [proofImage, setProofImage] = useState<{ key: string; url: string } | null>(null);

  // Finalization States
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [finalProofImage, setFinalProofImage] = useState<{ key: string; url: string } | null>(null);

  const isFullyCompleted = timeline.length > 0 && timeline.every(m => m.status === 'COMPLETED');
  const totalRaisedMinor = BigInt(raisedAmount || '0');

  // --- ADMIN DIRECT VERIFICATION ---
  const handleStatusChange = async (milestoneId: string, newStatus: Milestone['status'], index: number) => {
    if (newStatus === 'COMPLETED') {
      const milestone = timeline.find(m => m.id === milestoneId);
      setActiveMilestone(milestone ? { ...milestone, index } : null);
      return;
    }
    // Re-open phase
    setProcessingId(milestoneId);
    const toastId = toast.loading("Re-opening phase...");
    try {
      await ApiService.admin.updateMilestone(projectId, milestoneId, newStatus);
      toast.success('Phase re-opened', { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error('Failed to update phase', { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  const updateMilestone = async (milestoneId: string, status: Milestone['status'], imageUrl?: string) => {
    setProcessingId(milestoneId);
    const toastId = toast.loading("Verifying phase...");
    try {
      await ApiService.admin.updateMilestone(projectId, milestoneId, status, imageUrl);
      toast.success('Phase verified and locked', { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error('Failed to verify phase', { id: toastId });
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
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 px-1 min-w-0">
        <div className="space-y-1.5">
          <h3 className="text-base md:text-lg font-bold text-foreground tracking-tight">{projectTitle}</h3>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="font-bold text-foreground">
              <SmartCurrency amount={raisedAmount} currency={currency} visible={true} size="small" hideKobo />
            </span>
            <span>raised of</span>
            <span className="font-bold text-foreground">
              <SmartCurrency amount={targetAmount} currency={currency} visible={true} size="small" hideKobo />
            </span>
            <span>goal</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 min-w-0 shrink-0">
          {waitlistCount > 0 && !isFullyCompleted && (
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold text-[11px] gap-1.5 shadow-none animate-pulse px-3 py-1 shrink-0">
              <Users className="h-3 w-3" /> {waitlistCount} Waiting
            </Badge>
          )}
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-3xl font-bold text-[11px] px-3 py-1 shadow-none shrink-0">
            {timeline.filter(m => m.status === 'COMPLETED').length} / {timeline.length} Verified
          </Badge>
        </div>
      </div>

      <div className="relative space-y-4 min-w-0">
        <div className="absolute top-8 bottom-8 left-[27px] md:left-[52px] w-0.5 bg-border/40 hidden sm:block" />

        <AnimatePresence mode="popLayout">
          {timeline.map((milestone, index) => {
            const status = milestone.status;
            const isProcessingCurrent = processingId === milestone.id;

            // --- AGGREGATED PHASE FINANCIAL MATH ---
            let previousPhasesMajor = 0;
            let currentPhaseMajor = 0;

            const previousStages = timeline.slice(0, index).map((t: any) => t.phase);
            const currentStageName = milestone.phase;

            budgetBreakdown.forEach((item: any) => {
              const amt = item.amount || item.cost || 0;
              const itemStage = item.stage || 'Main Stage';

              if (previousStages.includes(itemStage)) {
                previousPhasesMajor += amt;
              } else if (itemStage === currentStageName) {
                currentPhaseMajor += amt;
              }
            });

            const previousPhasesMinor = BigInt(Math.round(previousPhasesMajor * 100));
            const currentPhaseTargetMinor = BigInt(Math.round(currentPhaseMajor * 100));

            let phaseRaisedMinor = totalRaisedMinor - previousPhasesMinor;
            if (phaseRaisedMinor < 0n) phaseRaisedMinor = 0n;
            if (phaseRaisedMinor > currentPhaseTargetMinor && currentPhaseTargetMinor > 0n) {
              phaseRaisedMinor = currentPhaseTargetMinor;
            }

            const phasePercent = currentPhaseTargetMinor > 0n
              ? Math.min(100, Math.floor(Number(phaseRaisedMinor * 100n / currentPhaseTargetMinor)))
              : (phaseRaisedMinor > 0n ? 100 : 0);

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="min-w-0"
              >
                <Card
                  className={cn(
                    "rounded-3xl border-border/40 shadow-sm transition-all duration-300 relative overflow-hidden group min-w-0",
                    status === 'COMPLETED' ? "bg-emerald-500/[0.02] border-emerald-500/20" : "bg-card"
                  )}
                >
                  <CardContent className="p-5 md:p-7 min-w-0">
                    <div className="flex flex-col md:flex-row items-start gap-5 md:gap-8 relative z-10 min-w-0 w-full">

                      <div className={cn(
                        "h-12 w-12 md:h-14 md:w-14 rounded-2xl shrink-0 flex items-center justify-center border transition-all duration-500 z-10 bg-background shadow-inner",
                        status === 'COMPLETED' ? "border-emerald-500 text-emerald-500 scale-105" :
                          status === 'IN_PROGRESS' ? "border-primary text-primary animate-pulse" : "border-border/60 text-muted-foreground"
                      )}>
                        {isProcessingCurrent ? <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" /> :
                          status === 'COMPLETED' ? <Check className="h-6 w-6 md:h-7 md:w-7 stroke-[3px]" /> :
                            status === 'IN_PROGRESS' ? <PlayCircle className="h-6 w-6 md:h-7 md:w-7" /> : <Clock className="h-6 w-6 md:h-7 md:w-7" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5 w-full">
                        <div className="flex items-center gap-3 mb-1 min-w-0 flex-wrap">
                          <span className="text-[10px] font-black text-primary tracking-widest uppercase shrink-0">Funding Stage</span>
                          <AnimatePresence>
                            {status === 'COMPLETED' && milestone.completedAt && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/10 truncate"
                              >
                                Verified On {new Date(milestone.completedAt).toLocaleDateString()}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                        <h4 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {milestone.phase}: {milestone.deliverables}
                        </h4>

                        <div className="flex items-center justify-between gap-4 mt-4 pt-3.5 border-t border-border/40 min-w-0 w-full">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground truncate shrink-0">
                            <Calendar className="h-4 w-4 opacity-50 shrink-0" />
                            <span className="truncate">Target: {milestone.estimatedDate || 'TBD'}</span>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0 min-w-0">
                            <div className="flex items-baseline gap-1 text-[11px] font-bold">
                              <span className={cn(phasePercent >= 100 ? "text-emerald-600" : "text-foreground")}>
                                <SmartCurrency amount={phaseRaisedMinor.toString()} currency={currency} visible={true} size="small" hideKobo />
                              </span>
                              <span className="text-muted-foreground/50 mx-0.5">of</span>
                              <span className="text-muted-foreground">
                                <SmartCurrency amount={currentPhaseTargetMinor.toString()} currency={currency} visible={true} size="small" hideKobo />
                              </span>
                            </div>
                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${phasePercent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn(
                                  "h-full rounded-full",
                                  phasePercent >= 100 ? "bg-emerald-500" : "bg-primary"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* --- ACTION AREA --- */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                        {status !== 'COMPLETED' ? (
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto rounded-3xl font-bold border-border/60 hover:bg-muted shadow-sm h-10 px-6 text-xs transition-all active:scale-95 min-w-0 truncate"
                            onClick={() => handleStatusChange(milestone.id, 'COMPLETED', index)}
                            disabled={!!processingId}
                          >
                            <Unlock className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                            <span className="truncate">Verify stage</span>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full sm:w-auto text-[11px] font-bold text-muted-foreground hover:text-primary h-9 rounded-3xl gap-2 transition-all active:scale-95 min-w-0 truncate"
                            onClick={() => handleStatusChange(milestone.id, 'IN_PROGRESS', index)}
                            disabled={!!processingId}
                          >
                            <RotateCcw className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Re-open stage</span>
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
            className="mt-8 p-5 md:p-6 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm min-w-0"
          >
            <div className="min-w-0 w-full text-center md:text-left">
              <h4 className="text-base font-bold text-emerald-900 truncate">All stages verified</h4>
              <p className="text-xs font-medium text-emerald-800 mt-1 leading-relaxed">Ready to officially close this project and notify donors of the final impact.</p>
            </div>
            <Button
              onClick={() => setShowFinalizeModal(true)}
              className="w-full md:w-auto h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl px-8 font-bold shadow-md border-0 active:scale-95 transition-all shrink-0 min-w-0"
            >
              <span className="truncate">Finalize project</span>
            </Button>
          </motion.div>
        )}

        {/* Admin Verification Modal */}
        <Dialog open={!!activeMilestone} onOpenChange={(open) => !open && setActiveMilestone(null)}>
          <DialogContent className="rounded-3xl border-none shadow-2xl p-6 md:p-8 bg-card max-w-md min-w-0">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl font-bold text-foreground flex items-center gap-3 truncate">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" /> Verify {activeMilestone?.phase}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4 min-w-0">
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Verifying this stage will mark the milestone as completed, broadcast a notification to donors, and unlock funding for the next stage. You can attach proof of work provided by the vendor.
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="sm" className="rounded-full h-9 px-4" onClick={() => setProofImage(null)}>
                        Change image
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ImageUploader
                      label="Upload vendor proof (optional)"
                      onUploadComplete={(data) => setProofImage({ key: data.key, url: data.previewUrl })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 min-w-0">
                <Button
                  className="w-full sm:flex-1 h-12 rounded-3xl font-bold text-sm shadow-xl shadow-primary/20 bg-primary text-white border-0 transition-all active:scale-[0.98] min-w-0 truncate"
                  onClick={() => updateMilestone(activeMilestone!.id, 'COMPLETED', proofImage?.key || undefined)}
                  disabled={processingId === activeMilestone?.id}
                >
                  {processingId === activeMilestone?.id ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Confirm verification'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto h-12 rounded-3xl font-bold text-sm text-muted-foreground min-w-0 truncate"
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
          <DialogContent className="rounded-3xl border-none shadow-2xl p-6 md:p-8 bg-card max-w-md min-w-0">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl font-bold text-foreground flex items-center gap-3 truncate">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-emerald-500 shrink-0" /> Confirm Impact Achieved
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4 min-w-0">
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                This will officially close the project and email all donors a final summary of the impact they made possible.
              </p>

              <div className="space-y-2 min-w-0">
                <label className="text-xs font-bold text-muted-foreground ml-1">Final impact note</label>
                <Textarea
                  placeholder="Summarize the final results and express gratitude to the donors..."
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  className="min-h-[100px] rounded-2xl bg-muted/20 border-border/60 focus:bg-background resize-none text-sm"
                  disabled={isFinalizing}
                />
              </div>

              <div className="space-y-2 min-w-0">
                <label className="text-xs font-bold text-muted-foreground ml-1">Final evidence photo</label>
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
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="sm" className="rounded-full h-9 px-4" onClick={() => setFinalProofImage(null)}>
                          Change image
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

              <div className="flex flex-col sm:flex-row gap-2 pt-2 min-w-0">
                <Button
                  className="w-full sm:flex-1 h-12 rounded-3xl font-bold text-sm shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white border-0 transition-all active:scale-[0.98] min-w-0 truncate"
                  onClick={handleFinalizeProject}
                  disabled={isFinalizing || !completionNote.trim()}
                >
                  {isFinalizing ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : <><Send className="h-4 w-4 mr-2 hidden sm:inline-block" /> Mark completed</>}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto h-12 rounded-3xl font-bold text-sm text-muted-foreground min-w-0 truncate"
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