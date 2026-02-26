'use client';

import React, { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldCheck,
    Building2,
    User,
    FileText,
    ExternalLink,
    Calendar,
    LayoutGrid,
    Loader2,
    UserCheck,
    Fingerprint
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
import { motion, AnimatePresence } from 'framer-motion';

export const OrganizationDetailView = memo(function OrganizationDetailView({ profile }: { profile: any }) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);

    const isIndividual = profile.kycType === 'INDIVIDUAL';

    const handleReview = async (status: 'VERIFIED' | 'REJECTED') => {
        if (status === 'REJECTED' && !feedback.trim()) return toast.error("Please Provide Rejection Feedback.");

        setIsProcessing(true);
        const toastId = toast.loading(`Processing ${status === 'VERIFIED' ? 'Verification' : 'Rejection'}...`);
        try {
            await ApiService.organizations.review(profile.id, { status, feedback });
            toast.success(`Identity status successfully updated to ${status.toLowerCase()}`, { id: toastId });
            setShowVerifyConfirm(false);
            router.refresh();
        } catch (e) {
            toast.error("Administrative action failed to sync", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const viewDoc = async (key: string) => {
        const toastId = toast.loading('Decrypting secure document...');
        try {
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, 'admin-org-context');
            window.open(viewUrl, '_blank');
            toast.dismiss(toastId);
        } catch (e) {
            toast.error('Access to secure vault denied', { id: toastId });
        }
    };

    const statusColor = {
        VERIFIED: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
        PENDING: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
        REJECTED: 'text-destructive bg-destructive/10 border-destructive/20',
        NOT_SUBMITTED: 'text-muted-foreground bg-muted border-border/40'
    }[profile.status as string] || 'bg-muted';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 md:space-y-6 pb-20 w-full overflow-hidden"
        >
            {/* Hero Action Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-card p-6 rounded-3xl border border-border/40 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-5 relative z-10 w-full lg:w-auto min-w-0">
                    <div className={cn(
                        "h-16 w-16 rounded-3xl flex items-center justify-center shrink-0 border shadow-inner",
                        isIndividual ? "bg-blue-500/10 border-blue-500/20 text-blue-600" : "bg-purple-500/10 border-purple-500/20 text-purple-600"
                    )}>
                        {isIndividual ? <UserCheck className="h-8 w-8" /> : <Building2 className="h-8 w-8" />}
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-lg font-bold tracking-tight text-foreground truncate max-w-full">{profile.legalName}</h1>
                            <Badge variant="outline" className={cn("rounded-3xl px-2.5 py-0.5 font-bold text-[10px] tracking-widest border  shrink-0", statusColor)}>
                                {profile.status}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1.5 shrink-0"><Calendar className="h-3.5 w-3.5" /> Registered On {formatDate(profile.createdAt).split(',')[0]}</span>
                            <span className="flex items-center gap-1.5 shrink-0"><Fingerprint className="h-3.5 w-3.5 text-primary" /> {isIndividual ? 'Gov ID' : 'Reg ID'}: {profile.registrationNumber || 'Not Provided'}</span>
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-3xl bg-muted/50 border border-border/40", isIndividual ? "text-blue-600" : "text-purple-600")}>
                                {isIndividual ? 'Individual Account' : 'Corporate Entity'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto relative z-10 pt-4 lg:pt-0 border-t lg:border-none border-border/40">
                    {profile.status !== 'VERIFIED' && (
                        <Button
                            onClick={() => setShowVerifyConfirm(true)}
                            disabled={isProcessing}
                            className="flex-1 lg:flex-none h-11 px-8 rounded-3xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs tracking-wider border-0 transition-all active:scale-95"
                        >
                            Verify Identity
                        </Button>
                    )}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 lg:flex-none h-11 px-6 rounded-3xl border-border/60 text-foreground font-bold text-xs tracking-wider hover:bg-muted transition-all active:scale-95">
                                Audit Actions
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl p-8 border-none shadow-2xl bg-card">
                            <DialogHeader><DialogTitle className="text-lg font-bold">Administrative Decision</DialogTitle></DialogHeader>
                            <div className="space-y-6 pt-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-muted-foreground ml-1 tracking-widest">Decision Feedback</label>
                                    <textarea
                                        className="w-full h-32 rounded-3xl border border-border bg-muted/20 p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                                        placeholder="State specific reason for rejection or requested changes..."
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="rounded-3xl h-12 font-bold text-xs border-destructive/20 text-destructive hover:bg-destructive/5 transition-all active:scale-95" onClick={() => handleReview('REJECTED')} disabled={isProcessing}>Reject Identity</Button>
                                    <Button className="rounded-3xl h-12 font-bold bg-amber-500 hover:bg-amber-600 border-0 text-xs text-white shadow-md active:scale-95" disabled={true}>Request Edits</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* LEFT: IDENTITY NODES */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-primary" /> Proposer Account
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/20 border border-border/40 min-w-0 shadow-inner group">
                                <div className="h-10 w-10 rounded-3xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0 transition-transform group-hover:scale-105">
                                    {profile.user.firstName[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-foreground truncate">{profile.user.firstName} {profile.user.lastName}</p>
                                    <p className="text-[11px] text-muted-foreground truncate font-medium">{profile.user.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-3xl bg-muted/10 border border-border/40 text-center shadow-sm">
                                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest ">Joined</p>
                                    <p className="text-xs font-bold mt-1 tabular-nums">{formatDate(profile.user.createdAt).split(',')[0]}</p>
                                </div>
                                <div className="p-3 rounded-3xl bg-muted/10 border border-border/40 text-center shadow-sm">
                                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest ">Cause Count</p>
                                    <p className="text-xs font-bold mt-1 tabular-nums">{profile.user._count.projects}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-primary" /> Compliance Assets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {profile.documentKeys?.map((key: string, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => viewDoc(key)}
                                    className="w-full flex items-center justify-between p-3.5 rounded-3xl bg-muted/20 border border-border/40 hover:bg-primary/5 hover:border-primary/20 transition-all group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-2xl bg-background flex items-center justify-center shrink-0 border border-border/10 shadow-sm group-hover:border-primary/20">
                                            <FileText className="h-4.5 w-4.5 text-primary" />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate group-hover:text-primary">Legal Document {i + 1}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono opacity-60 truncate">Secure Access</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: IMPACT LEDGER */}
                <div className="lg:col-span-8 space-y-6 min-w-0">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-bold text-base text-foreground flex items-center gap-2 tracking-tight">
                            <LayoutGrid className="h-4.5 w-4.5 text-primary" /> Platform Impact Trace
                        </h3>
                    </div>

                    <div className="grid gap-3 min-w-0">
                        {profile.user.projects?.length === 0 ? (
                            <div className="py-24 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/10">
                                <FileText className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-3" />
                                <p className="text-xs font-bold text-muted-foreground tracking-widest ">No Historic Projects Recorded</p>
                            </div>
                        ) : profile.user.projects.map((p: any) => {
                            const percent = Math.min(100, Math.round((Number(p.raisedAmount) / Number(p.targetAmount)) * 100)) || 0;
                            return (
                                <Card key={p.id} className="rounded-3xl border-border/40 bg-card p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 min-w-0">
                                        <div className="space-y-2 flex-1 min-w-0 w-full">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="text-[9px] font-bold rounded-3xl px-2.5 bg-primary/5 text-primary border-primary/10 shadow-none ">{p.status}</Badge>
                                                <span className="text-[10px] font-mono text-muted-foreground opacity-50 truncate">Id: {p.id.split('-')[0]}</span>
                                            </div>
                                            <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{p.title}</h4>
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/10">
                                                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                        <div className="text-left md:text-right shrink-0">
                                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-1 ">Total Raised</p>
                                            <div className="font-bold text-foreground text-sm tabular-nums">
                                                <SmartCurrency amount={p.raisedAmount} currency={p.currency} visible={true} size="default" />
                                            </div>
                                            <p className="text-[10px] font-black text-primary mt-1 ">{percent}% Of Goal</p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showVerifyConfirm}
                onClose={() => setShowVerifyConfirm(false)}
                onConfirm={() => handleReview('VERIFIED')}
                isLoading={isProcessing}
                variant="default"
                title={`Verify ${isIndividual ? 'Identity' : 'Organization'}`}
                description={`Establish ${profile.legalName} as a verified ${isIndividual ? 'individual advocate' : 'registered partner'}? This grants permission to launch public causes on the discovery feed.`}
                confirmText="Confirm Verification"
                cancelText="Cancel Audit"
            />
        </motion.div>
    );
});