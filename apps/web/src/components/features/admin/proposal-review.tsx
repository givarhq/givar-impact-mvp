'use client';

import React, { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
    Check, X, FileText, Calendar, DollarSign, User,
    AlertTriangle, MapPin, ExternalLink,
    ShieldAlert, CheckCircle2, ClipboardList, Image as ImageIcon,
    AlertCircle, ShieldCheck, ListChecks, Landmark, Search, Quote, Loader2, Phone
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { ApiService } from '../../../services/api';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate, formatCurrency } from '../../../lib/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ProjectProposal } from '../../../types';
import { cn } from '../../../lib/utils/cn';
import { FeedbackThread } from '../communication/feedback-thread';
import { motion } from 'framer-motion';
import { ImageLightbox, LightboxItem } from '../../ui/image-lightbox';
import { ConfirmModal } from '../../ui/confirm-modal';

interface ProposalReviewProps {
    proposal: ProjectProposal;
}

const AssistiveChecklist = ({ title, items }: { title: string, items: string[] }) => {
    const [checked, setChecked] = useState<Record<number, boolean>>({});

    return (
        <div className="space-y-3 p-4 rounded-2xl bg-muted/20 border border-border/40 shadow-inner">
            <h4 className="text-xs font-bold text-foreground">{title}</h4>
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

    const [awarenessStatus, setAwarenessStatus] = useState((proposal as any).awarenessStatus || '');

    // Subaccount Routing State
    const [subaccountModal, setSubaccountModal] = useState<{ isOpen: boolean; itemId: string | null; vendorName: string }>({ isOpen: false, itemId: null, vendorName: '' });
    const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
    const [isBankLoading, setIsBankLoading] = useState(false);
    const [bankCode, setBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [isCreatingSubaccount, setIsCreatingSubaccount] = useState(false);

    const budgetBreakdown = proposal.budgetBreakdown || [];
    const budgetTotal = budgetBreakdown.reduce((sum, item) => sum + (item.amount || item.cost || 0), 0);

    const isTerminalState = proposal.status === 'APPROVED' || proposal.status === 'REJECTED';

    // Load Banks for Subaccount Generation
    useEffect(() => {
        if (!isTerminalState && banks.length === 0) {
            setIsBankLoading(true);
            ApiService.admin.getPaystackBanks()
                .then(res => setBanks(res || []))
                .catch(() => toast.error("Failed to load banking network"))
                .finally(() => setIsBankLoading(false));
        }
    }, [isTerminalState, banks.length]);

    const handleCreateSubaccount = async () => {
        if (!bankCode || !accountNumber || !businessName) {
            return toast.error('All fields are required');
        }

        setIsCreatingSubaccount(true);
        const toastId = toast.loading('Verifying vendor account & generating secure routing code...');

        try {
            const res = await ApiService.admin.createPaystackSubaccount({
                businessName,
                bankCode,
                accountNumber
            });

            await ApiService.admin.bindProposalSubaccount(proposal.id, subaccountModal.itemId!, res.subaccount_code);

            toast.success(`Gateway established: ${res.subaccount_code}`, { id: toastId });
            setSubaccountModal({ isOpen: false, itemId: null, vendorName: '' });
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Vendor bank verification failed', { id: toastId });
        } finally {
            setIsCreatingSubaccount(false);
        }
    };

    const handleAwarenessChange = async (val: string) => {
        setAwarenessStatus(val);
        const toastId = toast.loading('Saving status...');
        try {
            await ApiService.admin.updateAwarenessStatus(proposal.id, val);
            toast.success('Operational status updated', { id: toastId });
        } catch (e) {
            toast.error('Failed to update status', { id: toastId });
        }
    };

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
        const unboundItems = proposal.budgetBreakdown?.filter((b: any) => !b.vendorSubaccount);
        if (unboundItems && unboundItems.length > 0) {
            toast.error("Strict Non-Custodial Policy: Bind a vendor subaccount to every budget item before launching.");
            setShowApproveConfirm(false);
            return;
        }

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
            toast.dismiss(toastId);
            const isDoc = key.toLowerCase().includes('.pdf') || key.toLowerCase().includes('.doc');
            if (isDoc) {
                window.open(viewUrl, '_blank');
            } else {
                setLightboxState({
                    isOpen: true,
                    items: [{ url: viewUrl, type: 'IMAGE', alt: 'Secure document' }],
                    index: 0
                });
            }
        } catch (e) {
            toast.error('Access denied', { id: toastId });
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

    const displayStatus = proposal.status === 'CHANGES_REQUESTED' ? 'More info required' : proposal.status.replace(/_/g, ' ');

    const missingDocs = !proposal.kycDocuments || proposal.kycDocuments.length === 0;
    const inconsistentInfo = budgetTotal * 100 !== Number(proposal.targetAmount);
    const titleLower = proposal.title?.toLowerCase() || '';
    const duplicateRisk = titleLower.includes('test') || titleLower.length < 10;

    const displayCategory = proposal.subcategoryName
        ? `${proposal.category?.name} • ${proposal.subcategoryName}`
        : (proposal.category?.name || 'General Impact');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "circOut" }}
            className="space-y-4 md:space-y-6 pb-20 w-full overflow-hidden"
        >
            {/* Header & Meta */}
            <div className="flex flex-col bg-card p-5 md:p-6 rounded-3xl border border-border/40 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-5 relative z-10 w-full min-w-0">
                    <div className="hidden md:flex h-14 w-14 rounded-3xl bg-primary/10 items-center justify-center text-primary border border-primary/20 shrink-0 shadow-inner">
                        <ClipboardList className="h-7 w-7" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="rounded-3xl px-2.5 py-0.5 font-bold text-[10px] bg-muted border-none text-muted-foreground tracking-tight">
                                {displayCategory}
                            </Badge>
                            <h1 className="text-lg font-bold text-foreground truncate max-w-full leading-tight">
                                {proposal.title || 'Untitled Project Proposal'}
                            </h1>
                            <Badge variant="outline" className={cn("rounded-3xl px-2.5 py-0.5 font-bold text-[11px] border shrink-0 tracking-tight", statusColor)}>
                                {displayStatus}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground mt-1.5">
                            <span className="flex items-center gap-1 shrink-0"><Calendar className="h-3.5 w-3.5" /> {formatDate(proposal.submittedAt).split(',')[0]}</span>
                            <span className="hidden sm:inline text-border">|</span>
                            <span className="flex items-center gap-1 shrink-0"><MapPin className="h-3.5 w-3.5 text-primary" /> {proposal.location || 'Global Location'}</span>
                            <span className="hidden sm:inline text-border">|</span>
                            <span className="flex items-center gap-1 shrink-0 font-mono bg-muted/30 px-2 py-0.5 rounded-3xl border border-border/40">id: {proposal.id.split('-')[0]}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* LEFT COLUMN: Main Proposal Content */}
                <div className="lg:col-span-8 space-y-4 md:space-y-6">
                    {/* Visual Media Section */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                                <ImageIcon className="h-4 w-4 text-primary" /> Visual Assets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="relative aspect-video bg-black md:border-r border-border/40 overflow-hidden">
                                    {proposal.videoUrl ? (
                                        <video
                                            src={proposal.videoUrl}
                                            controls
                                            className="w-full h-full object-contain"
                                            poster={proposal.coverImage || undefined}
                                        />
                                    ) : proposal.coverImage ? (
                                        <Image
                                            src={proposal.coverImage}
                                            alt="Hero"
                                            fill
                                            sizes="(max-width: 768px) 100vw, 600px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground/30 text-xs font-bold">Pending media</div>
                                    )}
                                </div>
                                <div className="p-6 flex flex-col justify-center bg-card/50">
                                    <h4 className="text-xs font-bold text-primary mb-1.5 tracking-tight">Elevator Pitch</h4>
                                    <p className="text-sm leading-relaxed text-foreground font-medium italic">
                                        &quot;{proposal.shortDesc || "No elevator pitch provided for this proposal."}&quot;
                                    </p>
                                    {proposal.gallery && (proposal.gallery as any[]).length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-[11px] font-bold text-muted-foreground mb-2 tracking-tight">Supporting Gallery</h4>
                                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                                {(proposal.gallery as any[]).map((item, i) => (
                                                    <button key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxState({ isOpen: true, items: (proposal.gallery as any[]).map(g => ({ url: g.url, type: g.type, alt: g.caption })), index: i }); }} className="relative h-12 w-12 rounded-2xl bg-muted border border-border/40 overflow-hidden shrink-0 hover:ring-2 ring-primary/20 transition-all shadow-sm active:scale-95">
                                                        <Image
                                                            src={item.url}
                                                            alt={`Gallery ${i}`}
                                                            fill
                                                            sizes="48px"
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
                            <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                                <FileText className="h-4 w-4 text-blue-500" /> Full Narrative
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            {proposal.personalMessage && (
                                <div className="bg-primary/[0.03] border border-primary/20 rounded-3xl p-5 relative overflow-hidden">
                                    <Quote className="absolute -top-2 -left-2 h-16 w-16 text-primary/10 -rotate-12" />
                                    <div className="relative z-10 pl-2 space-y-1.5">
                                        <h4 className="text-[11px] font-bold text-primary tracking-tight">
                                            Message From Organizer
                                        </h4>
                                        <p className="text-sm md:text-base text-foreground/90 font-medium leading-relaxed italic">
                                            "{proposal.personalMessage}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            {proposal.description ? (
                                <div
                                    className={cn(
                                        "text-sm text-foreground/80 leading-relaxed max-w-none break-words",
                                        "[&_h2]:font-bold [&_h2]:text-foreground[&_h2]:text-lg [&_h2]:mt-6 [&_h2]:mb-3",
                                        "[&_h3]:font-bold [&_h3]:text-foreground [&_h3]:text-base [&_h3]:mt-5 [&_h3]:mb-2",
                                        "[&_p]:mb-4[&_p]:last:mb-0",
                                        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5 [&_ul]:text-foreground/80 [&_ul_li::marker]:text-primary/70",
                                        "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5[&_ol]:text-foreground/80",
                                        "[&_li]:pl-1",
                                        "[&_strong]:font-bold [&_strong]:text-foreground",
                                        "[&_em]:italic",
                                        "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 transition-colors",
                                        "[&_blockquote]:border-l-4[&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:py-2[&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:bg-primary/[0.02] [&_blockquote]:rounded-r-xl",
                                        "[&_hr]:border-border/40 [&_hr]:my-6"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: proposal.description }}
                                />
                            ) : (
                                <p className="text-xs text-muted-foreground font-medium italic">
                                    The proposer has not yet provided a detailed mission narrative.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Beneficiary & Pre-Collected Funds Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className={cn(
                            "rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm flex flex-col h-full",
                            !proposal.hasPreCollectedFunds && "md:col-span-2"
                        )}>
                            <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6 shrink-0">
                                <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                                    <User className="h-4 w-4 text-primary" /> Beneficiary Context
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col justify-between flex-1 min-h-0">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[11px] font-bold text-muted-foreground mb-0.5">Full name</p>
                                        <p className="text-sm font-bold text-foreground">{proposal.beneficiaryName || 'Not provided'}</p>
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
                                </div>

                                <div className="pt-5 mt-5 border-t border-border/40 shrink-0">
                                    <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block">Beneficiary awareness status</label>
                                    <Select value={awarenessStatus} onValueChange={handleAwarenessChange} disabled={isTerminalState}>
                                        <SelectTrigger className="h-10 rounded-2xl bg-muted/20 border-border/60 text-xs font-bold focus:ring-primary/20 transition-all">
                                            <SelectValue placeholder="Select operational status..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border/40 shadow-xl">
                                            <SelectItem value="Confirmed" className="text-xs font-bold py-2">Confirmed</SelectItem>
                                            <SelectItem value="Unable to confirm due to medical condition" className="text-xs font-bold py-2">Unable to confirm (Medical)</SelectItem>
                                            <SelectItem value="Requires follow-up" className="text-xs font-bold py-2 text-amber-600">Requires follow-up</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pre-Collected Funds */}
                        {proposal.hasPreCollectedFunds && (
                            <Card className="rounded-3xl border-blue-500/20 bg-blue-500/[0.02] overflow-hidden shadow-sm flex flex-col h-full">
                                <CardHeader className="bg-blue-500/5 border-b border-blue-500/10 py-4 px-6 flex flex-row items-center justify-between shrink-0">
                                    <CardTitle className="text-sm font-bold text-blue-700 flex items-center gap-2 tracking-tight">
                                        <Landmark className="h-4 w-4" /> Pre-Collected Funds
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 flex flex-col justify-between flex-1 min-h-0 gap-5">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-muted-foreground">Amount raised externally</p>
                                        <p className="text-2xl font-black text-foreground">
                                            <SmartCurrency amount={(proposal.preCollectedAmount || '0').toString()} currency="NGN" visible={true} size="large" />
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium pt-1">
                                            Held at: <span className="font-bold text-foreground">{proposal.preCollectedHeldAt || 'Unknown'}</span>
                                        </p>
                                    </div>
                                    {proposal.preCollectedProofKey && (
                                        <Button onClick={() => viewSecureDoc(proposal.preCollectedProofKey!)} variant="outline" className="rounded-3xl font-bold text-xs h-10 border-blue-500/30 text-blue-700 hover:bg-blue-50 w-full mt-auto">
                                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View proof document
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Financial Budget Section */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                                <DollarSign className="h-4 w-4 text-emerald-500" /> Use of Funds
                            </CardTitle>
                            <div className="flex items-center gap-2 bg-background border border-border/60 px-3 py-1 rounded-3xl shadow-sm">
                                <span className="text-[11px] font-bold text-muted-foreground">Total:</span>
                                <SmartCurrency amount={(budgetTotal * 100).toString()} currency="NGN" visible={true} size="small" className="text-foreground" />
                            </div>
                        </CardHeader>
                        <div className="p-0 overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[650px]">
                                <thead className="bg-muted/10 text-[11px] font-bold text-muted-foreground border-b border-border/40 tracking-tight">
                                    <tr>
                                        <th className="px-6 py-4">Item & recipient</th>
                                        <th className="px-6 py-4">Routing setup</th>
                                        <th className="px-6 py-4 text-right">Allocation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 text-xs font-medium">
                                    {budgetBreakdown.length > 0 ? (
                                        budgetBreakdown.map((item, i) => (
                                            <tr key={item.id || i} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-foreground text-xs">{item.description || item.item}</div>
                                                    <div className="text-[11px] text-muted-foreground mt-1.5 flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="px-2 py-0 h-4 text-[10px] bg-muted/60 border-none shadow-none font-semibold">{item.costType || item.type}</Badge>
                                                            <span>To: <span className="font-bold">{item.payTo || item.vendor || 'Pending vendor sourcing'}</span></span>
                                                        </div>
                                                        {item.vendorContact && (
                                                            <div className="flex items-center gap-1 mt-0.5 opacity-80">
                                                                <Phone className="h-3 w-3 shrink-0" />
                                                                <span className="font-bold">{item.vendorContact}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.vendorSubaccount ? (
                                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 w-fit">
                                                            <ShieldCheck className="h-3.5 w-3.5" /> {item.vendorSubaccount}
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setBusinessName(item.payTo || item.vendor || '');
                                                                setBankCode('');
                                                                setAccountNumber('');
                                                                setSubaccountModal({ isOpen: true, itemId: item.id as string, vendorName: item.payTo || item.vendor || '' });
                                                            }}
                                                            className="h-8 text-[11px] font-bold rounded-xl px-3 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-sm"
                                                            disabled={isTerminalState}
                                                        >
                                                            <Landmark className="h-3 w-3 mr-1.5" /> Bind account
                                                        </Button>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-foreground tabular-nums font-bold text-sm">
                                                    {formatCurrency(((item.amount || item.cost || 0) * 100).toString(), 'NGN')}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground italic text-xs">No budget items provided.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* ACTION TERMINAL AT BOTTOM OF LEFT COLUMN */}
                    <Card className={cn(
                        "rounded-3xl border-2 shadow-sm overflow-hidden mt-8 transition-all",
                        isTerminalState ? "bg-muted/10 border-border/40" : "border-primary/20 bg-primary/[0.02]"
                    )}>
                        <CardContent className="p-6 md:p-8 flex flex-col items-center text-center gap-5">
                            {!isTerminalState ? (
                                <>
                                    <div className="space-y-1.5">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary shadow-inner border border-primary/20">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight">Final Decision</h3>
                                        <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                                            Please ensure you have reviewed all narrative details, financial structures, and have bound the necessary vendor subaccounts before approving.
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-lg mx-auto mt-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" onClick={() => setActionType('reject')} className="w-full sm:flex-1 h-11 px-6 rounded-3xl text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 font-bold text-xs transition-all active:scale-95">
                                                    Reject
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-3xl p-6 md:p-8 border-none shadow-2xl bg-card max-w-md">
                                                <DialogHeader><DialogTitle className="text-base font-bold text-destructive">Reject Proposal</DialogTitle></DialogHeader>
                                                <div className="space-y-5 pt-2">
                                                    <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 flex items-start gap-3">
                                                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                                        <p className="text-xs text-destructive font-medium leading-relaxed">This action is final. The proposal will be archived and the owner notified.</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-muted-foreground ml-1">Rejection reason</label>
                                                        <Input
                                                            placeholder="State the basis for this decision..."
                                                            value={feedback}
                                                            onChange={(e) => setFeedback(e.target.value)}
                                                            className="h-10 rounded-2xl text-sm"
                                                        />
                                                    </div>
                                                    <Button variant="destructive" onClick={handleDecision} disabled={isProcessing} className="w-full h-11 rounded-3xl font-bold text-xs shadow-md border-0">
                                                        Finalize rejection
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" onClick={() => setActionType('changes')} className="w-full sm:flex-1 h-11 px-6 rounded-3xl border-border/60 text-foreground font-bold text-xs transition-all active:scale-95 bg-background shadow-sm hover:bg-muted">
                                                    Request info
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-3xl p-6 md:p-8 border-none shadow-2xl bg-card max-w-md">
                                                <DialogHeader><DialogTitle className="text-base font-bold text-foreground">Feedback Narrative</DialogTitle></DialogHeader>
                                                <div className="space-y-5 pt-2">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-muted-foreground ml-1">Audit instructions</label>
                                                        <textarea
                                                            className="w-full h-28 rounded-2xl border border-border bg-muted/20 p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                                                            placeholder="Specify the additional information required..."
                                                            value={feedback}
                                                            onChange={(e) => setFeedback(e.target.value)}
                                                        />
                                                    </div>
                                                    <Button onClick={handleDecision} disabled={isProcessing} className="w-full h-11 rounded-3xl font-bold text-xs shadow-lg shadow-primary/20 border-0">
                                                        Submit feedback
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <Button
                                            onClick={() => setShowApproveConfirm(true)}
                                            disabled={isProcessing}
                                            className="w-full sm:w-auto h-11 px-8 rounded-3xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs text-white gap-2 border-0 transition-all active:scale-95 shrink-0"
                                        >
                                            <Check className="h-4 w-4" /> Verify & launch
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3 w-full flex flex-col items-center">
                                    <div className={cn(
                                        "h-12 w-12 rounded-full flex items-center justify-center shadow-inner mb-1",
                                        proposal.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                                    )}>
                                        {proposal.status === 'APPROVED' ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-lg font-bold text-foreground tracking-tight">Decision logged</h3>
                                        <p className="text-xs font-medium text-muted-foreground">This proposal has been permanently {proposal.status.toLowerCase()}.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>

                {/* RIGHT SIDEBAR: IDENTITY, AUDIT CHECKLISTS & RISK */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Proposer Information Card */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-3.5 px-5">
                            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                                <User className="h-3.5 w-3.5 text-primary" /> Proposer identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-border/40 shadow-inner group">
                                <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground font-black text-xs border border-border/10 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                    {proposal.user?.firstName[0]}{proposal.user?.lastName[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold text-foreground truncate">{proposal.user?.firstName} {proposal.user?.lastName}</div>
                                    <div className="text-[11px] text-muted-foreground truncate font-medium opacity-80">{proposal.user?.email}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Integrated Dialogue Hub */}
                    <FeedbackThread proposalId={proposal.id} title="Verification updates" />

                    {/* Compliance Asset Vault */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-3.5 px-5">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Cause evidence vault
                                </CardTitle>
                                <Badge variant="secondary" className="text-[10px] font-bold rounded-2xl px-2 h-5 bg-background shadow-sm border-border/40">
                                    {proposal.kycDocuments?.length || 0} Records
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 space-y-2">
                            {(proposal.kycDocuments as string[])?.length > 0 ? (
                                (proposal.kycDocuments as string[]).map((doc, i) => (
                                    <button
                                        key={i}
                                        onClick={() => viewSecureDoc(doc)}
                                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/40 hover:bg-primary/5 hover:border-primary/20 transition-all group active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="h-8 w-8 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm border border-border/50 shrink-0 group-hover:border-primary/20">
                                                <FileText className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">Legal record {i + 1}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono opacity-60 truncate mt-0.5">Secure link</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-border/40 rounded-2xl bg-muted/5">
                                    <AlertCircle className="h-6 w-6 mx-auto text-destructive/40 mb-2" />
                                    <p className="text-[10px] font-bold text-muted-foreground">Vault empty</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Admin Cause Review Framework Checklists */}
                    {!isTerminalState && (
                        <Card className="rounded-3xl border-primary/20 bg-primary/[0.02] overflow-hidden shadow-sm">
                            <CardHeader className="bg-primary/5 border-b border-primary/10 py-4 px-5">
                                <CardTitle className="text-xs font-bold text-primary flex items-center gap-2 tracking-tight">
                                    <ListChecks className="h-3.5 w-3.5" /> Admin Review Framework
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <p className="text-[11px] text-primary/70 font-bold mb-2 text-center tracking-tight">Assistive checklists</p>

                                <AssistiveChecklist
                                    title="Beneficiary Verification"
                                    items={["Identity document validity", "Details match submission", "Beneficiary existence reasonably confirmed", "Guardian verification if minor"]}
                                />
                                <AssistiveChecklist
                                    title="Vendor Verification"
                                    items={["Vendor details exist in Budget", "Invoice authenticity", "Cost reasonableness", "Payment routing feasibility", "Vendor contact tested and verified"]}
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
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-5">
                            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                                <Search className="h-3.5 w-3.5 text-amber-500" /> Risk indicators
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    {missingDocs ? <AlertTriangle className="h-4 w-4 text-destructive shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                                    <span className={cn("text-xs font-bold leading-tight", missingDocs ? "text-destructive" : "text-foreground")}>Missing documentation</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    {inconsistentInfo ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                                    <span className={cn("text-xs font-bold leading-tight", inconsistentInfo ? "text-amber-600" : "text-foreground")}>Inconsistent information</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    {duplicateRisk ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                                    <span className={cn("text-xs font-bold leading-tight", duplicateRisk ? "text-amber-600" : "text-foreground")}>Duplicate submission risk</span>
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
                description={`Promote the proposal "${proposal.title}" to a live platform project? Ensure all necessary vendor subaccounts have been bound to the budget phases.`}
                confirmText="Approve"
            />

            {/* ADMIN SUBACCOUNT CREATION DIALOG */}
            <Dialog open={subaccountModal.isOpen} onOpenChange={(isOpen) => !isOpen && !isCreatingSubaccount && setSubaccountModal({ isOpen: false, itemId: null, vendorName: '' })}>
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-card p-6 md:p-8 max-w-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground tracking-tight">
                            <Landmark className="h-5 w-5 text-primary" /> Bind Vendor Account
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">Destination bank</label>
                            <Select value={bankCode} onValueChange={setBankCode} disabled={isCreatingSubaccount || isBankLoading}>
                                <SelectTrigger className="h-11 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-xs">
                                    <SelectValue placeholder={isBankLoading ? "Loading banks..." : "Select destination bank..."} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-xl max-h-64">
                                    {banks.map(bank => (
                                        <SelectItem key={bank.code} value={bank.code} className="text-xs py-2.5 font-bold">
                                            {bank.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">NUBAN account number</label>
                            <Input
                                placeholder="10-digit account number"
                                maxLength={10}
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                disabled={isCreatingSubaccount}
                                className="h-11 rounded-2xl bg-muted/20 border-border/60 focus:bg-background font-mono font-bold text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">Registered business name</label>
                            <Input
                                placeholder="Official name matching bank records"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                disabled={isCreatingSubaccount}
                                className="h-11 rounded-2xl bg-muted/20 border-border/60 focus:bg-background font-bold text-sm"
                            />
                        </div>

                        <div className="pt-3">
                            <Button
                                onClick={handleCreateSubaccount}
                                disabled={isCreatingSubaccount || !bankCode || accountNumber.length !== 10 || !businessName}
                                className="w-full h-11 rounded-3xl font-bold text-xs shadow-lg shadow-primary/20 border-0 bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all"
                            >
                                {isCreatingSubaccount ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & generate route"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ImageLightbox
                isOpen={lightboxState.isOpen}
                onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
                items={lightboxState.items}
                initialIndex={lightboxState.index}
            />
        </motion.div>
    );
});