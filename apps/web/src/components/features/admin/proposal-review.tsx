'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    Check, X, FileText, Calendar, DollarSign, User, Phone,
    Building, AlertTriangle, MessageSquare, Clock, MapPin,
    ExternalLink, ShieldAlert, CheckCircle2, ClipboardList,
    Image as ImageIcon,
    AlertCircle,
    ShieldCheck
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

interface ProposalReviewProps {
    proposal: ProjectProposal;
}

export function ProposalReview({ proposal }: ProposalReviewProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [actionType, setActionType] = useState<'reject' | 'changes' | null>(null);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);

    const budgetTotal = (proposal.budgetBreakdown as any[])?.reduce((sum, item) => sum + item.cost, 0) || 0;

    // Determine if the proposal has reached a finalized state
    const isTerminalState = proposal.status === 'APPROVED' || proposal.status === 'REJECTED';

    const handleDecision = async () => {
        if (!actionType) return;
        if (!feedback) return toast.error('Feedback is required for this action');

        setIsProcessing(true);
        try {
            if (actionType === 'reject') {
                await ApiService.admin.rejectProposal(proposal.id, feedback);
                toast.success('Proposal Rejected');
            } else {
                await ApiService.admin.requestChanges(proposal.id, feedback);
                toast.success('Changes Requested');
            }
            router.push('/admin/projects?tab=proposals');
        } catch (e) {
            toast.error('Action failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            await ApiService.admin.approveProposal(proposal.id);
            toast.success('Project Launched Successfully!');
            setShowApproveConfirm(false);
            router.push('/admin/projects');
        } catch (error) {
            toast.error('Approval failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const viewSecureDoc = async (key: string) => {
        const toastId = toast.loading('Decrypting document...');
        try {
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, proposal.id);
            window.open(viewUrl, '_blank');
            toast.dismiss(toastId);
        } catch (e) {
            toast.error('Access Denied', { id: toastId });
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

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 pb-20 w-full overflow-hidden">

            {/* 1. HERO HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-card p-5 md:p-6 rounded-3xl border border-border/40 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-5 relative z-10 w-full lg:w-auto min-w-0">
                    <div className="hidden md:flex h-16 w-16 rounded-3xl bg-primary/10 items-center justify-center text-primary border border-primary/20 shrink-0">
                        <ClipboardList className="h-8 w-8" />
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground truncate max-w-full leading-tight">
                                {proposal.title || 'Untitled Proposal'}
                            </h1>
                            <Badge variant="outline" className={cn("rounded-3xl px-2.5 py-0.5 font-bold text-[11px] uppercase tracking-wider border shrink-0", statusColor)}>
                                {proposal.status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1 shrink-0"><Calendar className="h-3.5 w-3.5" /> {formatDate(proposal.submittedAt).split(',')[0]}</span>
                            <span className="hidden sm:inline text-border">|</span>
                            <span className="flex items-center gap-1 shrink-0"><MapPin className="h-3.5 w-3.5 text-primary" /> {proposal.location || 'Global'}</span>
                            <span className="hidden sm:inline text-border">|</span>
                            <span className="flex items-center gap-1 shrink-0 font-mono bg-muted/30 px-2 py-0.5 rounded-3xl border border-border/40">ID: {proposal.id.split('-')[0]}</span>
                        </div>
                    </div>
                </div>

                {/* Actions Row - Mobile optimized */}
                <div className="w-full lg:w-auto relative z-10 pt-4 lg:pt-0 border-t lg:border-none border-border/40">
                    {!isTerminalState ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={() => setActionType('changes')} className="h-11 px-6 rounded-3xl border-border/60 text-foreground font-bold text-xs">
                                        Request Changes
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-3xl p-8 border-none shadow-2xl">
                                    <DialogHeader><DialogTitle className="text-lg font-bold">Request Modifications</DialogTitle></DialogHeader>
                                    <div className="space-y-6 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-muted-foreground ml-1 uppercase">Feedback</label>
                                            <textarea
                                                className="w-full h-32 rounded-3xl border border-border bg-muted/20 p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                                placeholder="What needs to be fixed before approval?"
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                            />
                                        </div>
                                        <Button onClick={handleDecision} disabled={isProcessing} className="w-full h-12 rounded-3xl font-bold text-xs uppercase tracking-widest">
                                            Send Feedback
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Button
                                onClick={() => setShowApproveConfirm(true)}
                                disabled={isProcessing}
                                className="h-11 px-8 rounded-3xl font-bold bg-primary hover:bg-primary/90 shadow-sm text-xs text-white gap-2"
                            >
                                <Check className="h-4 w-4" /> Approve & Launch
                            </Button>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setActionType('reject')} className="h-11 w-11 rounded-3xl text-destructive hover:bg-destructive/10 hidden sm:flex">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-3xl p-8 border-none shadow-2xl">
                                    <DialogHeader><DialogTitle className="text-lg font-bold text-destructive">Reject Proposal</DialogTitle></DialogHeader>
                                    <div className="space-y-6 pt-4">
                                        <p className="text-xs text-muted-foreground font-medium">This action is final. The user will be notified and the proposal archived.</p>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-muted-foreground ml-1 uppercase">Reason</label>
                                            <Input
                                                placeholder="State reason for rejection..."
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                className="h-12 rounded-3xl"
                                            />
                                        </div>
                                        <Button variant="destructive" onClick={handleDecision} disabled={isProcessing} className="w-full h-12 rounded-3xl font-bold text-xs uppercase tracking-widest">
                                            Confirm Rejection
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Button
                                variant="ghost"
                                onClick={() => setActionType('reject')}
                                className="sm:hidden h-11 rounded-3xl text-destructive hover:bg-destructive/10 font-bold text-xs border border-destructive/20"
                            >
                                Reject Proposal
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 rounded-3xl border border-border/40 w-full sm:w-auto justify-center">
                            <span className="text-xs font-bold text-muted-foreground">Decision Finalized</span>
                            {proposal.status === 'APPROVED' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <ShieldAlert className="h-4 w-4 text-destructive" />}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

                {/* LEFT COLUMN: Data & Identity */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Visuals & Summary */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <ImageIcon className="h-3.5 w-3.5 text-primary" /> Visual Evidence
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="aspect-video bg-muted relative group overflow-hidden md:border-r border-border/40">
                                    {proposal.coverImage ? (
                                        <img src={proposal.coverImage} alt="Cover" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-medium">No Cover Image</div>
                                    )}
                                </div>
                                <div className="p-6 flex flex-col justify-center bg-card/50">
                                    <h4 className="text-xs font-bold text-foreground mb-2">Project summary</h4>
                                    <p className="text-sm leading-relaxed text-muted-foreground italic">
                                        &quot;{proposal.shortDesc || "No summary provided."}&quot;
                                    </p>
                                    {proposal.gallery && (proposal.gallery as any[]).length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-[11px] font-bold text-muted-foreground uppercase mb-3">Gallery Assets</h4>
                                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                                {(proposal.gallery as any[]).map((item, i) => (
                                                    <button key={i} onClick={() => window.open(item.url, '_blank')} className="h-12 w-12 rounded-xl bg-muted border border-border/40 overflow-hidden shrink-0 hover:ring-2 ring-primary/20 transition-all">
                                                        <img src={item.url} className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Description */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-blue-500" /> Full Proposal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 prose prose-sm dark:prose-invert max-w-none text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {proposal.description}
                        </CardContent>
                    </Card>

                    {/* Budget */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Budget Ledger
                            </CardTitle>
                            <Badge variant="outline" className="font-mono text-[11px] bg-background border-border/60 px-2 py-0.5 rounded-3xl">
                                Total: <SmartCurrency amount={(budgetTotal * 100).toString()} currency="NGN" visible={true} size="small" />
                            </Badge>
                        </CardHeader>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/10 text-[11px] font-bold uppercase text-muted-foreground border-b border-border/40">
                                    <tr>
                                        <th className="px-6 py-3">Item Description</th>
                                        <th className="px-6 py-3 hidden md:table-cell">Category</th>
                                        <th className="px-6 py-3 hidden md:table-cell">Vendor</th>
                                        <th className="px-6 py-3 text-right">Allocation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 text-xs font-medium">
                                    {(proposal.budgetBreakdown as any[])?.map((item, i) => (
                                        <tr key={i} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4 font-bold text-foreground">{item.item}</td>
                                            <td className="px-6 py-4 hidden md:table-cell text-muted-foreground uppercase text-[11px] font-bold tracking-wider">{item.type}</td>
                                            <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">{item.vendor}</td>
                                            <td className="px-6 py-4 text-right font-mono text-foreground tabular-nums">
                                                {formatCurrency((item.cost * 100).toString(), 'NGN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Timeline */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-purple-500" /> Execution Roadmap
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            <div className="space-y-8 relative pl-2">
                                <div className="absolute top-2 bottom-2 left-[7px] w-px bg-border/60" />
                                {(proposal.executionTimeline as any[])?.map((item, i) => (
                                    <div key={i} className="relative pl-8 group">
                                        <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-primary bg-background z-10 flex items-center justify-center transition-all group-hover:scale-110 shadow-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        </div>
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1">
                                            <div>
                                                <h5 className="text-sm font-semibold text-foreground">{item.phase}</h5>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.deliverables}</p>
                                            </div>
                                            <Badge variant="secondary" className="w-fit mt-2 md:mt-0 text-[11px] font-bold uppercase tracking-wider rounded-3xl bg-muted/50 border-border/40 text-muted-foreground">
                                                Due: {item.estimatedDate}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Meta & Controls */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Proposer Card */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-primary" /> Proposer Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/20 border border-border/40">
                                <div className="h-10 w-10 rounded-3xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs border border-border/10 shrink-0">
                                    {proposal.user?.firstName[0]}{proposal.user?.lastName[0]}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-foreground truncate">{proposal.user?.firstName} {proposal.user?.lastName}</div>
                                    <div className="text-[11px] text-muted-foreground truncate opacity-80">{proposal.user?.email}</div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-xs p-3 rounded-2xl bg-muted/10 border border-border/40">
                                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="font-medium truncate">{proposal.contactPhone || 'No Phone'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs p-3 rounded-2xl bg-muted/10 border border-border/40">
                                    <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="font-medium truncate">{proposal.organizationName || 'Individual'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KYC Docs */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verification
                                </CardTitle>
                                <Badge variant="secondary" className="text-[10px] font-bold rounded-3xl px-2">
                                    {proposal.kycDocuments?.length || 0} Files
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {(proposal.kycDocuments as string[])?.map((doc, i) => (
                                <button
                                    key={i}
                                    onClick={() => viewSecureDoc(doc)}
                                    className="w-full flex items-center justify-between p-3 rounded-3xl bg-muted/20 border border-border/40 hover:bg-primary/5 hover:border-primary/20 transition-all group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-8 w-8 rounded-3xl bg-background flex items-center justify-center text-primary shadow-sm border border-border/50 shrink-0 group-hover:border-primary/20">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">Document {i + 1}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono opacity-60 uppercase truncate">Secure View</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                </button>
                            ))}
                            {(!proposal.kycDocuments || proposal.kycDocuments.length === 0) && (
                                <div className="text-center py-6 border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                                    <AlertCircle className="h-6 w-6 mx-auto text-destructive/40 mb-2" />
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">No KYC Data</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Risks */}
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Risk Assessment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-medium bg-amber-500/[0.02]">
                            {proposal.riskAnalysis || "No specific risks identified by proposer."}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmModal
                isOpen={showApproveConfirm}
                onClose={() => setShowApproveConfirm(false)}
                onConfirm={handleApprove}
                isLoading={isProcessing}
                variant="default"
                title="Launch Project"
                description={`Promote "${proposal.title}" to a live project? This creates an active ledger node and migrates all proposal data to the public discovery feed. This action is irreversible.`}
                confirmText="Confirm Launch"
            />
        </div>
    );
}