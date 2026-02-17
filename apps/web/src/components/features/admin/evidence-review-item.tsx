'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Check, X, Loader2, Camera, Clock, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { ApiService } from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import Link from 'next/link';
import { cn } from '../../../lib/utils/cn';

export default function EvidenceReviewItem({ proof }: { proof: any }) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProcessed, setIsProcessed] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !feedback) {
            return toast.error("Rejection feedback required");
        }

        setIsProcessing(true);
        try {
            await ApiService.admin.reviewEvidence(proof.id, { status, feedback });
            toast.success(status === 'APPROVED' ? 'Proof Verified' : 'Proof Rejected');
            setIsProcessed(true);
            router.refresh();
        } catch (e) {
            toast.error('Audit failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className={cn(
            "relative rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm transition-all duration-300",
            isProcessed && "opacity-60"
        )}>
            <CardHeader className="bg-muted/30 border-b border-border/40 p-5 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-3xl bg-background border border-border/40 shadow-sm flex items-center justify-center text-primary shrink-0">
                        {isProcessed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Camera className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                            {proof.project.title}
                            <Link href={`/admin/projects/${proof.projectId}/edit`} className="text-muted-foreground hover:text-primary transition-colors">
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-bold  tracking-widest text-primary">Phase: {proof.phaseName}</span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" /> {new Date(proof.submittedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="h-6 bg-background text-[10px] font-bold  tracking-tighter text-muted-foreground border-border/60 rounded-3xl">
                    ID: {proof.id.split('-')[0]}
                </Badge>
            </CardHeader>

            <CardContent className="p-5 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="space-y-1.5">
                            <h4 className="text-[11px] font-bold text-muted-foreground  tracking-widest flex items-center gap-1.5 ml-1">
                                <FileText className="h-3 w-3" /> Narrative
                            </h4>
                            <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-medium italic border-l-2 border-primary/30 pl-4 py-1">
                                &quot;{proof.description}&quot;
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-[11px] font-bold text-muted-foreground  tracking-widest ml-1">Evidence Assets</h4>
                            <div className="flex flex-wrap gap-2">
                                {proof.imageUrls?.map((url: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => window.open(url, '_blank')}
                                        className="relative h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden border border-border/40 bg-muted hover:ring-2 ring-primary/30 transition-all shadow-sm group"
                                    >
                                        <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Proof" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                            <ExternalLink className="h-4 w-4 text-white" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-muted/30 border border-border/40 p-5 rounded-3xl space-y-5 relative">
                            {isProcessed && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-emerald-600 animate-in fade-in duration-300">
                                    <CheckCircle2 className="h-10 w-10 mb-2" />
                                    <span className="text-[11px] font-bold  tracking-widest">Audit Finalized</span>
                                </div>
                            )}

                            <div className="text-center space-y-1">
                                <h4 className="text-[11px] font-bold text-muted-foreground  tracking-widest">Administrative Action</h4>
                                <p className="text-xs text-muted-foreground font-medium">Verify against milestone criteria</p>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    onClick={() => handleReview('APPROVED')}
                                    disabled={isProcessing || isProcessed}
                                    className="w-full h-10 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 transition-all active:scale-[0.98]"
                                >
                                    {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                    Approve Proof
                                </Button>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            disabled={isProcessing || isProcessed}
                                            className="w-full h-10 rounded-3xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold text-xs"
                                        >
                                            Reject Proof
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-3xl p-8 shadow-2xl border-none">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold tracking-tight">Reject Evidence</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-5 pt-4">
                                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                                Provide specific feedback. The project owner must resubmit verified proof to continue tranches.
                                            </p>
                                            <textarea
                                                className="w-full h-28 rounded-3xl border border-border bg-muted/20 p-4 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                                                placeholder="e.g. Insufficient visual detail..."
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                            />
                                            <Button
                                                variant="destructive"
                                                className="w-full h-12 rounded-3xl font-bold text-sm shadow-sm"
                                                onClick={() => handleReview('REJECTED')}
                                                disabled={isProcessing || !feedback}
                                            >
                                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Rejection'}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="pt-4 border-t border-border/40 text-center">
                                <span className="text-[10px] font-bold text-muted-foreground  tracking-[0.2em] italic">
                                    Notification will be auto-dispatched
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}