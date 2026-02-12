'use client';

import React, { useState } from 'react';
import {
    ChevronDown, ChevronRight,
    ExternalLink, FileText, CheckCircle2, X, Loader2, Check,
    ShieldCheck, AlertCircle, History, Camera
} from 'lucide-react';
import { formatDate } from '../../../lib/utils/format';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { cn } from '../../../lib/utils/cn';
import { ApiService } from '../../../services/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../../ui/card';

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
        setExpandedId(expandedId === id ? null : id);
    };

    const handleReview = async (proofId: string, status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !feedback) {
            return toast.error("Provide rejection feedback");
        }

        setProcessingId(proofId);
        try {
            await ApiService.admin.reviewEvidence(proofId, { status, feedback });
            toast.success(status === 'APPROVED' ? 'Proof Verified' : 'Proof Rejected');
            setProcessedIds(prev => new Set(prev).add(proofId));
            setFeedback('');
            router.refresh();
        } catch (e) {
            toast.error('Audit failed');
        } finally {
            setProcessingId(null);
        }
    };

    if (proofs.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                <Camera className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-bold text-foreground opacity-60 uppercase tracking-widest">No pending evidence</h3>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* MOBILE: High-Density Card List */}
            <div className="grid gap-2 md:hidden">
                {proofs.map((proof) => {
                    const isExpanded = expandedId === proof.id;
                    const isHandled = processedIds.has(proof.id) || proof.status !== 'PENDING';
                    return (
                        <Card key={proof.id} className="rounded-3xl border-border/40 shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                <button
                                    onClick={() => toggleExpand(proof.id)}
                                    className={cn(
                                        "w-full p-4 flex items-center justify-between gap-4 text-left active:bg-muted/50 transition-colors",
                                        isHandled && !isExpanded && "opacity-60"
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-foreground truncate">{proof.project.title}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight px-2 py-0 rounded-3xl border-primary/20 bg-primary/5 text-primary">
                                                {proof.phaseName}
                                            </Badge>
                                            {isHandled && (
                                                <span className={cn("text-[9px] font-bold uppercase italic", proof.status === 'APPROVED' ? "text-emerald-600" : "text-destructive")}>
                                                    {proof.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
                                    </div>
                                </button>
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="pt-3 border-t border-border/40 space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Statement</p>
                                                <p className="text-xs font-medium leading-relaxed italic">&quot;{proof.description}&quot;</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {proof.imageUrls?.map((url: string, i: number) => (
                                                    <button key={i} onClick={() => window.open(url, '_blank')} className="aspect-square rounded-2xl overflow-hidden border border-border/40 bg-muted">
                                                        <img src={url} className="w-full h-full object-cover" alt="Proof" />
                                                    </button>
                                                ))}
                                            </div>
                                            {!isHandled && (
                                                <div className="flex gap-2 pt-2">
                                                    <Button onClick={() => handleReview(proof.id, 'APPROVED')} className="flex-1 h-9 rounded-3xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700">Verify</Button>
                                                    <Button variant="outline" onClick={() => handleReview(proof.id, 'REJECTED')} className="flex-1 h-9 rounded-3xl text-xs font-bold border-destructive/20 text-destructive">Reject</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* DESKTOP: Forensic Table */}
            <Card className="hidden md:block rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 w-12"></th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs">Cause & Phase</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs text-center">Submitted</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs text-right">Assets</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {proofs.map((proof) => {
                                const isExpanded = expandedId === proof.id;
                                const isHandled = processedIds.has(proof.id) || proof.status !== 'PENDING';
                                const isBusy = processingId === proof.id;

                                return (
                                    <React.Fragment key={proof.id}>
                                        <tr
                                            onClick={() => toggleExpand(proof.id)}
                                            className={cn(
                                                "transition-colors cursor-pointer hover:bg-muted/30",
                                                isHandled && !isExpanded && "opacity-60",
                                                isExpanded && "bg-primary/[0.02]"
                                            )}
                                        >
                                            <td className="px-6 py-4">
                                                {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/30" />}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-foreground text-sm">{proof.project.title}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-tight px-2 py-0 rounded-3xl border-primary/20 bg-primary/5 text-primary shadow-none">
                                                            {proof.phaseName}
                                                        </Badge>
                                                        {isHandled && (
                                                            <span className={cn("text-[11px] font-bold uppercase italic", proof.status === 'APPROVED' ? "text-emerald-600" : "text-destructive")}>
                                                                {proof.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <p className="text-xs font-bold text-foreground">{formatDate(proof.submittedAt).split(',')[0]}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Badge variant="secondary" className="rounded-3xl font-bold text-[11px] px-2.5">
                                                    {proof.imageKeys.length} Files
                                                </Badge>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="bg-muted/[0.02]">
                                                <td colSpan={4} className="px-12 py-8 border-t border-border/20">
                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                                        <div className="lg:col-span-8 space-y-6">
                                                            <div className="space-y-2">
                                                                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                                    <FileText className="h-3.5 w-3.5" /> Narrative
                                                                </h4>
                                                                <p className="text-sm text-foreground/90 leading-relaxed font-medium italic border-l-2 border-primary/30 pl-4 py-1">
                                                                    &quot;{proof.description}&quot;
                                                                </p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Visual Assets</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {proof.imageUrls?.map((url: string, i: number) => (
                                                                        <button key={i} onClick={() => window.open(url, '_blank')} className="relative h-20 w-20 rounded-2xl overflow-hidden border border-border/40 bg-muted hover:ring-2 ring-primary/30 transition-all">
                                                                            <img src={url} className="w-full h-full object-cover" alt="Proof" />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="lg:col-span-4">
                                                            <div className="p-6 rounded-3xl border border-border/40 bg-card shadow-sm space-y-5">
                                                                {!isHandled ? (
                                                                    <div className="space-y-4">
                                                                        <div className="text-center space-y-0.5">
                                                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Audit Decision</p>
                                                                            <p className="text-xs text-muted-foreground">Action required for verification</p>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Button onClick={() => handleReview(proof.id, 'APPROVED')} disabled={isBusy} className="w-full h-10 rounded-3xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-2">
                                                                                {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                                                                                Verify Proof
                                                                            </Button>
                                                                            <Dialog>
                                                                                <DialogTrigger asChild>
                                                                                    <Button variant="outline" disabled={isBusy} className="w-full h-10 rounded-3xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold text-xs">Reject</Button>
                                                                                </DialogTrigger>
                                                                                <DialogContent className="rounded-3xl p-8 border-none shadow-2xl">
                                                                                    <DialogHeader>
                                                                                        <DialogTitle className="text-xl font-bold tracking-tight">Audit Rejection</DialogTitle>
                                                                                    </DialogHeader>
                                                                                    <div className="space-y-6 pt-4">
                                                                                        <textarea
                                                                                            className="w-full h-32 rounded-3xl border border-border bg-muted/20 p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                                                                            placeholder="State specific reasons for rejection..."
                                                                                            value={feedback}
                                                                                            onChange={(e) => setFeedback(e.target.value)}
                                                                                        />
                                                                                        <Button variant="destructive" className="w-full h-12 rounded-3xl font-bold text-sm" onClick={() => handleReview(proof.id, 'REJECTED')} disabled={isBusy || !feedback}>Confirm Rejection</Button>
                                                                                    </div>
                                                                                </DialogContent>
                                                                            </Dialog>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center py-2 space-y-3">
                                                                        <div className={cn("h-10 w-10 rounded-3xl flex items-center justify-center mx-auto border", proof.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-destructive/5 text-destructive border-destructive/10")}>
                                                                            <History className="h-5 w-5" />
                                                                        </div>
                                                                        <div className="space-y-0.5">
                                                                            <p className="text-xs font-bold uppercase tracking-wider">{proof.status}</p>
                                                                            <p className="text-[11px] text-muted-foreground font-medium">Recorded on {formatDate(proof.updatedAt || proof.submittedAt)}</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="pt-4 border-t border-border/40 text-center">
                                                                    <span className="text-[9px] font-bold text-emerald-600 flex items-center justify-center gap-1 uppercase tracking-widest"><Check className="h-2.5 w-2.5" /> Ledger Synchronized</span>
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
            </Card>
        </div>
    );
}