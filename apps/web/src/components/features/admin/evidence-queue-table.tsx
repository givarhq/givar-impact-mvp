'use client';

import React, { useState } from 'react';
import {
    Camera, ChevronDown, ChevronRight, Clock,
    ExternalLink, FileText, CheckCircle2, X, Loader2, Check,
    ShieldCheck, MessageSquare, AlertCircle
} from 'lucide-react';
import { formatDate } from '../../../lib/utils/format';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { cn } from '../../../lib/utils/cn';
import { ApiService } from '../../../services/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface EvidenceQueueTableProps {
    proofs: any[];
}

export function EvidenceQueueTable({ proofs }: EvidenceQueueTableProps) {
    const router = useRouter();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
    const [feedback, setFeedback] = useState('');

    const toggleExpand = (id: string) => {
        if (processedIds.has(id)) return; // Prevent expanding already handled items
        setExpandedId(expandedId === id ? null : id);
    };

    const handleReview = async (proofId: string, status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !feedback) {
            return toast.error("Please provide specific rejection feedback.");
        }

        setProcessingId(proofId);
        try {
            await ApiService.admin.reviewEvidence(proofId, { status, feedback });

            toast.success(status === 'APPROVED' ? 'Proof Verified & Ledger Updated' : 'Proof Rejected');

            // SOTA: Mark as processed locally for instant UI update
            setProcessedIds(prev => new Set(prev).add(proofId));
            setExpandedId(null);
            setFeedback('');

            // Trigger server-side revalidation
            router.refresh();
        } catch (e) {
            toast.error('Audit action failed. Please check your connection.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                        <tr>
                            <th className="px-6 py-4 font-semibold uppercase tracking-tighter text-[11px] w-[50px]"></th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-tighter text-[11px]">Project & Milestone Phase</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-tighter text-[11px] hidden md:table-cell text-center">Submitted At</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-tighter text-[11px] text-right">Evidence Assets</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {proofs.map((proof) => {
                            const isExpanded = expandedId === proof.id;
                            const isHandled = processedIds.has(proof.id);
                            const isBusy = processingId === proof.id;

                            return (
                                <React.Fragment key={proof.id}>
                                    <tr
                                        onClick={() => toggleExpand(proof.id)}
                                        className={cn(
                                            "transition-all duration-200 select-none",
                                            isHandled ? "opacity-40 bg-emerald-500/[0.02] cursor-default" : "cursor-pointer hover:bg-muted/20",
                                            isExpanded && "bg-primary/[0.03]"
                                        )}
                                    >
                                        <td className="px-6 py-5">
                                            {isHandled ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            ) : isExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-primary animate-in fade-in zoom-in" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100" />
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="font-bold text-foreground leading-none">{proof.project.title}</div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-1.5 h-4 border-primary/30 text-primary bg-primary/5">
                                                        {proof.phaseName}
                                                    </Badge>
                                                    {isHandled && <span className="text-[10px] font-bold text-emerald-600 uppercase italic">Processed</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center hidden md:table-cell">
                                            <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                                                <span className="text-xs font-bold tabular-nums">{formatDate(proof.submittedAt).split(',')[0]}</span>
                                                <span className="text-[10px] opacity-60 uppercase font-medium">{formatDate(proof.submittedAt).split(',')[1]}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="flex -space-x-2">
                                                    {proof.imageUrls?.slice(0, 3).map((_: any, i: number) => (
                                                        <div key={i} className="h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center">
                                                            <Camera className="h-3 w-3 text-muted-foreground" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <Badge variant="secondary" className="h-6 rounded-lg bg-muted text-muted-foreground font-bold px-2">
                                                    {proof.imageKeys.length}
                                                </Badge>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* --- SOTA Detail War Room Expansion --- */}
                                    {isExpanded && !isHandled && (
                                        <tr className="bg-primary/[0.01] animate-in slide-in-from-top-2 duration-300">
                                            <td colSpan={4} className="px-10 py-10 border-t border-primary/10 border-b border-border/50">
                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                                                    {/* Narrative & Visual Proof */}
                                                    <div className="lg:col-span-8 space-y-10">
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-primary" /> Submitter Statement
                                                            </h4>
                                                            <div className="relative">
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                                                                <p className="text-sm md:text-lg text-foreground/90 leading-relaxed font-medium pl-8 py-1 whitespace-pre-line italic">
                                                                    &quot;{proof.description}&quot;
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Verified Visual Evidence</h4>
                                                                <span className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase">{proof.imageKeys.length} Assets Attached</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                                {proof.imageUrls?.map((url: string, i: number) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => window.open(url, '_blank')}
                                                                        className="relative aspect-[4/3] rounded-[24px] overflow-hidden border border-border/50 bg-muted hover:ring-4 ring-primary/20 transition-all shadow-sm group/img"
                                                                    >
                                                                        <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="Proof" />
                                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                                            <ExternalLink className="h-5 w-5 text-white" />
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Audit Control Sidebar */}
                                                    <div className="lg:col-span-4 space-y-6">
                                                        <div className="bg-card border border-border/60 p-6 rounded-[32px] shadow-xl relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />

                                                            <div className="relative z-10 space-y-6">
                                                                <div className="text-center space-y-1">
                                                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Audit Decision</h4>
                                                                    <p className="text-xs text-muted-foreground leading-tight">Verify ground-truth before approving.</p>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    <Button
                                                                        onClick={() => handleReview(proof.id, 'APPROVED')}
                                                                        disabled={isBusy}
                                                                        className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 gap-2 transition-all active:scale-95"
                                                                    >
                                                                        {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                                                        Verify & Close Phase
                                                                    </Button>

                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <Button
                                                                                variant="outline"
                                                                                disabled={isBusy}
                                                                                className="w-full h-12 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold text-sm gap-2"
                                                                            >
                                                                                <X className="h-4 w-4" /> Reject Evidence
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                        <DialogContent className="rounded-[32px] p-8 border-none shadow-2xl bg-card">
                                                                            <DialogHeader className="space-y-3">
                                                                                <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                                                                                    <AlertCircle className="h-6 w-6" />
                                                                                </div>
                                                                                <DialogTitle className="text-2xl font-black text-foreground tracking-tight">Audit Rejection</DialogTitle>
                                                                            </DialogHeader>
                                                                            <div className="space-y-6 pt-4">
                                                                                <div className="space-y-2">
                                                                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Feedback to Proposer</label>
                                                                                    <textarea
                                                                                        className="w-full h-36 rounded-2xl border border-border bg-muted/20 p-5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                                                                                        placeholder="Describe why this evidence was rejected... (e.g. Photo blur, Deliverables mismatch)"
                                                                                        value={feedback}
                                                                                        onChange={(e) => setFeedback(e.target.value)}
                                                                                    />
                                                                                </div>
                                                                                <Button
                                                                                    variant="destructive"
                                                                                    className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-destructive/20"
                                                                                    onClick={() => handleReview(proof.id, 'REJECTED')}
                                                                                    disabled={isBusy || !feedback}
                                                                                >
                                                                                    {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Rejection'}
                                                                                </Button>
                                                                            </div>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>

                                                                <div className="pt-4 border-t border-border/40 space-y-3">
                                                                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                        <span>Platform Status</span>
                                                                        <span className="text-emerald-500 flex items-center gap-1">
                                                                            <Check className="h-3 w-3" /> Online
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                                                        Warning: Verification is permanent and triggers immediate donor impact notification.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}