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
        VERIFIED: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        PENDING: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        REJECTED: 'text-destructive bg-destructive/10 border-destructive/20',
        NOT_SUBMITTED: 'text-muted-foreground bg-muted border-border'
    }[profile.status as string] || 'bg-muted';

    return (
        <>
            <div className="space-y-8 animate-in fade-in duration-500 pb-20">

                {/* 1. HERO & ACTION BAR */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-card p-8 rounded-[32px] border border-border shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-20 w-20 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                            <Building2 className="h-10 w-10" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black tracking-tight text-foreground">{profile.legalName}</h1>
                                <Badge variant="outline" className={cn("rounded-lg px-2 py-1 font-bold text-[10px] uppercase tracking-widest border-0", statusColor)}>
                                    {profile.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Registered {formatDate(profile.createdAt).split(',')[0]}</span>
                                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> RC: {profile.registrationNumber || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto relative z-10">
                        {profile.status !== 'VERIFIED' && (
                            <Button
                                onClick={() => setShowVerifyConfirm(true)}
                                disabled={isProcessing}
                                className="flex-1 lg:flex-none h-12 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                            >
                                Verify Entity
                            </Button>
                        )}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 lg:flex-none h-12 px-6 rounded-xl border-border text-foreground font-bold">
                                    Take Action
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[32px]">
                                <DialogHeader><DialogTitle>Administrative Decision</DialogTitle></DialogHeader>
                                <div className="space-y-6 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Reviewer Feedback</label>
                                        <textarea
                                            className="w-full h-32 rounded-2xl border border-border bg-muted/20 p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="State reasons for rejection or requested changes..."
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" className="rounded-xl h-12 font-bold" onClick={() => handleReview('REJECTED')} disabled={isProcessing}>Reject</Button>
                                        <Button className="rounded-xl h-12 font-bold bg-amber-500 hover:bg-amber-600 border-0" disabled={true}>Request Changes</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Data & Identity */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="rounded-[32px] border-border/50 bg-card overflow-hidden shadow-sm">
                            <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" /> Proposer Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/20 border border-border/50">
                                    <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-inner">
                                        {profile.user.firstName[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-foreground">{profile.user.firstName} {profile.user.lastName}</p>
                                        <p className="text-xs text-muted-foreground truncate">{profile.user.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-muted/10 border border-border/50 text-center">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground">Joined</p>
                                        <p className="text-xs font-bold mt-1">{formatDate(profile.user.createdAt).split(',')[0]}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/10 border border-border/50 text-center">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground">Projects</p>
                                        <p className="text-xs font-bold mt-1">{profile.user._count.projects}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[32px] border-border/50 bg-card overflow-hidden shadow-sm">
                            <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" /> KYC Documents
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                {profile.documentKeys?.map((key: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => viewDoc(key)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-foreground">Document {i + 1}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono opacity-60 uppercase">{key.split('/').pop()?.slice(0, 12)}...</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </button>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Impact History */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4" /> Platform Impact Footprint
                            </h3>
                        </div>

                        <div className="grid gap-4">
                            {profile.user.projects?.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-border rounded-[32px] bg-muted/10 text-muted-foreground text-sm">
                                    No projects launched by this entity yet.
                                </div>
                            ) : profile.user.projects.map((p: any) => {
                                const percent = Math.min(100, Math.round((Number(p.raisedAmount) / Number(p.targetAmount)) * 100)) || 0;
                                return (
                                    <Card key={p.id} className="rounded-[28px] border-border/50 bg-card p-6 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase rounded-md px-1.5 border-primary/20 bg-primary/5 text-primary">{p.status}</Badge>
                                                    <span className="text-[10px] font-mono text-muted-foreground opacity-50 uppercase">#{p.id.split('-')[0]}</span>
                                                </div>
                                                <h4 className="text-lg font-bold text-foreground leading-tight">{p.title}</h4>
                                                <div className="h-1.5 w-full max-w-md bg-secondary rounded-full overflow-hidden mt-3">
                                                    <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Total Raised</p>
                                                <div className="font-bold text-foreground text-xl tabular-nums">
                                                    <SmartCurrency amount={p.raisedAmount} currency={p.currency} visible={true} size="default" />
                                                </div>
                                                <p className="text-[10px] font-bold text-primary mt-1">{percent}% Goal Reached</p>
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