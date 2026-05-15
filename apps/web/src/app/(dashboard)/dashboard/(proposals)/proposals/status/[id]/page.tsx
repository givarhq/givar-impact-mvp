import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ApiService } from '../../../../../../../services/api';
import { Button } from '../../../../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../../components/ui/card';
import { Badge } from '../../../../../../../components/ui/badge';
import { FeedbackThread } from '../../../../../../../components/features/communication/feedback-thread';
import { formatCurrency } from '../../../../../../../lib/utils/format';
import {
    ArrowLeft, Clock, CheckCircle2, AlertCircle,
    FileSearch, ShieldCheck, Check, Fingerprint,
    FileText, ArrowRight, Briefcase, Calendar
} from 'lucide-react';
import { cn } from '../../../../../../../lib/utils/cn';

export const metadata = {
    title: 'Cause Status',
    description: 'Track the verification and review status of your proposed cause.',
};

export default async function ProposalStatusPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) redirect('/login');

    try {
        const proposal = await ApiService.proposals.get(id, token);

        if (!proposal) {
            notFound();
        }

        // Structural Extraction for Context View
        const rawBudget = Array.isArray(proposal.budgetBreakdown) ? proposal.budgetBreakdown : [];
        // Sort budget items chronologically
        const STAGE_ORDER = ['Early Stage', 'Main Stage', 'Final Stage'];
        const budget = [...rawBudget].sort((a, b) => {
            const idxA = STAGE_ORDER.indexOf(a.stage || 'Main Stage');
            const idxB = STAGE_ORDER.indexOf(b.stage || 'Main Stage');
            return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
        });

        const vendors = Array.isArray((proposal as any).vendors) ? (proposal as any).vendors : [];
        const timeline = Array.isArray(proposal.executionTimeline) ? proposal.executionTimeline : [];
        const budgetTotal = budget.reduce((sum: number, item: any) => sum + (item.amount || item.cost || 0), 0);

        // Logic: Construct the current stage logic
        const currentStatus = proposal.status;

        const isIdentityPending = currentStatus === 'AWAITING_VERIFICATION';
        const isTechnicalReview = currentStatus === 'SUBMITTED' || currentStatus === 'UNDER_REVIEW' || currentStatus === 'CHANGES_REQUESTED';
        const isFinalized = currentStatus === 'APPROVED' || currentStatus === 'REJECTED';

        const stages = [
            {
                label: 'Cause Submitted',
                desc: 'Submission received',
                icon: FileText,
                isCompleted: true,
                isActive: false
            },
            {
                label: 'Identity Audit',
                desc: 'Verifying advocate profile',
                icon: ShieldCheck,
                isCompleted: isTechnicalReview || isFinalized,
                isActive: isIdentityPending
            },
            {
                label: 'Technical Review',
                desc: 'Evaluating implementation plan',
                icon: FileSearch,
                isCompleted: isFinalized,
                isActive: isTechnicalReview
            },
            {
                label: 'Final Decision',
                desc: currentStatus === 'APPROVED' ? 'Approved & Live' : currentStatus === 'REJECTED' ? 'Rejected' : 'Pending outcome',
                icon: currentStatus === 'APPROVED' ? CheckCircle2 : currentStatus === 'REJECTED' ? XCircle : CheckCircle2,
                isCompleted: isFinalized,
                isActive: isFinalized
            }
        ];

        let actionRequired = null;

        if (currentStatus === 'CHANGES_REQUESTED') {
            actionRequired = {
                title: 'Additional Details Required',
                description: 'The review team has requested updates to your cause before it can be approved.',
                feedback: proposal.adminFeedback,
                link: `/dashboard/proposals/edit/${id}/hook`,
                buttonText: 'Edit Cause',
                icon: AlertCircle,
                color: 'amber'
            };
        } else if (currentStatus === 'AWAITING_VERIFICATION') {
            actionRequired = {
                title: 'Identity Verification Pending',
                description: 'Your cause is paused. You must complete the organization verification process to proceed.',
                link: `/dashboard/settings?tab=verification`,
                buttonText: 'Complete Verification',
                icon: ShieldCheck,
                color: 'blue'
            };
        } else if (currentStatus === 'REJECTED') {
            actionRequired = {
                title: 'Cause Declined',
                description: 'This cause was not approved for publication on the platform.',
                feedback: proposal.adminFeedback,
                link: `/dashboard/proposals`,
                buttonText: 'Return to Dashboard',
                icon: AlertCircle,
                color: 'destructive'
            };
        }

        const getStatusColor = (status: string) => {
            switch (status) {
                case 'APPROVED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
                case 'REJECTED': return 'bg-destructive/10 text-destructive border-destructive/20';
                case 'CHANGES_REQUESTED': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
                case 'AWAITING_VERIFICATION': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
                default: return 'bg-primary/10 text-primary border-primary/20';
            }
        };

        const displayStatus = currentStatus === 'CHANGES_REQUESTED' ? 'ACTION REQUIRED' : currentStatus.replace(/_/g, ' ');

        return (
            <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 pb-20">

                <div className="flex flex-col gap-4 px-1 min-w-0">
                    <Link href="/dashboard/proposals" className="w-fit">
                        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl">
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to My Causes
                        </Button>
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 min-w-0">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">
                                {proposal.title || 'Untitled Cause'}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-3xl font-bold text-[11px]  border", getStatusColor(currentStatus))}>
                                    {displayStatus}
                                </Badge>
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-3xl bg-muted border border-border/40 text-[11px] font-mono text-muted-foreground shrink-0">
                                    <Fingerprint className="h-3 w-3" />
                                    {id.split('-')[0]}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start min-w-0">
                    <div className="lg:col-span-8 space-y-6 min-w-0">

                        {/* Action Required Banner */}
                        {actionRequired && (
                            <Card className={cn(
                                "rounded-3xl border shadow-sm overflow-hidden animate-in slide-in-from-top-2",
                                actionRequired.color === 'amber' ? "bg-amber-50/50 border-amber-200" :
                                    actionRequired.color === 'blue' ? "bg-blue-50/50 border-blue-200" :
                                        "bg-destructive/5 border-destructive/20"
                            )}>
                                <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                                        actionRequired.color === 'amber' ? "bg-amber-100 text-amber-600" :
                                            actionRequired.color === 'blue' ? "bg-blue-100 text-blue-600" :
                                                "bg-destructive/10 text-destructive"
                                    )}>
                                        <actionRequired.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <h3 className={cn(
                                            "text-base font-bold",
                                            actionRequired.color === 'amber' ? "text-amber-900" :
                                                actionRequired.color === 'blue' ? "text-blue-900" :
                                                    "text-destructive"
                                        )}>
                                            {actionRequired.title}
                                        </h3>
                                        <p className={cn(
                                            "text-xs font-medium leading-relaxed",
                                            actionRequired.color === 'amber' ? "text-amber-800" :
                                                actionRequired.color === 'blue' ? "text-blue-800" :
                                                    "text-destructive/80"
                                        )}>
                                            {actionRequired.description}
                                        </p>
                                        {actionRequired.feedback && (
                                            <div className={cn(
                                                "mt-3 p-3 rounded-2xl text-xs italic font-medium border-l-4",
                                                actionRequired.color === 'amber' ? "bg-amber-100/50 border-amber-400 text-amber-900" :
                                                    "bg-destructive/10 border-destructive text-destructive"
                                            )}>
                                                "{actionRequired.feedback}"
                                            </div>
                                        )}
                                    </div>
                                    <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                                        <Link href={actionRequired.link} className="block w-full">
                                            <Button
                                                className={cn(
                                                    "w-full sm:w-auto h-11 rounded-3xl font-bold text-xs shadow-md border-0 active:scale-95 transition-all",
                                                    actionRequired.color === 'amber' ? "bg-amber-500 hover:bg-amber-600 text-white" :
                                                        actionRequired.color === 'blue' ? "bg-blue-600 hover:bg-blue-700 text-white" :
                                                            "bg-destructive hover:bg-destructive/90 text-white"
                                                )}
                                            >
                                                {actionRequired.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Budget Breakdown Summary */}
                        {budget.length > 0 && (
                            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden mb-6 animate-in slide-in-from-bottom-2 duration-500">
                                <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                                        <Briefcase className="h-4 w-4 text-emerald-500" /> Implementation Plan
                                    </CardTitle>
                                    <div className="flex items-center gap-2 bg-background border border-border/60 px-3 py-1 rounded-3xl shadow-sm">
                                        <span className="text-[11px] font-bold text-muted-foreground">Total:</span>
                                        <span className="text-foreground text-xs font-bold tabular-nums">
                                            {formatCurrency((budgetTotal * 100).toString(), proposal.currency || 'NGN')}
                                        </span>
                                    </div>
                                </CardHeader>
                                <div className="p-0 overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[550px]">
                                        <thead className="bg-muted/10 text-[11px] font-bold text-muted-foreground border-b border-border/40 tracking-tight">
                                            <tr>
                                                <th className="px-6 py-4">Item</th>
                                                <th className="px-6 py-4 hidden md:table-cell">Recipient</th>
                                                <th className="px-6 py-4 hidden sm:table-cell">Amount</th>
                                                <th className="px-6 py-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40 text-xs font-medium">
                                            {budget.map((item: any, i: number) => {
                                                const vendor = item.vendorId ? vendors.find((v: any) => v.id === item.vendorId) : null;
                                                const vendorName = vendor ? vendor.name : (item.payTo || item.vendor || 'Pending vendor sourcing');
                                                const isPendingVendor = !vendorName || vendorName.toLowerCase() === 'pending vendor sourcing' || vendorName === 'To be confirmed';

                                                return (
                                                    <tr key={item.id || i} className="hover:bg-muted/10 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-foreground text-xs">{item.description || item.item}</div>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <Badge variant="secondary" className="px-2 py-0 h-4 text-[10px] bg-muted/60 border-none shadow-none font-semibold">
                                                                    {item.costType || item.type}
                                                                </Badge>
                                                                <span className="text-[10px] font-bold text-muted-foreground tracking-tight px-2 border-l border-border/60">{item.stage || 'Main Stage'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {isPendingVendor ? (
                                                                <span className="text-amber-600 font-bold text-[11px] bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm whitespace-nowrap">
                                                                    To be confirmed
                                                                </span>
                                                            ) : (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-bold text-foreground">{vendorName}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono text-foreground tabular-nums font-bold text-sm">
                                                            {formatCurrency(((item.amount || item.cost || 0) * 100).toString(), proposal.currency || 'NGN')}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-border/40 shadow-none gap-1 py-1 px-3 rounded-3xl whitespace-nowrap"><Clock className="h-3.5 w-3.5" /> Upcoming</Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-muted/20 border-t border-border/40 text-xs text-muted-foreground font-medium text-center italic">
                                    If a phase is pending a recipient, use the message thread to provide the details to Givar.
                                </div>
                            </Card>
                        )}

                        {/* Execution Roadmap Summary */}
                        {timeline.length > 0 && (
                            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden mb-6 animate-in slide-in-from-bottom-3 duration-500">
                                <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                                    <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                                        <Clock className="h-4 w-4 text-blue-500" /> Execution Roadmap
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border/40">
                                        {timeline.map((phase: any, index: number) => (
                                            <div key={phase.id || index} className="p-5 flex items-start gap-4 hover:bg-muted/10 transition-colors">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                                                    {index + 1}
                                                </div>
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <h4 className="font-bold text-sm text-foreground">{phase.phase}</h4>
                                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">{phase.deliverables}</p>
                                                    {phase.estimatedDate && phase.estimatedDate !== 'TBD' && (
                                                        <div className="text-[10px] font-bold text-muted-foreground/80 mt-1.5 flex items-center gap-1.5">
                                                            <Calendar className="h-3 w-3" /> Target: {new Date(phase.estimatedDate).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="lg:col-span-4 space-y-6 min-w-0">
                        <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden min-w-0">
                            <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-5 md:py-5 md:px-6 min-w-0">
                                <CardTitle className="text-xs font-bold text-muted-foreground  flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" /> Application Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 md:p-6 pt-5 md:pt-6">
                                <div className="space-y-6 relative min-w-0">
                                    <div className="absolute left-[15px] top-1 bottom-1 w-px bg-border/60" />

                                    {stages.map((stage, i) => {
                                        const isDone = stage.isCompleted;
                                        const isCurrent = stage.isActive;
                                        const StageIcon = stage.icon;

                                        return (
                                            <div key={i} className="flex gap-5 relative group min-w-0">
                                                <div className="flex flex-col items-center shrink-0 z-10">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-background shadow-sm",
                                                        isDone ? "bg-emerald-50 border-emerald-500 text-emerald-600" :
                                                            isCurrent ? "border-primary text-primary ring-4 ring-primary/10" :
                                                                "border-border text-muted-foreground/40"
                                                    )}>
                                                        {isDone ? <Check className="h-4 w-4" /> : <StageIcon className="h-3.5 w-3.5" />}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 pt-1 space-y-0.5">
                                                    <h4 className={cn("font-bold text-sm truncate", isDone || isCurrent ? "text-foreground" : "text-muted-foreground")}>
                                                        {stage.label}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                                        {stage.desc}
                                                    </p>
                                                    {isCurrent && currentStatus === 'UNDER_REVIEW' && i === 2 && (
                                                        <div className="mt-2 text-[11px] font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-200 w-fit animate-pulse">
                                                            Review in progress
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Communication Panel moved here to create the 2x2 grid */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0">
                            <FeedbackThread
                                proposalId={proposal.id}
                                title="Verification Updates"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        notFound();
    }
}

// Fallback for missing icon
function XCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </svg>
    )
}