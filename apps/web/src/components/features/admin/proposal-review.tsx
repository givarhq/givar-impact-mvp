'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    Check, X, FileText, Calendar, DollarSign, User, Phone,
    Building, AlertTriangle, MessageSquare, Clock, MapPin,
    ExternalLink, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { ApiService } from '../../../services/api';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate } from '../../../lib/utils/format';
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

    return (
        <>
            <div className="space-y-6 pb-20">

                {/* --- 1. HEADER & META --- */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 p-1">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                {proposal.id.split('-')[0]}
                            </Badge>
                            <Badge variant="secondary" className={cn(
                                "text-[10px] border",
                                proposal.status === 'APPROVED'
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            )}>
                                {proposal.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Submitted {formatDate(proposal.submittedAt)}
                            </span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">{proposal.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {proposal.category?.name}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {proposal.location}</span>
                        </div>
                    </div>
                </div>

                {/* --- 2. THE 2-COLUMN LAYOUT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                    {/* === LEFT COLUMN: SCOPE & FINANCIALS === */}
                    <div className="space-y-6">

                        {/* Visual & Summary */}
                        <Card className="overflow-hidden border-border/60 shadow-sm bg-card">
                            <div className="aspect-video w-full bg-muted relative">
                                {proposal.coverImage ? (
                                    <img src={proposal.coverImage} alt="Cover" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No Cover Image</div>
                                )}
                            </div>
                            <CardContent className="p-5 space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Summary</h4>
                                    <p className="text-sm leading-relaxed text-foreground/90">{proposal.shortDesc}</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Media Gallery</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(proposal.gallery as any[])?.map((item, i) => (
                                            <div key={i} className="aspect-square rounded-lg bg-muted border border-border overflow-hidden relative group cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                                                <img src={item.url} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Full Description */}
                        <Card className="border-border/60 shadow-sm bg-card">
                            <CardHeader className="py-4 px-5 border-b border-border/50">
                                <CardTitle className="text-sm font-bold">Project Description</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 prose prose-sm dark:prose-invert max-w-none text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                {proposal.description}
                            </CardContent>
                        </Card>

                        {/* Budget */}
                        <Card className="border-border/60 shadow-sm bg-card">
                            <CardHeader className="py-4 px-5 border-b border-border/50 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-emerald-500" /> Budget Breakdown
                                </CardTitle>
                                <Badge variant="outline" className="font-mono">
                                    Total: <SmartCurrency amount={(budgetTotal * 100).toString()} currency="NGN" visible={true} size="small" />
                                </Badge>
                            </CardHeader>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/30 text-muted-foreground">
                                        <tr>
                                            <th className="p-3 pl-5 font-medium">Item</th>
                                            <th className="p-3 font-medium">Type</th>
                                            <th className="p-3 font-medium">Vendor</th>
                                            <th className="p-3 pr-5 text-right font-medium">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {(proposal.budgetBreakdown as any[])?.map((item, i) => (
                                            <tr key={i} className="hover:bg-muted/10">
                                                <td className="p-3 pl-5 font-medium">{item.item}</td>
                                                <td className="p-3 text-muted-foreground text-[10px] uppercase">{item.type}</td>
                                                <td className="p-3 text-muted-foreground">{item.vendor}</td>
                                                <td className="p-3 pr-5 text-right font-mono">
                                                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(item.cost)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* === RIGHT COLUMN: EXECUTION, RISK & CONTROLS === */}
                    <div className="space-y-6">

                        {/* ACTIONS */}
                        <Card className={cn(
                            "border-border/60 shadow-lg bg-card ring-1 ring-primary/5",
                            isTerminalState && "bg-muted/5 shadow-none ring-0 border-dashed"
                        )}>
                            <CardContent className="p-5 space-y-3">
                                {!isTerminalState ? (
                                    <>
                                        <Button
                                            onClick={() => setShowApproveConfirm(true)}
                                            disabled={isProcessing}
                                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 rounded-xl"
                                        >
                                            <Check className="mr-2 h-4 w-4" /> Approve & Launch
                                        </Button>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-10 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 font-medium rounded-xl"
                                                    onClick={() => setActionType('changes')}
                                                >
                                                    <MessageSquare className="mr-2 h-4 w-4" /> Request Changes
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader><DialogTitle>Request Changes</DialogTitle></DialogHeader>
                                                <div className="space-y-4 pt-2">
                                                    <p className="text-sm text-muted-foreground">What needs to be fixed before this can be approved?</p>
                                                    <textarea
                                                        className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all min-h-[100px]"
                                                        placeholder="e.g., Upload a clearer ID, fix budget typos..."
                                                        value={feedback}
                                                        onChange={(e) => setFeedback(e.target.value)}
                                                    />
                                                    <Button onClick={handleDecision} disabled={isProcessing} className="w-full rounded-xl">Send Feedback</Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full h-9 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
                                                    onClick={() => setActionType('reject')}
                                                >
                                                    <X className="mr-2 h-4 w-4" /> Reject Proposal
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader><DialogTitle className="text-destructive">Reject Proposal</DialogTitle></DialogHeader>
                                                <div className="space-y-4 pt-2">
                                                    <p className="text-sm text-muted-foreground">This action is final. The user will have to start over.</p>
                                                    <Input
                                                        placeholder="Reason for rejection..."
                                                        value={feedback}
                                                        onChange={(e) => setFeedback(e.target.value)}
                                                        className="rounded-xl"
                                                    />
                                                    <Button variant="destructive" onClick={handleDecision} disabled={isProcessing} className="w-full rounded-xl">Confirm Rejection</Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </>
                                ) : (
                                    <div className="text-center py-4 space-y-3">
                                        <div className={cn(
                                            "h-12 w-12 rounded-full flex items-center justify-center mx-auto",
                                            proposal.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                                        )}>
                                            {proposal.status === 'APPROVED' ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">Audit Decision Finalized</p>
                                            <p className="text-xs text-muted-foreground">
                                                This proposal was {proposal.status.toLowerCase()} on {formatDate(proposal.approvedAt || proposal.updatedAt)}
                                            </p>
                                        </div>
                                        <Button variant="outline" className="w-full rounded-xl h-9 text-xs" onClick={() => router.push('/admin/projects?tab=proposals')}>
                                            Return to Pipeline
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Proposer Identity */}
                        <Card className="border-border/60 shadow-sm bg-card">
                            <CardHeader className="py-4 px-5 border-b border-border/50">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Proposer Identity</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                                        {proposal.user?.firstName[0]}{proposal.user?.lastName[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">{proposal.user?.firstName} {proposal.user?.lastName}</div>
                                        <div className="text-xs text-muted-foreground">{proposal.user?.email}</div>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5" /> {proposal.contactPhone || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Building className="h-3.5 w-3.5" /> {proposal.organizationName || 'Individual'}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* KYC Docs */}
                        <Card className="border-border/60 shadow-sm bg-card">
                            <CardHeader className="py-4 px-5 border-b border-border/50">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                                    <span>Verification Docs</span>
                                    <span className="text-primary">{proposal.kycDocuments?.length || 0} Files</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2">
                                <div className="space-y-1">
                                    {(proposal.kycDocuments as string[])?.map((doc, i) => (
                                        <Button
                                            key={i}
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start gap-2 h-9 text-xs font-normal"
                                            onClick={() => viewSecureDoc(doc)}
                                        >
                                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                                            Document {i + 1}
                                            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                                        </Button>
                                    ))}
                                    {(!proposal.kycDocuments || proposal.kycDocuments.length === 0) && (
                                        <p className="text-xs text-destructive p-3 text-center">No documents uploaded</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Risk Analysis */}
                        <Card className="border-border/60 shadow-sm bg-card">
                            <CardHeader className="py-4 px-5 border-b border-border/50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-amber-500" /> Risk Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 prose prose-sm dark:prose-invert max-w-none text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                {proposal.riskAnalysis || "No risks identified."}
                            </CardContent>
                        </Card>

                        {/* Execution Timeline */}
                        <Card className="border-border/60 shadow-sm bg-card">
                            <CardHeader className="py-4 px-5 border-b border-border/50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-500" /> Execution Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="space-y-6 relative pl-2">
                                    <div className="absolute top-2 bottom-2 left-[7px] w-px bg-border" />
                                    {(proposal.executionTimeline as any[])?.map((item, i) => (
                                        <div key={i} className="relative pl-6">
                                            <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background z-10" />
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-sm font-semibold text-foreground">{item.phase}</h5>
                                                <span className="text-[12px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.estimatedDate}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{item.deliverables}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showApproveConfirm}
                onClose={() => setShowApproveConfirm(false)}
                onConfirm={handleApprove}
                isLoading={isProcessing}
                title="Approve & Launch"
                description={`Promote "${proposal.title}" to a live project? This action will migrate all data to the public Discovery feed and is irreversible.`}
                confirmText="Launch Project"
            />
        </>
    );
}