'use client';

import React, { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
    Check, X, FileText, Calendar, DollarSign, User, Phone,
    Building, AlertTriangle, Clock, MapPin, ExternalLink,
    ShieldAlert, CheckCircle2, ClipboardList, Image as ImageIcon,
    AlertCircle, ShieldCheck, ListChecks, Landmark, Search
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { ApiService } from '../../../services/api';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate, formatCurrency } from '../../../lib/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { ConfirmModal } from '../../ui/confirm-modal';
import { Input } from '../../ui/input';
import { ProjectProposal } from '../../../types';
import { cn } from '../../../lib/utils/cn';
import { FeedbackThread } from '../communication/feedback-thread';
import { motion } from 'framer-motion';
import { ImageLightbox, LightboxItem } from '../../ui/image-lightbox';

interface ProposalReviewProps {
    proposal: ProjectProposal;
}

// Assistive Checklist Component
const AssistiveChecklist = ({ title, items }: { title: string, items: string[] }) => {
    const [checked, setChecked] = useState<Record<number, boolean>>({});

    return (
        <div className="space-y-3 p-4 rounded-2xl bg-muted/20 border border-border/40 shadow-inner">
            <h4 className="text-[11px] font-bold text-foreground">{title}</h4>
            <div className="space-y-2.5">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-start gap-3 cursor-pointer group"
                        onClick={() => setChecked(prev => ({ ...prev, [i]: !prev[i] }))}
                    >
                        <div className={cn(
                            "h-4 w-4 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                            checked[i] ? "bg-primary border-primary text-white" : "border-border/60 group-hover:border-primary/50"
                        )}>
                            {checked[i] && <Check className="h-3 w-3" />}
                        </div>
                        <span className={cn(
                            "text-xs font-medium leading-snug transition-colors",
                            checked[i] ? "text-muted-foreground line-through opacity-70" : "text-foreground"
                        )}>
                            {item}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ProposalReview = memo(function ProposalReview({ proposal }: ProposalReviewProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [actionType, setActionType] = useState<'reject' | 'changes' | null>(null);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; items: LightboxItem[]; index: number }>({ isOpen: false, items: [], index: 0 });

    const budgetBreakdown = proposal.budgetBreakdown || [];
    const budgetTotal = budgetBreakdown.reduce((sum, item) => sum + (item.amount || item.cost || 0), 0);

    const isTerminalState = proposal.status === 'APPROVED' || proposal.status === 'REJECTED';

    const handleDecision = async () => {
        if (!actionType) return;
        if (!feedback.trim()) return toast.error('Verification feedback is required');

        setIsProcessing(true);
        const toastId = toast.loading('Recording administrative decision...');
        try {
            if (actionType === 'reject') {
                await ApiService.admin.rejectProposal(proposal.id, feedback);
                toast.success('Proposal rejected', { id: toastId });
            } else {
                await ApiService.admin.requestChanges(proposal.id, feedback);
                toast.success('More info requested', { id: toastId });
            }
            router.push('/admin/projects?tab=proposals');
            router.refresh();
        } catch (e) {
            toast.error('Audit decision failed to sync', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprove = async () => {
        setIsProcessing(true);
        const toastId = toast.loading('Promoting proposal to live project...');
        try {
            await ApiService.admin.approveProposal(proposal.id);
            toast.success('Project successfully launched', { id: toastId });
            setShowApproveConfirm(false);
            router.push('/admin/projects?tab=live');
            router.refresh();
        } catch (error) {
            toast.error('Launch protocol failed', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const viewSecureDoc = async (key: string) => {
        const toastId = toast.loading('Decrypting asset...');
        try {
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, proposal.id);
            const isDoc = key.toLowerCase().includes('.pdf');
            setLightboxState({
                isOpen: true,
                items: [{ url: viewUrl, type: isDoc ? 'DOCUMENT' : 'IMAGE', alt: 'Secure Document' }],
                index: 0
            });
            toast.dismiss(toastId);
        } catch (e) {
            toast.error('Asset access denied', { id: toastId });
        }
    };

    const statusColor = {
        SUBMITTED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        UNDER_REVIEW: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        CHANGES_REQUESTED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
        DRAFT: 'bg-muted text-muted-foreground border-border/40',
        AWAITING_VERIFICATION: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
    }[proposal.status] || 'bg-muted';

    const displayStatus = proposal.status === 'CHANGES_REQUESTED' ? 'More Info Required' : proposal.status.replace(/_/g, ' ');

    // Dynamic Risk Evaluation
    const missingDocs = !proposal.kycDocuments || proposal.kycDocuments.length === 0;
    const vendorUnreachable = !proposal.vendorPhone && !proposal.vendorEmail;

    // Heuristic: Does the sum of the budget explicitly match the overall requested target?
    const inconsistentInfo = budgetTotal * 100 !== Number(proposal.targetAmount);

    // Heuristic: Is the title suspiciously short or does it match generic test patterns?
    const titleLower = proposal.title?.toLowerCase() || '';
    const duplicateRisk = titleLower.includes('test') || titleLower.length < 10;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "circOut" }}
            className="space-y-4 md:space-y-6 pb-20 w-full overflow-hidden"
        >
            {/* 1. CORE IDENTITY HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-card p-5 md:p-6 rounded-3xl border border-border/40 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-5 relative z-10 w-full lg:w-auto min-w-0">
                    <div className="hidden md:flex h-16 w-16 rounded-3xl bg-primary/10 items-center justify-center text-primary border border-primary/20 shrink-0 shadow-inner">
                        <ClipboardList className="h-8 w-8" />
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg font-bold text-foreground truncate max-w-full leading-tight">
                                {proposal.title || 'Untitled Project Proposal'}
                            </h1>
                            <Badge variant="outline" className={cn("rounded-3xl px-2.5 py-0.5 font-bold text-xs border shrink-0", statusColor)}>
                                {displayStatus}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1 shrink-0"><Calendar className="h-3.5 w-3.5" /> {formatDate(proposal.submittedAt).split(',')[0]}</span>
                            <span className="hidden sm:inline text-border">|</span>
                            <span className="flex items-center gap-1 shrink-0"><MapPin className="h-3.5 w-3.5 text-primary" /> {proposal.location || 'Global Location'}</span>
                            <span className="hidden sm:inline text-border">|</span>
                            <span className="flex items-center gap-1 shrink-0 font-mono bg-muted/30 px-2 py-0.5 rounded-3xl border border-border/40">ID: {proposal.id.split('-')[0]}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-auto relative z-10 pt-4 lg:pt-0 border-t lg:border-none border-border/40">
                    {!isTerminalState ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={() => setActionType('changes')} className="h-11 px-6 rounded-3xl border-border/60 text-foreground font-bold text-xs transition-all active:scale-95">
                                        Request More Info
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-3xl p-8 border-none shadow-2xl bg-card">
                                    <DialogHeader><DialogTitle className="text-lg font-bold">Feedback Narrative</DialogTitle></DialogHeader>
                                    <div className="space-y-6 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground ml-1">Audit Instructions</label>
                                            <textarea
                                                className="w-full h-32 rounded-3xl border border-border bg-muted/20 p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                                                placeholder="Specify the additional information required..."
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                            />
                                        </div>
                                        <Button onClick={handleDecision} disabled={isProcessing} className="w-full h-12 rounded-3xl font-bold text-xs shadow-lg shadow-primary/20 border-0">
                                            Submit Feedback
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Button
                                onClick={() => setShowApproveConfirm(true)}
                                disabled={isProcessing}
                                className="h-11 px-8 rounded-3xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs text-white gap-2 border-0 transition-all active:scale-95"
                            >
                                <Check className="h-4 w-4" /> Verify & Launch
                            </Button>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setActionType('reject')} className="h-11 w-11 rounded-3xl text-destructive hover:bg-destructive/10 hidden sm:flex border border-transparent hover:border-destructive/20">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-3xl p-8 border-none shadow-2xl bg-card">
                                    <DialogHeader><DialogTitle className="text-lg font-bold text-destructive">Reject Proposal</DialogTitle></DialogHeader>
                                    <div className="space-y-6 pt-4">
                                        <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                                            <p className="text-xs text-destructive font-medium leading-relaxed">This action is final. The proposal will be archived and the owner notified.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground ml-1">Rejection Reason</label>
                                            <Input
                                                placeholder="State the basis for this decision..."
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                className="h-12 rounded-3xl"
                                            />
                                        </div>
                                        <Button variant="destructive" onClick={handleDecision} disabled={isProcessing} className="w-full h-12 rounded-3xl font-bold text-xs shadow-md border-0">
                                            Finalize Rejection
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 px-5 py-2 bg-muted/20 rounded-3xl border border-border/40 w-full sm:w-auto justify-center shadow-inner">
                            <span className="text-xs font-bold text-muted-foreground">Decision Logged</span>
                            {proposal.status === 'APPROVED' ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> : <ShieldAlert className="h-4.5 w-4.5 text-destructive" />}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. GRID ARCHITECTURE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

                {/* LEFT: DETAILED DOCUMENTATION */}
                <div className="lg:col-span-8 space-y-4 md:space-y-6">
                    {/* Visual Media Section */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                <ImageIcon className="h-3.5 w-3.5 text-primary" /> Visual Assets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="relative aspect-video bg-muted group overflow-hidden md:border-r border-border/40">
                                    {proposal.coverImage ? (
                                        <Image
                                            src={proposal.coverImage}
                                            alt="Hero"
                                            fill
                                            sizes="(max-width: 768px) 100vw, 600px"
                                            className="object-cover transition-transform group-hover:scale-105 duration-700"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground/30 text-xs font-bold">Pending Media</div>
                                    )}
                                </div>
                                <div className="p-6 md:p-8 flex flex-col justify-center bg-card/50">
                                    <h4 className="text-xs font-bold text-primary mb-2">Elevator Pitch</h4>
                                    <p className="text-sm md:text-base leading-relaxed text-foreground font-medium italic">
                                        &quot;{proposal.shortDesc || "No elevator pitch provided for this proposal."}&quot;
                                    </p>
                                    {proposal.gallery && (proposal.gallery as any[]).length > 0 && (
                                        <div className="mt-8">
                                            <h4 className="text-xs font-bold text-muted-foreground mb-3">Supporting Gallery</h4>
                                            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
                                                {(proposal.gallery as any[]).map((item, i) => (
                                                    <button key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxState({ isOpen: true, items: (proposal.gallery as any[]).map(g => ({ url: g.url, type: g.type, alt: g.caption })), index: i }); }} className="relative h-14 w-14 rounded-2xl bg-muted border border-border/40 overflow-hidden shrink-0 hover:ring-2 ring-primary/20 transition-all shadow-sm active:scale-95">
                                                        <Image
                                                            src={item.url}
                                                            alt={`Gallery ${i}`}
                                                            fill
                                                            sizes="56px"
                                                            className="object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Narrative Section */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-blue-500" /> Full Narrative
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            {proposal.description ? (
                                <div
                                    className={cn(
                                        "text-sm text-foreground/80 leading-relaxed max-w-none break-words",
                                        "[&_h2]:font-bold [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:mt-6 [&_h2]:mb-3",
                                        "[&_h3]:font-bold [&_h3]:text-foreground [&_h3]:text-base [&_h3]:mt-5 [&_h3]:mb-2",
                                        "[&_p]:mb-4 [&_p]:last:mb-0",
                                        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1.5 [&_ul]:text-foreground/80 [&_ul_li::marker]:text-primary/70",
                                        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1.5 [&_ol]:text-foreground/80",
                                        "[&_li]:pl-1",
                                        "[&_strong]:font-bold [&_strong]:text-foreground",
                                        "[&_em]:italic",
                                        "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 transition-colors",
                                        "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:bg-primary/[0.02] [&_blockquote]:rounded-r-xl",
                                        "[&_hr]:border-border/40 [&_hr]:my-6"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: proposal.description }}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground font-medium italic">
                                    The proposer has not yet provided a detailed mission narrative.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Beneficiary & Vendor Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                            <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                                <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-primary" /> Beneficiary Context
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <p className="text-[11px] font-bold text-muted-foreground mb-0.5">Full Name</p>
                                    <p className="text-sm font-bold text-foreground">{proposal.beneficiaryName || 'Not Provided'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[11px] font-bold text-muted-foreground mb-0.5">Age</p>
                                        <p className="text-sm font-bold text-foreground">{proposal.beneficiaryAge || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-muted-foreground mb-0.5">Relationship</p>
                                        <p className="text-sm font-bold text-foreground">{proposal.beneficiaryRelationship || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                            <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                                <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                    <Building className="h-3.5 w-3.5 text-blue-500" /> Vendor Provider
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <p className="text-[11px] font-bold text-muted-foreground mb-0.5">Organization</p>
                                    <p className="text-sm font-bold text-foreground">{proposal.vendorName || 'Not Provided'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[11px] font-bold text-muted-foreground mb-0.5">Contact Person</p>
                                        <p className="text-xs font-bold text-foreground truncate">{proposal.vendorContactPerson || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-muted-foreground mb-0.5">Phone</p>
                                        <p className="text-xs font-bold text-foreground truncate">{proposal.vendorPhone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-muted-foreground mb-0.5">Address</p>
                                    <p className="text-xs font-bold text-foreground">{proposal.vendorAddress || 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Financial Budget Section */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Use of Funds
                            </CardTitle>
                            <div className="flex items-center gap-2 bg-background border border-border/60 px-3 py-1 rounded-3xl shadow-sm">
                                <span className="text-[11px] font-bold text-muted-foreground">Total:</span>
                                <SmartCurrency amount={(budgetTotal * 100).toString()} currency="NGN" visible={true} size="small" className="text-foreground" />
                            </div>
                        </CardHeader>
                        <div className="p-0 overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/10 text-[11px] font-bold text-muted-foreground border-b border-border/40">
                                    <tr>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4 hidden md:table-cell">Cost Type</th>
                                        <th className="px-6 py-4 hidden md:table-cell">Pay To</th>
                                        <th className="px-6 py-4 hidden lg:table-cell">Stage</th>
                                        <th className="px-6 py-4 text-right">Allocation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 text-xs font-medium">
                                    {budgetBreakdown.length > 0 ? (
                                        budgetBreakdown.map((item, i) => (
                                            <tr key={i} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4 font-bold text-foreground">{item.description || item.item}</td>
                                                <td className="px-6 py-4 hidden md:table-cell text-muted-foreground text-[11px] font-bold">{item.costType || item.type}</td>
                                                <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">{item.payTo || item.vendor}</td>
                                                <td className="px-6 py-4 hidden lg:table-cell text-muted-foreground">
                                                    {item.stage ? <Badge variant="secondary" className="text-[9px] px-2 py-0 h-5 font-bold rounded-3xl shadow-none">{item.stage}</Badge> : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-foreground tabular-nums font-bold">
                                                    {formatCurrency(((item.amount || item.cost || 0) * 100).toString(), 'NGN')}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">No budget items provided.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Pre-Collected Funds */}
                    {proposal.hasPreCollectedFunds && (
                        <Card className="rounded-3xl border-blue-500/20 bg-blue-500/[0.02] overflow-hidden shadow-sm">
                            <CardHeader className="bg-blue-500/5 border-b border-blue-500/10 py-4 px-6 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-bold text-blue-700 flex items-center gap-2">
                                    <Landmark className="h-3.5 w-3.5" /> Pre-Collected Funds Declared
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-muted-foreground">Amount Raised Externally</p>
                                    <p className="text-xl font-black text-foreground">
                                        <SmartCurrency amount={((Number(proposal.preCollectedAmount) || 0) * 100).toString()} currency="NGN" visible={true} size="default" />
                                    </p>
                                    <p className="text-xs text-muted-foreground font-medium pt-1">
                                        Held at: <span className="font-bold text-foreground">{proposal.preCollectedHeldAt || 'Unknown'}</span>
                                    </p>
                                </div>
                                {proposal.preCollectedProofKey && (
                                    <Button onClick={() => viewSecureDoc(proposal.preCollectedProofKey!)} variant="outline" className="rounded-3xl font-bold text-xs h-10 border-blue-500/30 text-blue-700 hover:bg-blue-50">
                                        <ExternalLink className="h-4 w-4 mr-2" /> View Proof
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* RIGHT: IDENTITY, AUDIT CHECKLISTS & RISK */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Proposer Information Card */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-primary" /> Proposer Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/20 border border-border/40 shadow-inner group">
                                <div className="h-11 w-11 rounded-3xl bg-secondary flex items-center justify-center text-secondary-foreground font-black text-xs border border-border/10 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                    {proposal.user?.firstName[0]}{proposal.user?.lastName[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold text-foreground truncate">{proposal.user?.firstName} {proposal.user?.lastName}</div>
                                    <div className="text-xs text-muted-foreground truncate font-medium opacity-80">{proposal.user?.email}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Integrated Dialogue Hub */}
                    <FeedbackThread proposalId={proposal.id} title="Verification Updates" />

                    {/* Compliance Asset Vault */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Cause Evidence Vault
                                </CardTitle>
                                <Badge variant="secondary" className="text-[11px] font-bold rounded-3xl px-2.5 h-5 bg-background shadow-sm border-border/40">
                                    {proposal.kycDocuments?.length || 0} Records
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {(proposal.kycDocuments as string[])?.length > 0 ? (
                                (proposal.kycDocuments as string[]).map((doc, i) => (
                                    <button
                                        key={i}
                                        onClick={() => viewSecureDoc(doc)}
                                        className="w-full flex items-center justify-between p-3.5 rounded-3xl bg-muted/20 border border-border/40 hover:bg-primary/5 hover:border-primary/20 transition-all group active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-2xl bg-background flex items-center justify-center text-primary shadow-sm border border-border/50 shrink-0 group-hover:border-primary/20">
                                                <FileText className="h-4.5 w-4.5" />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">Legal Record {i + 1}</p>
                                                <p className="text-[11px] text-muted-foreground font-mono opacity-60 truncate">Secure Link</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                                    <AlertCircle className="h-7 w-7 mx-auto text-destructive/40 mb-2" />
                                    <p className="text-[11px] font-bold text-muted-foreground">Vault Empty</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Admin Cause Review Framework Checklists */}
                    {!isTerminalState && (
                        <Card className="rounded-3xl border-primary/20 bg-primary/[0.02] overflow-hidden shadow-sm">
                            <CardHeader className="bg-primary/5 border-b border-primary/10 py-4 px-6">
                                <CardTitle className="text-xs font-bold text-primary flex items-center gap-2">
                                    <ListChecks className="h-3.5 w-3.5" /> Admin Review Framework
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <p className="text-[11px] text-primary/70 font-bold mb-2 text-center">Assistive Checklists</p>

                                <AssistiveChecklist
                                    title="Beneficiary Verification"
                                    items={["Identity document validity", "Details match submission", "Beneficiary existence reasonably confirmed", "Guardian verification if minor"]}
                                />
                                <AssistiveChecklist
                                    title="Vendor Verification"
                                    items={["Vendor exists and contact details are valid", "Invoice authenticity", "Cost reasonableness", "Payment routing feasibility"]}
                                />
                                <AssistiveChecklist
                                    title="Cause Evidence"
                                    items={["Supporting documents sufficient", "Media aligns with narrative", "No major inconsistencies"]}
                                />
                                {proposal.hasPreCollectedFunds && (
                                    <AssistiveChecklist
                                        title="Pre-Collected Funds"
                                        items={["Proof of funds provided", "Amount verified", "Decision whether amount is included in tracker"]}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Risk Indicators */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                <Search className="h-3.5 w-3.5 text-amber-500" /> Risk Indicators
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    {missingDocs ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                    <span className={cn("text-xs font-bold", missingDocs ? "text-destructive" : "text-foreground")}>Missing documentation</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    {vendorUnreachable ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                    <span className={cn("text-xs font-bold", vendorUnreachable ? "text-amber-600" : "text-foreground")}>Vendor unreachable</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    {duplicateRisk ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                    <span className={cn("text-xs font-bold", duplicateRisk ? "text-amber-600" : "text-foreground")}>Duplicate submission risk</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    {inconsistentInfo ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                    <span className={cn("text-xs font-bold", inconsistentInfo ? "text-amber-600" : "text-foreground")}>Inconsistent information</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* LAUNCH CONFIRMATION OVERLAY */}
            <ConfirmModal
                isOpen={showApproveConfirm}
                onClose={() => setShowApproveConfirm(false)}
                onConfirm={handleApprove}
                isLoading={isProcessing}
                variant="default"
                title="Approve Impact?"
                description={`Promote the proposal "${proposal.title}" to a live platform project? This action migrates all narrative and financial data to the public discovery feed.`}
                confirmText="Approve"
            />

            <ImageLightbox
                isOpen={lightboxState.isOpen}
                onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
                items={lightboxState.items}
                initialIndex={lightboxState.index}
            />
        </motion.div>
    );
});