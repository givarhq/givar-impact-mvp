import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Clock,
    Database,
    ShieldCheck,
    TrendingUp,
    FileX,
    FileSearch,
    Check,
    ChevronRight,
    Megaphone,
    Target,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { EvidenceSubmission } from '../../../../../../components/features/proposals/evidence-submission';
import { cn } from '../../../../../../lib/utils/cn';
import { formatCurrency, formatDate } from '../../../../../../lib/utils/format';
import { ReceiptButton } from '../../../../../../components/features/proposals/receipt-button';
import { FeedbackThread } from '../../../../../../components/features/communication/feedback-thread';
import { ProjectUpdate } from '../../../../../../types';

export const metadata = {
    title: 'Project Console',
    description: 'Track project execution, verify vendor disbursements, and upload impact evidence.',
};

export default async function ProjectManagePage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ milestoneId?: string }>
}) {
    const { id } = await params;
    const { milestoneId: focusedMilestoneId } = await searchParams;
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;
    if (!token) redirect('/login');

    const project = await ApiService.projects.getOwnerView(id, token);
    if (!project) notFound();

    const timeline = Array.isArray(project.executionTimeline) ? project.executionTimeline : [];
    const budget = Array.isArray(project.budgetBreakdown) ? project.budgetBreakdown : [];
    const updates: ProjectUpdate[] = Array.isArray(project.updates) ? project.updates : [];

    const currentPhaseIndex = project.currentPhaseIndex || 0;

    const defaultMilestone = timeline[currentPhaseIndex] || timeline[timeline.length - 1];

    const currentMilestone = focusedMilestoneId
        ? timeline.find((m: any) => m.id === focusedMilestoneId)
        : defaultMilestone;

    const isFullyCompleted = timeline.every((m: any) => m.status === 'COMPLETED');
    const latestProof = project.milestoneProofs?.find((p: any) => p.milestoneId === currentMilestone?.id);
    const isRejected = latestProof?.status === 'REJECTED';
    const isPendingAudit = latestProof?.status === 'PENDING';

    const isMedical = project.category?.name?.toLowerCase() === 'medical';
    const completedText = isMedical ? 'Treatment Completed' : 'Impact Achieved';

    const finalReport = updates.find((u: ProjectUpdate) => u.type === 'IMPACT_ACHIEVED');
    const otherUpdates = updates.filter((u: ProjectUpdate) => u.type !== 'IMPACT_ACHIEVED');

    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-24">

            <div className="flex flex-col gap-4 px-1 min-w-0">
                <Link href="/dashboard/proposals" className="w-fit">
                    <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to My Causes
                    </Button>
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 min-w-0">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                            {project.title}
                        </h1>
                        <div className="flex items-center gap-2 mt-2 min-w-0">
                            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold text-[11px] rounded-3xl px-2.5 truncate max-w-full">
                                Management Console
                            </Badge>
                            {isFullyCompleted && (
                                <Badge className="bg-emerald-500 text-white font-bold text-[11px] rounded-3xl border-0 shrink-0">{completedText}</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start min-w-0">

                <div className="lg:col-span-8 space-y-6 min-w-0">
                    <div id="submit-evidence" className="scroll-mt-32" />

                    {finalReport && (
                        <Card className="rounded-3xl border-emerald-500/20 bg-emerald-500/[0.03] shadow-sm overflow-hidden animate-in slide-in-from-top-2 min-w-0">
                            <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/10 py-4 px-6 flex flex-row items-center gap-3 min-w-0">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                <CardTitle className="text-sm font-bold text-emerald-800 truncate">Final impact report</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-6 min-w-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center min-w-0">
                                    <div className="space-y-3 min-w-0">
                                        <h4 className="text-lg font-bold text-emerald-950 leading-tight break-words">{finalReport.title}</h4>
                                        <p className="text-sm text-emerald-900/80 font-medium leading-relaxed break-words">
                                            {finalReport.content}
                                        </p>
                                    </div>
                                    {finalReport.imageUrl && (
                                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-500/20 shadow-md min-w-0">
                                            <Image src={finalReport.imageUrl} alt="Impact" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {isRejected && (
                        <div className="p-5 rounded-3xl bg-destructive/5 border border-destructive/10 flex items-start gap-4 animate-in slide-in-from-top-2 min-w-0">
                            <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0 shadow-inner">
                                <FileX className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <h4 className="text-sm font-bold text-destructive leading-none truncate">Evidence rejected</h4>
                                <p className="text-sm text-foreground/80 font-medium italic break-words">
                                    &quot;{latestProof.adminFeedback}&quot;
                                </p>
                            </div>
                        </div>
                    )}

                    {!isFullyCompleted && currentMilestone ? (
                        isPendingAudit ? (
                            <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm min-w-0">
                                <CardHeader className="border-b border-border/40 p-6 md:p-8 bg-muted/10 min-w-0">
                                    <CardTitle className="text-base font-bold flex items-center gap-3 truncate text-foreground">
                                        <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                                        <span className="truncate">Proof under review</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8 space-y-4 min-w-0">
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                        Your proof for this phase has been received and is currently being audited by the Givar team. You will be notified once it is verified.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm min-w-0 border-2 hover:border-primary/30 transition-colors">
                                <CardHeader className="border-b border-border/40 p-6 md:p-8 bg-muted/10 min-w-0">
                                    <div className="flex items-center justify-between gap-4 min-w-0">
                                        <CardTitle className="text-base font-bold flex items-center gap-3 truncate text-foreground">
                                            <Camera className={cn("h-5 w-5 shrink-0", isRejected ? "text-destructive" : "text-primary")} />
                                            <span className="truncate">{isRejected ? 'Resubmit proof' : `Upload proof for Phase ${timeline.findIndex((t: any) => t.id === currentMilestone.id) + 1}`}</span>
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8 min-w-0">
                                    <EvidenceSubmission
                                        key={currentMilestone.id}
                                        projectId={id}
                                        milestone={{ ...currentMilestone, index: timeline.findIndex((t: any) => t.id === currentMilestone.id) }}
                                    />
                                </CardContent>
                            </Card>
                        )
                    ) : isFullyCompleted && !finalReport ? (
                        <Card className="rounded-3xl border-emerald-500/20 bg-emerald-500/[0.02] p-10 text-center border-2 border-dashed min-w-0">
                            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">{completedText}</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed font-medium">
                                Every phase of this cause has been executed and verified. The Givar team is preparing your final impact report.
                            </p>
                        </Card>
                    ) : null}

                    {otherUpdates.length > 0 && (
                        <div className="space-y-4 min-w-0">
                            <div className="flex items-center gap-3 px-1 min-w-0">
                                <Megaphone className="h-4 w-4 text-primary shrink-0" />
                                <h4 className="text-sm font-bold text-foreground truncate">Project updates</h4>
                            </div>
                            <div className="grid gap-3 min-w-0">
                                {otherUpdates.map((update) => (
                                    <Card key={update.id} className="rounded-3xl border-border/40 bg-card p-5 shadow-sm min-w-0">
                                        <div className="flex justify-between items-start gap-4 min-w-0">
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <Badge variant="secondary" className="text-[10px] font-bold rounded-3xl bg-muted border-none mb-1">
                                                    {update.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                                                </Badge>
                                                <h5 className="text-sm font-bold text-foreground truncate">{update.title}</h5>
                                                <p className="text-sm text-muted-foreground font-medium leading-relaxed break-words">{update.content}</p>
                                            </div>
                                            <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap shrink-0">{formatDate(update.createdAt).split(',')[0]}</span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    <Card className="rounded-3xl border-border/40 bg-card/30 shadow-sm overflow-hidden min-w-0">
                        <CardHeader className="p-6 md:p-8 pb-2 min-w-0">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground truncate">
                                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                                Phased Execution Roadmap
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 pt-4 min-w-0">
                            <div className="space-y-8 relative min-w-0">
                                <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-border/60" />
                                {timeline.map((m: any, i: number) => {
                                    const isDone = m.status === 'COMPLETED';
                                    const isCurrent = i === currentPhaseIndex;
                                    const isLocked = i > currentPhaseIndex;

                                    const bItem = budget[i] || {};
                                    const cost = bItem.amount || bItem.cost || 0;

                                    // Calculate if phase is fully funded
                                    let phaseCumulativeMajor = 0;
                                    for (let j = 0; j <= i; j++) {
                                        phaseCumulativeMajor += (budget[j].amount || budget[j].cost || 0);
                                    }
                                    const phaseCapMinor = BigInt(phaseCumulativeMajor * 100);
                                    const isPhaseFunded = BigInt(project.raisedAmount) >= phaseCapMinor;

                                    let badgeText = 'Locked';
                                    let badgeStyle = 'bg-muted/30 border-border/60 text-muted-foreground';

                                    if (isDone) {
                                        badgeText = 'Verified';
                                        badgeStyle = 'text-emerald-600 bg-emerald-50 border-emerald-100';
                                    } else if (isPhaseFunded) {
                                        badgeText = 'Funded';
                                        badgeStyle = 'text-amber-600 bg-amber-50 border-amber-100';
                                    } else if (isCurrent) {
                                        badgeText = 'Funding';
                                        badgeStyle = 'text-primary bg-primary/5 border-primary/20';
                                    }

                                    return (
                                        <div key={i} className={cn("flex gap-4 md:gap-6 relative min-w-0 group transition-opacity", isLocked && "opacity-50")}>
                                            <div className="flex flex-col items-center shrink-0 z-10">
                                                <div className={cn(
                                                    "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-background shadow-sm",
                                                    isDone ? "bg-primary border-primary text-white" :
                                                        isCurrent ? "border-primary text-primary ring-4 ring-primary/10" :
                                                            "border-border text-muted-foreground"
                                                )}>
                                                    {isDone ? <Check className="h-4 w-4 stroke-[3px]" /> : <span className="text-xs font-bold">{i + 1}</span>}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 pb-2">
                                                <div className="flex justify-between items-baseline gap-4 min-w-0">
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-primary mb-0.5 truncate">Phase {i + 1}</p>
                                                        <h4 className={cn("font-bold text-sm truncate", isDone || isCurrent ? "text-foreground" : "text-muted-foreground")}>
                                                            {m.phase}
                                                        </h4>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0 text-right">
                                                        <span className="text-sm font-bold text-foreground tabular-nums">
                                                            {formatCurrency((cost * 100).toString(), project.currency)}
                                                        </span>
                                                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2.5 py-0.5 mt-1 rounded-3xl shrink-0 border shadow-none", badgeStyle)}>
                                                            {badgeText}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="mt-3 p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-1.5 min-w-0">
                                                    <p className="text-xs font-bold text-muted-foreground">Expected deliverable</p>
                                                    <p className="text-sm text-foreground/80 leading-relaxed font-medium break-words">{m.deliverables}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0">
                        <FeedbackThread
                            projectId={project.id}
                            title="Verification Updates"
                        />
                    </div>
                </div>

                {/* --- RIGHT SIDEBAR REMAINS UNCHANGED --- */}
                <div className="lg:col-span-4 space-y-6 min-w-0">
                    <Card className="rounded-3xl border-border/40 bg-primary/5 p-6 border-2 border-dashed min-w-0 shadow-inner">
                        <div className="flex items-start gap-4 min-w-0">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/10">
                                <Target className="h-6 w-6" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <p className="text-xs font-bold text-primary leading-none">Phased Funding</p>
                                <p className="text-sm text-muted-foreground leading-relaxed font-medium break-words">
                                    Donations are securely held and automatically assigned to the current active phase.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-3xl border-border/40 shadow-sm bg-card overflow-hidden min-w-0">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6 min-w-0">
                            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2 truncate">
                                <Database className="h-4 w-4" /> Disbursement history
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3 min-w-0">
                            {project.disbursements?.length > 0 ? (
                                project.disbursements.map((d: any) => {
                                    const satisfactionStatus = d.satisfactionStatus || 'ACTION_REQUIRED';
                                    const isVerified = satisfactionStatus === 'VERIFIED';
                                    const isAuditing = satisfactionStatus === 'AUDITING';

                                    const phaseIndex = timeline.findIndex((t: any) => t.id === d.milestoneId);
                                    const phaseName = phaseIndex !== -1 ? `Phase ${phaseIndex + 1}` : 'General';

                                    let bottomSection = (
                                        <div className={cn(
                                            "mt-2 -mx-4 -mb-4 px-4 py-3 border-t border-border/40 flex justify-between items-center min-w-0",
                                            !isVerified && !isAuditing && "cursor-pointer hover:bg-primary/5 transition-all"
                                        )}>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-foreground truncate">
                                                    <span className="text-muted-foreground font-medium">Vendor:</span> {d.vendorName}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground font-bold truncate mt-0.5">
                                                    {phaseName}
                                                </p>
                                            </div>
                                            {!isVerified && !isAuditing && (
                                                <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                                            )}
                                        </div>
                                    );

                                    if (!isVerified && !isAuditing) {
                                        bottomSection = (
                                            <Link href={`?milestoneId=${d.milestoneId}#submit-evidence`} className="block min-w-0">
                                                {bottomSection}
                                            </Link>
                                        );
                                    }

                                    return (
                                        <div key={d.id} className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-3 min-w-0 hover:border-primary/20 transition-all">
                                            <div className="flex justify-between items-start gap-2 min-w-0">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-primary truncate">Outflow</p>
                                                    <span className="text-[11px] font-mono text-muted-foreground truncate">{formatDate(d.createdAt).split(',')[0]}</span>
                                                </div>

                                                {isVerified ? (
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-bold h-6 px-2.5 rounded-3xl shrink-0 shadow-none">
                                                        <Check className="h-3 w-3 mr-1" /> Verified
                                                    </Badge>
                                                ) : isAuditing ? (
                                                    <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold h-6 px-2.5 rounded-3xl shrink-0 animate-pulse shadow-none">
                                                        <FileSearch className="h-3 w-3 mr-1" /> Audit
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] font-bold h-6 px-2.5 rounded-3xl shrink-0 shadow-none">
                                                        <AlertCircle className="h-3 w-3 mr-1" /> Required
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-end gap-4 min-w-0">
                                                <p className="text-base font-bold text-foreground tabular-nums truncate">
                                                    {formatCurrency(d.amount, project.currency)}
                                                </p>
                                                {d.receiptKey && (
                                                    <ReceiptButton receiptKey={d.receiptKey} projectId={project.id} className="h-8 px-4 rounded-xl border-border/40 text-[11px]" />
                                                )}
                                            </div>

                                            {bottomSection}
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-12 min-w-0">
                                    <Clock className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                                    <p className="text-[11px] text-muted-foreground italic font-medium">Awaiting first treasury disbursement.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="p-5 rounded-3xl bg-muted/10 border border-dashed border-border/60 flex items-start gap-3 min-w-0">
                        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium break-words">
                            Vendor coordination issues? Contact Givar directly via the support terminal.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}