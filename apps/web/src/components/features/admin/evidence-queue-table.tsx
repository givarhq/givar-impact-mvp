'use client';

import React, { useState } from 'react';
import {
    Camera, ChevronDown, ChevronRight, Clock,
    ExternalLink, FileText, CheckCircle2, X, Loader2, Check,
    ShieldCheck, AlertCircle, History
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
        // SOTA FIX: Allowed expansion for all items to enable historical review
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
            setProcessedIds(prev => new Set(prev).add(proofId));
            setFeedback('');
            router.refresh();
        } catch (e) {
            toast.error('Audit action failed.');
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
                            const isHandled = processedIds.has(proof.id) || proof.status !== 'PENDING';
                            const isBusy = processingId === proof.id;

                            return (
                                <React.Fragment key={proof.id}>
                                    <tr
                                        onClick={() => toggleExpand(proof.id)}
                                        className={cn(
                                            "transition-all duration-200 select-none cursor-pointer hover:bg-muted/20",
                                            isHandled && !isExpanded ? "opacity-60 bg-emerald-500/[0.01]" : "",
                                            isExpanded && "bg-primary/[0.03]"
                                        )}
                                    >
                                        <td className="px-6 py-5">
                                            {isExpanded ? (
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
                                                    {isHandled && (
                                                        <span className={cn(
                                                            "text-[9px] font-bold uppercase italic flex items-center gap-1",
                                                            proof.status === 'APPROVED' ? "text-emerald-600" : "text-destructive"
                                                        )}>
                                                            <CheckCircle2 className="h-3 w-3" /> {proof.status}
                                                        </span>
                                                    )}
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
                                                <Badge variant="secondary" className="h-6 rounded-lg bg-muted text-muted-foreground font-bold px-2">
                                                    {proof.imageKeys.length} Files
                                                </Badge>
                                            </div>
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <tr className="bg-primary/[0.01] animate-in slide-in-from-top-2 duration-300">
                                            <td colSpan={4} className="px-10 py-10 border-t border-primary/10 border-b border-border/50">
                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
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
                                                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Verified Visual Evidence</h4>
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                                {proof.imageUrls?.map((url: string, i: number) => (
                                                                    <button key={i} onClick={() => window.open(url, '_blank')} className="relative aspect-[4/3] rounded-[24px] overflow-hidden border border-border/50 bg-muted hover:ring-4 ring-primary/20 transition-all shadow-sm group/img">
                                                                        <img src={url} className="w-full h-full object-cover transition-transform duration-500" alt="Proof" />
                                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                                            <ExternalLink className="h-5 w-5 text-white" />
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="lg:col-span-4 space-y-6">
                                                        <div className="bg-card border border-border/60 p-6 rounded-[32px] shadow-xl relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />
                                                            <div className="relative z-10 space-y-6">
                                                                {/* SOTA FIX: Dynamic Decision Sidebar Content */}
                                                                {!isHandled ? (
                                                                    <div className="space-y-6">
                                                                        <div className="text-center space-y-1">
                                                                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Audit Decision</h4>
                                                                            <p className="text-xs text-muted-foreground leading-tight">Action required for this entry.</p>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            <Button onClick={() => handleReview(proof.id, 'APPROVED')} disabled={isBusy} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 gap-2">
                                                                                {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                                                                Verify & Close Phase
                                                                            </Button>
                                                                            <Dialog>
                                                                                <DialogTrigger asChild><Button variant="outline" disabled={isBusy} className="w-full h-12 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold text-sm gap-2"><X className="h-4 w-4" /> Reject Evidence</Button></DialogTrigger>
                                                                                <DialogContent className="rounded-[32px] p-8 border-none shadow-2xl bg-card">
                                                                                    <DialogHeader className="space-y-3">
                                                                                        <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center"><AlertCircle className="h-6 w-6" /></div>
                                                                                        <DialogTitle className="text-2xl font-black text-foreground tracking-tight">Audit Rejection</DialogTitle>
                                                                                    </DialogHeader>
                                                                                    <div className="space-y-6 pt-4">
                                                                                        <textarea className="w-full h-36 rounded-2xl border border-border bg-muted/20 p-5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" placeholder="Describe why this evidence was rejected..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                                                                                        <Button variant="destructive" className="w-full h-14 rounded-2xl font-bold text-lg" onClick={() => handleReview(proof.id, 'REJECTED')} disabled={isBusy || !feedback}>{isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Rejection'}</Button>
                                                                                    </div>
                                                                                </DialogContent>
                                                                            </Dialog>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-6 animate-in fade-in duration-500">
                                                                        <div className="text-center space-y-1">
                                                                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Audit Archived</h4>
                                                                            <p className="text-xs text-muted-foreground">This entry has been finalized.</p>
                                                                        </div>
                                                                        <div className={cn(
                                                                            "p-4 rounded-2xl border flex flex-col items-center gap-3 text-center",
                                                                            proof.status === 'APPROVED' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" : "bg-destructive/5 border-destructive/20 text-destructive"
                                                                        )}>
                                                                            <History className="h-6 w-6" />
                                                                            <div className="space-y-1">
                                                                                <p className="text-sm font-bold uppercase tracking-widest">{proof.status}</p>
                                                                                <p className="text-[10px] opacity-80 leading-relaxed font-medium">
                                                                                    Decision recorded on {formatDate(proof.updatedAt || proof.submittedAt)}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        {proof.adminFeedback && (
                                                                            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Admin Feedback</p>
                                                                                <p className="text-xs italic text-foreground/70 leading-relaxed">&quot;{proof.adminFeedback}&quot;</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="pt-4 border-t border-border/40 space-y-3">
                                                                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                        <span>Platform Status</span>
                                                                        <span className="text-emerald-500 flex items-center gap-1"><Check className="h-3 w-3" /> Ledger Synced</span>
                                                                    </div>
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