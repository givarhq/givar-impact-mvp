'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';
import {
    ChevronDown,
    ChevronRight,
    ExternalLink,
    FileText,
    CheckCircle2,
    X,
    Loader2,
    Check,
    ShieldCheck,
    Camera
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
import { motion, AnimatePresence } from 'framer-motion';

interface EvidenceQueueTableProps {
    proofs: any[];
}

export const EvidenceQueueTable = memo(function EvidenceQueueTable({ proofs }: EvidenceQueueTableProps) {
    const router = useRouter();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
    const [feedback, setFeedback] = useState('');

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleReview = async (proofId: string, status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !feedback.trim()) {
            return toast.error("Please Provide A Reason For This Rejection.");
        }

        setProcessingId(proofId);
        const toastId = toast.loading(`${status === 'APPROVED' ? 'Verifying' : 'Declining'} Impact Proof...`);
        try {
            await ApiService.admin.reviewEvidence(proofId, { status, feedback });
            toast.success(status === 'APPROVED' ? 'Evidence Successfully Verified' : 'Evidence Has Been Declined', { id: toastId });
            setProcessedIds(prev => new Set(prev).add(proofId));
            setFeedback('');
            router.refresh();
        } catch (e) {
            toast.error('Audit Decision Failed To Record', { id: toastId });
        } finally {
            setProcessingId(null);
        }
    };

    if (proofs.length === 0) {
        return (
            <div className="py-24 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                <Camera className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-bold text-foreground opacity-60 tracking-widest ">No Pending Evidence</h3>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* MOBILE: High-Density Card List */}
            <div className="grid gap-2.5 md:hidden">
                <AnimatePresence mode="popLayout">
                    {proofs.map((proof) => {
                        const isExpanded = expandedId === proof.id;
                        const isHandled = processedIds.has(proof.id) || proof.status !== 'PENDING';
                        return (
                            <motion.div
                                key={proof.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <Card className="rounded-[28px] border-border/40 shadow-sm overflow-hidden bg-card">
                                    <CardContent className="p-0">
                                        <button
                                            onClick={() => toggleExpand(proof.id)}
                                            className={cn(
                                                "w-full p-5 flex items-center justify-between gap-4 text-left active:bg-muted/50 transition-colors",
                                                isHandled && !isExpanded && "opacity-60"
                                            )}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-foreground truncate">{proof.project.title}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="outline" className="text-[10px] font-bold tracking-tight px-2.5 py-0.5 rounded-3xl border-primary/20 bg-primary/5 text-primary shadow-none ">
                                                        Phase: {proof.phaseName}
                                                    </Badge>
                                                    {isHandled && (
                                                        <span className={cn("text-[10px] font-black italic ", proof.status === 'APPROVED' ? "text-emerald-600" : "text-destructive")}>
                                                            {proof.status}
                                                        </span >
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/30" />}
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-5 pb-5 space-y-5 overflow-hidden"
                                                >
                                                    <div className="pt-4 border-t border-border/40 space-y-4">
                                                        <div className="space-y-1.5">
                                                            <p className="text-[10px] font-black text-muted-foreground tracking-widest ">Owner Statement</p>
                                                            <p className="text-xs font-medium leading-relaxed italic text-foreground/80">&quot;{proof.description}&quot;</p>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {proof.imageUrls?.map((url: string, i: number) => (
                                                                <button key={i} onClick={() => window.open(url, '_blank')} className="aspect-square rounded-2xl overflow-hidden border border-border/40 bg-muted shadow-inner active:scale-95 transition-transform relative">
                                                                    <Image src={url} fill sizes="(max-width: 768px) 33vw, 20vw" className="object-cover" alt="Impact Proof" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {!isHandled && (
                                                            <div className="flex gap-2.5 pt-2">
                                                                <Button onClick={() => handleReview(proof.id, 'APPROVED')} className="flex-1 h-10 rounded-3xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-md transition-all active:scale-95">Verify Proof</Button>
                                                                <Button variant="outline" onClick={() => handleReview(proof.id, 'REJECTED')} className="flex-1 h-10 rounded-3xl text-xs font-bold border-destructive/20 text-destructive hover:bg-destructive/5 transition-all active:scale-95">Decline</Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* DESKTOP: Forensic Queue Table */}
            <Card className="hidden md:block rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground">
                            <tr>
                                <th className="px-7 py-4 w-12"></th>
                                <th className="px-7 py-4 font-bold tracking-widest text-[10px] ">Cause And Execution Phase</th>
                                <th className="px-7 py-4 font-bold tracking-widest text-[10px]  text-center">Date Submitted</th>
                                <th className="px-7 py-4 font-bold tracking-widest text-[10px]  text-right">Visual Assets</th>
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
                                                "transition-colors cursor-pointer hover:bg-muted/20",
                                                isHandled && !isExpanded && "opacity-60",
                                                isExpanded && "bg-primary/[0.01]"
                                            )}
                                        >
                                            <td className="px-7 py-5">
                                                {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/30" />}
                                            </td>
                                            <td className="px-7 py-5">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-foreground text-sm leading-tight">{proof.project.title}</p>
                                                    <div className="flex items-center gap-2.5">
                                                        <Badge variant="outline" className="text-[10px] font-bold tracking-tight px-2.5 py-0.5 rounded-3xl border-primary/20 bg-primary/5 text-primary shadow-none ">
                                                            Phase: {proof.phaseName}
                                                        </Badge>
                                                        {isHandled && (
                                                            <span className={cn("text-[10px] font-black italic ", proof.status === 'APPROVED' ? "text-emerald-600" : "text-destructive")}>
                                                                {proof.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-7 py-5 text-center">
                                                <p className="text-xs font-bold text-foreground tabular-nums">{formatDate(proof.submittedAt).split(',')[0]}</p>
                                            </td>
                                            <td className="px-7 py-5 text-right">
                                                <Badge variant="secondary" className="rounded-3xl font-black text-[9px] px-3 py-1 bg-muted/60 border-border/40 shadow-inner  tracking-wider">
                                                    {proof.imageKeys.length} Files Attached
                                                </Badge>
                                            </td>
                                        </tr>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={4} className="p-0 border-none">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-muted/[0.02]"
                                                        >
                                                            <div className="px-14 py-10 border-t border-border/20">
                                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                                                    <div className="lg:col-span-8 space-y-8">
                                                                        <div className="space-y-3">
                                                                            <h4 className="text-[11px] font-bold text-muted-foreground tracking-widest flex items-center gap-2 ">
                                                                                <FileText className="h-3.5 w-3.5" /> Narrative Update
                                                                            </h4>
                                                                            <p className="text-sm md:text-base text-foreground/90 leading-relaxed font-medium italic border-l-4 border-primary/30 pl-6 py-2">
                                                                                &quot;{proof.description}&quot;
                                                                            </p>
                                                                        </div>
                                                                        <div className="space-y-4">
                                                                            <h4 className="text-[11px] font-bold text-muted-foreground tracking-widest ">Evidence Media</h4>
                                                                            <div className="flex flex-wrap gap-3">
                                                                                {proof.imageUrls?.map((url: string, i: number) => (
                                                                                    <button key={i} onClick={() => window.open(url, '_blank')} className="relative h-24 w-24 rounded-[22px] overflow-hidden border border-border/40 bg-muted hover:ring-4 ring-primary/10 transition-all shadow-md group">
                                                                                        <Image src={url} fill sizes="96px" className="object-cover transition-transform group-hover:scale-110 duration-500" alt="Proof" />
                                                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                            <ExternalLink className="h-5 w-5 text-white" />
                                                                                        </div>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="lg:col-span-4">
                                                                        <div className="p-8 rounded-3xl border border-border/40 bg-card shadow-xl space-y-6 relative overflow-hidden">
                                                                            {!isHandled ? (
                                                                                <div className="space-y-6 relative z-10">
                                                                                    <div className="text-center space-y-1">
                                                                                        <p className="text-[11px] font-black text-primary tracking-widest ">Audit Decision</p>
                                                                                        <p className="text-xs text-muted-foreground font-medium">Evaluate against phase criteria</p>
                                                                                    </div>
                                                                                    <div className="space-y-3">
                                                                                        <Button onClick={() => handleReview(proof.id, 'APPROVED')} disabled={isBusy} className="w-full h-12 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 border-0 shadow-lg active:scale-[0.98] transition-all">
                                                                                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                                                                            Verify Evidence
                                                                                        </Button>
                                                                                        <Dialog>
                                                                                            <DialogTrigger asChild>
                                                                                                <Button variant="outline" disabled={isBusy} className="w-full h-12 rounded-3xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold text-xs transition-all active:scale-[0.98]">Decline Proof</Button>
                                                                                            </DialogTrigger>
                                                                                            <DialogContent className="rounded-3xl p-8 border-none shadow-2xl bg-card">
                                                                                                <DialogHeader>
                                                                                                    <DialogTitle className="text-xl font-bold tracking-tight">Decline Evidence</DialogTitle>
                                                                                                </DialogHeader>
                                                                                                <div className="space-y-6 pt-4">
                                                                                                    <textarea
                                                                                                        className="w-full h-40 rounded-3xl border border-border bg-muted/20 p-5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner"
                                                                                                        placeholder="State specific reason for declining this proof..."
                                                                                                        value={feedback}
                                                                                                        onChange={(e) => setFeedback(e.target.value)}
                                                                                                    />
                                                                                                    <Button variant="destructive" className="w-full h-14 rounded-3xl font-bold text-sm shadow-md border-0 active:scale-95" onClick={() => handleReview(proof.id, 'REJECTED')} disabled={isBusy || !feedback.trim()}>Confirm Rejection</Button>
                                                                                                </div>
                                                                                            </DialogContent>
                                                                                        </Dialog>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
                                                                                    <div className={cn("h-14 w-14 rounded-[22px] flex items-center justify-center mx-auto border shadow-inner", proof.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-destructive/5 text-destructive border-destructive/10")}>
                                                                                        <CheckCircle2 className="h-7 w-7" />
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        <p className="text-xs font-black tracking-widest ">{proof.status}</p>
                                                                                        <p className="text-[11px] text-muted-foreground font-medium">Decision recorded on {formatDate(proof.updatedAt || proof.submittedAt)}</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            <div className="pt-6 border-t border-border/40 text-center">
                                                                                <span className="text-[10px] font-black text-emerald-600 flex items-center justify-center gap-1.5 tracking-[0.2em] ">
                                                                                    <Check className="h-3.5 w-3.5 stroke-[4px]" /> Ledger Synchronized
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
});