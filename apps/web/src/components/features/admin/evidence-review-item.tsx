'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { ApiService } from '../../../services/api';
import { Card } from '../../../components/ui/card';
import { CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Inbox, Camera, Clock, ExternalLink, ShieldCheck, FileText } from 'lucide-react';
import Link from 'next/link';

export default function EvidenceReviewItem({ proof }: { proof: any }) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !feedback) {
            return toast.error("Please provide rejection feedback.");
        }

        setIsProcessing(true);
        try {
            await ApiService.admin.reviewEvidence(proof.id, { status, feedback });
            toast.success(status === 'APPROVED' ? 'Proof Verified!' : 'Proof Rejected');
            router.refresh();
        } catch (e) {
            toast.error('Audit action failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="group relative rounded-[32px] border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Background Subtle Gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10" />

            <CardHeader className="bg-muted/30 border-b border-border/40 py-5 px-6 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-background border border-border/50 shadow-sm flex items-center justify-center text-primary">
                        <Camera className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            {proof.project.title}
                            <Link href={`/admin/projects/${proof.projectId}/edit`} className="text-muted-foreground hover:text-primary transition-colors">
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Phase: {proof.phaseName}</span>
                            <span className="text-border">|</span>
                            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Submitted {new Date(proof.submittedAt).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="h-6 bg-background text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                    REF: {proof.id.split('-')[0]}
                </Badge>
            </CardHeader>

            <CardContent className="p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                    {/* Narrative Detail */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Submitter Narrative
                            </h4>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                                <p className="text-sm md:text-base text-foreground/90 leading-relaxed font-medium pl-6 py-1 whitespace-pre-line italic">
                                    &quot;{proof.description}&quot;
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Visual Evidence Assets</h4>
                            <div className="flex flex-wrap gap-3">
                                {proof.imageUrls?.map((url: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => window.open(url, '_blank')}
                                        className="relative h-24 w-24 md:h-28 md:w-28 rounded-[20px] overflow-hidden border border-border/50 bg-muted hover:ring-2 ring-primary/50 transition-all shadow-sm group/img"
                                    >
                                        <img src={url} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt="Proof Asset" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                            <ExternalLink className="h-4 w-4 text-white" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Audit Controls */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-muted/30 border border-border/50 p-6 rounded-[28px] space-y-6">
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center">Audit Decision</h4>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => handleReview('APPROVED')}
                                    disabled={isProcessing}
                                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-500/20 gap-2 transition-all active:scale-95"
                                >
                                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                    Verify & Approve
                                </Button>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            disabled={isProcessing}
                                            className="w-full h-12 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold text-sm gap-2"
                                        >
                                            <X className="h-4 w-4" /> Reject Evidence
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-[32px]">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-black text-foreground">Reject Proof of Work</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-5 pt-4">
                                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                                Please provide specific feedback. The project owner will see this and must resubmit new evidence to continue.
                                            </p>
                                            <textarea
                                                className="w-full h-32 rounded-2xl border border-border bg-background p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                                                placeholder="e.g. Image quality is too low, please upload a clearer shot of the drilling equipment..."
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                            />
                                            <Button
                                                variant="destructive"
                                                className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-destructive/20"
                                                onClick={() => handleReview('REJECTED')}
                                                disabled={isProcessing || !feedback}
                                            >
                                                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Rejection'}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="pt-4 border-t border-border/40">
                                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                                    <span>Milestone Status</span>
                                    <span className="text-primary">In Progress</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed italic">
                                    Note: Approval will trigger an automated public update and notify all donors via email.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}