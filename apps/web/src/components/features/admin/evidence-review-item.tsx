'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Check, X, Loader2, Camera, Clock, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { ApiService } from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import Link from 'next/link';
import { cn } from '../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export const EvidenceReviewItem = memo(function EvidenceReviewItem({ proof }: { proof: any }) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProcessed, setIsProcessed] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !feedback.trim()) {
            return toast.error("Please Provide A Basis For Rejection.");
        }

        setIsProcessing(true);
        const toastId = toast.loading(`${status === 'APPROVED' ? 'Verifying' : 'Declining'} Proof...`);
        try {
            await ApiService.admin.reviewEvidence(proof.id, { status, feedback });
            toast.success(`Impact Proof ${status === 'APPROVED' ? 'Verified' : 'Declined'}`, { id: toastId });
            setIsProcessed(true);
            router.refresh();
        } catch (e) {
            toast.error('Audit Decision Failed To Sync', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className={cn(
            "relative rounded-[32px] border-border/40 bg-card overflow-hidden shadow-sm transition-all duration-500",
            isProcessed && "opacity-60 grayscale-[0.5]"
        )}>
            <CardHeader className="bg-muted/30 border-b border-border/40 p-6 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-center gap-5 min-w-0">
                    <div className="h-12 w-12 rounded-2xl bg-background border border-border/40 shadow-sm flex items-center justify-center text-primary shrink-0 transition-transform active:scale-95">
                        {isProcessed ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Camera className="h-6 w-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <CardTitle className="text-base font-bold text-foreground truncate flex items-center gap-2 group">
                            {proof.project.title}
                            <Link href={`/admin/projects/${proof.projectId}/edit`} className="text-muted-foreground hover:text-primary transition-colors">
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[11px] font-black tracking-widest text-primary ">Phase: {proof.phaseName}</span>
                            <div className="h-1 w-1 rounded-full bg-border" />
                            <span className="text-[11px] text-muted-foreground font-bold flex items-center gap-1.5 ">
                                <Clock className="h-3.5 w-3.5 opacity-50" /> {new Date(proof.submittedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="h-7 px-3 bg-background text-[10px] font-mono font-bold text-muted-foreground border-border/60 rounded-3xl shadow-sm">
                    Ref: {proof.id.split('-')[0]}
                </Badge>
            </CardHeader>

            <CardContent className="p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                    <div className="lg:col-span-3 space-y-8">
                        <div className="space-y-2">
                            <h4 className="text-[11px] font-black text-muted-foreground tracking-widest flex items-center gap-2  ml-1">
                                <FileText className="h-3.5 w-3.5" /> Narrative Update
                            </h4>
                            <p className="text-sm md:text-base text-foreground leading-relaxed font-medium italic border-l-4 border-primary/30 pl-6 py-2">
                                &quot;{proof.description}&quot;
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-muted-foreground tracking-widest  ml-1">Evidence Assets</h4>
                            <div className="flex flex-wrap gap-3">
                                {proof.imageUrls?.map((url: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => window.open(url, '_blank')}
                                        className="relative h-20 w-20 md:h-24 md:w-24 rounded-[22px] overflow-hidden border border-border/40 bg-muted hover:ring-4 ring-primary/10 transition-all shadow-md group active:scale-95"
                                    >
                                        <Image src={url} fill sizes="(max-width: 768px) 80px, 96px" className="object-cover transition-transform group-hover:scale-110 duration-700" alt="Proof" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ExternalLink className="h-5 w-5 text-white" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-muted/30 border border-border/40 p-7 rounded-[32px] space-y-6 relative overflow-hidden shadow-inner">
                            <AnimatePresence>
                                {isProcessed && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-emerald-600"
                                    >
                                        <CheckCircle2 className="h-12 w-12 mb-2" />
                                        <span className="text-[11px] font-black tracking-widest ">Audit Protocol Finalized</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="text-center space-y-1">
                                <h4 className="text-[11px] font-black text-muted-foreground tracking-widest ">Administrative Decision</h4>
                                <p className="text-xs text-muted-foreground font-medium">Verify against phase requirements</p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => handleReview('APPROVED')}
                                    disabled={isProcessing || isProcessed}
                                    className="w-full h-12 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 transition-all active:scale-[0.98] border-0 shadow-lg"
                                >
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    Approve Proof
                                </Button>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            disabled={isProcessing || isProcessed}
                                            className="w-full h-12 rounded-3xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold text-xs transition-all active:scale-[0.98]"
                                        >
                                            Decline Proof
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-[32px] p-8 shadow-2xl border-none bg-card">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold tracking-tight">Reject Evidence</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6 pt-4">
                                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                                Provide specific instructions for the project owner. They will need to re-submit proof before the next tranche can be disbursed.
                                            </p>
                                            <textarea
                                                className="w-full h-36 rounded-3xl border border-border bg-muted/20 p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all shadow-inner"
                                                placeholder="e.g. Please provide a wide-angle shot of the implementation site..."
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                            />
                                            <Button
                                                variant="destructive"
                                                className="w-full h-14 rounded-3xl font-bold text-sm shadow-md border-0 active:scale-95"
                                                onClick={() => handleReview('REJECTED')}
                                                disabled={isProcessing || !feedback.trim()}
                                            >
                                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Decision'}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="pt-6 border-t border-border/40 text-center">
                                <span className="text-[10px] font-black text-muted-foreground tracking-[0.2em] italic">
                                    Automatic Alerts Initialized
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});