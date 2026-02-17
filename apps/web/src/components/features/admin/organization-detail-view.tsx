'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldCheck, Building2, User, FileText,
    ExternalLink, Calendar, LayoutGrid, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { ConfirmModal } from '../../ui/confirm-modal';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate } from '../../../lib/utils/format';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';

export function OrganizationDetailView({ profile }: { profile: any }) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);

    const handleReview = async (status: 'VERIFIED' | 'REJECTED') => {
        if (status === 'REJECTED' && !feedback) return toast.error("Please provide feedback.");

        setIsProcessing(true);
        try {
            await ApiService.organizations.review(profile.id, { status, feedback });
            toast.success(`Entity ${status.toLowerCase()} successfully`);
            setShowVerifyConfirm(false);
            router.refresh();
        } catch (e) {
            toast.error("Action failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const viewDoc = async (key: string) => {
        try {
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, 'admin-org-context');
            window.open(viewUrl, '_blank');
        } catch (e) {
            toast.error('Access Denied');
        }
    };

    const statusColor = {
        VERIFIED: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
        PENDING: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
        REJECTED: 'text-destructive bg-destructive/10 border-destructive/20',
        NOT_SUBMITTED: 'text-muted-foreground bg-muted border-border/40'
    }[profile.status as string] || 'bg-muted';

    return (
        <>
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 pb-20 w-full overflow-hidden">

                {/* 1. HERO & ACTION BAR */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-card p-6 rounded-3xl border border-border/40 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-5 relative z-10 w-full lg:w-auto min-w-0">
                        <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                            <Building2 className="h-8 w-8" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-xl font-bold tracking-tight text-foreground truncate max-w-full">{profile.legalName}</h1>
                                <Badge variant="outline" className={cn("rounded-3xl px-2.5 py-0.5 font-bold text-[11px]  tracking-widest border shrink-0", statusColor)}>
                                    {profile.status}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                                <span className="flex items-center gap-1.5 shrink-0"><Calendar className="h-3.5 w-3.5" /> {formatDate(profile.createdAt).split(',')[0]}</span>
                                <span className="flex items-center gap-1.5 shrink-0"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {profile.registrationNumber || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto relative z-10 pt-4 lg:pt-0 border-t lg:border-none border-border/40">
                        {profile.status !== 'VERIFIED' && (
                            <Button
                                onClick={() => setShowVerifyConfirm(true)}
                                disabled={isProcessing}
                                className="flex-1 lg:flex-none h-11 px-8 rounded-3xl font-bold bg-primary hover:bg-primary/90 shadow-sm text-xs tracking-wider"
                            >
                                Verify Entity
                            </Button>
                        )}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 lg:flex-none h-11 px-6 rounded-3xl border-border/60 text-foreground font-bold text-xs tracking-wider">
                                    Actions
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-3xl p-8 border-none shadow-2xl">
                                <DialogHeader><DialogTitle className="text-lg font-bold">Review Decision</DialogTitle></DialogHeader>
                                <div className="space-y-6 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black  text-muted-foreground ml-1 tracking-widest">Feedback</label>
                                        <textarea
                                            className="w-full h-32 rounded-3xl border border-border bg-muted/20 p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                            placeholder="Reason for rejection or changes..."
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" className="rounded-3xl h-11 font-bold text-xs border-destructive/20 text-destructive hover:bg-destructive/5" onClick={() => handleReview('REJECTED')} disabled={isProcessing}>Reject</Button>
                                        <Button className="rounded-3xl h-11 font-bold bg-amber-500 hover:bg-amber-600 border-0 text-xs text-white shadow-sm" disabled={true}>Request Changes</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

                    {/* LEFT COLUMN: Data & Identity */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                            <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                                <CardTitle className="text-[11px] font-black  tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-primary" /> Proposer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-5">
                                <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/20 border border-border/40 min-w-0">
                                    <div className="h-10 w-10 rounded-3xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                                        {profile.user.firstName[0]}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-foreground truncate">{profile.user.firstName} {profile.user.lastName}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">{profile.user.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-3xl bg-muted/10 border border-border/40 text-center">
                                        <p className="text-[10px] font-black  text-muted-foreground tracking-wider">Joined</p>
                                        <p className="text-xs font-bold mt-1">{formatDate(profile.user.createdAt).split(',')[0]}</p>
                                    </div>
                                    <div className="p-3 rounded-3xl bg-muted/10 border border-border/40 text-center">
                                        <p className="text-[10px] font-black  text-muted-foreground tracking-wider">Causes</p>
                                        <p className="text-xs font-bold mt-1">{profile.user._count.projects}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                            <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                                <CardTitle className="text-[11px] font-black  tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-primary" /> Documents
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                {profile.documentKeys?.map((key: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => viewDoc(key)}
                                        className="w-full flex items-center justify-between p-3.5 rounded-3xl bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-8 w-8 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">Document {i + 1}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono opacity-60  truncate">{key.split('/').pop()?.slice(0, 12)}...</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                    </button>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Impact History */}
                    <div className="lg:col-span-8 space-y-6 min-w-0">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4 text-muted-foreground" /> Platform Impact
                            </h3>
                        </div>

                        <div className="grid gap-3 min-w-0">
                            {profile.user.projects?.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/10 text-muted-foreground text-xs font-medium">
                                    No projects launched by this entity yet.
                                </div>
                            ) : profile.user.projects.map((p: any) => {
                                const percent = Math.min(100, Math.round((Number(p.raisedAmount) / Number(p.targetAmount)) * 100)) || 0;
                                return (
                                    <Card key={p.id} className="rounded-3xl border-border/40 bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-default overflow-hidden">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 min-w-0">
                                            <div className="space-y-2 flex-1 min-w-0 w-full">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] font-bold  rounded-3xl px-2 border-primary/20 bg-primary/5 text-primary shrink-0">{p.status}</Badge>
                                                    <span className="text-[10px] font-mono text-muted-foreground opacity-50  truncate">#{p.id.split('-')[0]}</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-foreground leading-tight truncate">{p.title}</h4>
                                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percent}%` }} />
                                                </div>
                                            </div>
                                            <div className="text-left md:text-right shrink-0">
                                                <p className="text-[10px] font-bold  text-muted-foreground tracking-widest mb-0.5">Raised</p>
                                                <div className="font-bold text-foreground text-sm tabular-nums">
                                                    <SmartCurrency amount={p.raisedAmount} currency={p.currency} visible={true} size="default" />
                                                </div>
                                                <p className="text-[10px] font-bold text-primary mt-0.5">{percent}% of Goal</p>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

            <ConfirmModal
                isOpen={showVerifyConfirm}
                onClose={() => setShowVerifyConfirm(false)}
                onConfirm={() => handleReview('VERIFIED')}
                isLoading={isProcessing}
                variant="default"
                title="Verify Organization"
                description={`Promote ${profile.legalName} to a verified partner node? This will upgrade the owner account to ORGANIZER mode and enable public cause launches.`}
                confirmText="Confirm Verification"
            />
        </>
    );
}