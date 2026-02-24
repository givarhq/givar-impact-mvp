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
    AlertCircle,
    TrendingUp,
    FileX,
    FileSearch,
    Check,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { EvidenceSubmission } from '../../../../../../components/features/proposals/evidence-submission';
import { cn } from '../../../../../../lib/utils/cn';
import { formatCurrency, formatDate } from '../../../../../../lib/utils/format';
import { ReceiptButton } from '../../../../../../components/features/proposals/receipt-button';
import { FeedbackThread } from '../../../../../../components/features/communication/feedback-thread';

export const metadata = {
    title: 'Project Console',
    description: 'Track project execution, verify vendor disbursements, & upload impact evidence.',
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

    const defaultMilestone = timeline.find((m: any) => m.status === 'IN_PROGRESS') ||
        timeline.find((m: any) => m.status === 'PENDING');

    const currentMilestone = focusedMilestoneId
        ? timeline.find((m: any) => m.id === focusedMilestoneId)
        : defaultMilestone;

    const isFullyCompleted = timeline.every((m: any) => m.status === 'COMPLETED');
    const latestProof = project.milestoneProofs?.find((p: any) => p.milestoneId === currentMilestone?.id);
    const isRejected = latestProof?.status === 'REJECTED';

    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-24">

            {/* Header Identity */}
            <div className="flex flex-col gap-4 px-1 min-w-0">
                <Link href="/dashboard/proposals" className="w-fit">
                    <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to My Causes
                    </Button>
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 min-w-0">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-foreground truncate">
                            {project.title}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold  tracking-wider text-[10px] rounded-3xl px-2.5">
                                Management Console
                            </Badge>
                            {isFullyCompleted && (
                                <Badge className="bg-emerald-500 text-white font-bold text-[10px]  rounded-3xl border-0">Mission Complete</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start min-w-0">

                {/* LEFT: Action & Roadmap */}
                <div className="lg:col-span-8 space-y-4 md:space-y-6 min-w-0">
                    <div id="submit-evidence" className="scroll-mt-32" />

                    {isRejected && (
                        <div className="p-5 rounded-3xl bg-destructive/5 border border-destructive/10 flex items-start gap-4 animate-in slide-in-from-top-2">
                            <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0 shadow-inner">
                                <FileX className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <h4 className="text-xs font-bold text-destructive  tracking-widest leading-none">Evidence Rejected</h4>
                                <p className="text-sm text-foreground/80 font-medium italic">
                                    &quot;{latestProof.adminFeedback}&quot;
                                </p>
                            </div>
                        </div>
                    )}

                    {!isFullyCompleted && currentMilestone ? (
                        <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm min-w-0">
                            <CardHeader className="border-b border-border/40 p-6 md:p-8 bg-muted/10">
                                <div className="flex items-center justify-between gap-4 min-w-0">
                                    <CardTitle className="text-base font-bold flex items-center gap-3 truncate">
                                        <Camera className={cn("h-5 w-5 shrink-0", isRejected ? "text-destructive" : "text-primary")} />
                                        <span>{isRejected ? 'Resubmit Proof' : 'Post Impact Update'}</span>
                                    </CardTitle>
                                    <Badge variant="outline" className="rounded-3xl border-primary/20 bg-primary/5 text-primary font-bold text-[11px] shrink-0 ">
                                        {currentMilestone.phase}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8">
                                <EvidenceSubmission
                                    key={currentMilestone.id}
                                    projectId={id}
                                    milestone={currentMilestone}
                                />
                            </CardContent>
                        </Card>
                    ) : isFullyCompleted ? (
                        <Card className="rounded-3xl border-emerald-500/20 bg-emerald-500/[0.02] p-10 text-center border-2 border-dashed min-w-0">
                            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground tracking-tight">Mission Accomplished</h3>
                            <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed font-medium">
                                Every phase of this cause has been executed & verified. Thank you for your work on the ground.
                            </p>
                        </Card>
                    ) : null}

                    {/* Implementation Roadmap */}
                    <Card className="rounded-3xl border-border/40 bg-card/30 shadow-sm overflow-hidden min-w-0">
                        <CardHeader className="p-6 md:p-8 pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-widest text-muted-foreground">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                Execution Roadmap
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 pt-4 min-w-0">
                            <div className="space-y-8 relative min-w-0">
                                <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-border/60 hidden sm:block" />
                                {timeline.map((m: any, i: number) => {
                                    const isDone = m.status === 'COMPLETED';
                                    const isCurrent = m.id === currentMilestone?.id;
                                    return (
                                        <div key={i} className="flex gap-4 md:gap-6 relative min-w-0 group">
                                            <div className="flex flex-col items-center shrink-0 z-10">
                                                <div className={cn(
                                                    "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-background shadow-sm",
                                                    isDone ? "bg-primary border-primary text-white" :
                                                        isCurrent ? "border-primary text-primary ring-4 ring-primary/5" :
                                                            "border-border text-muted-foreground"
                                                )}>
                                                    {isDone ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 pb-2">
                                                <div className="flex items-center justify-between gap-4 min-w-0">
                                                    <h4 className={cn("font-bold text-sm truncate", isDone || isCurrent ? "text-foreground" : "text-muted-foreground")}>
                                                        {m.phase}
                                                    </h4>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px]  font-bold px-2 rounded-3xl shrink-0 border",
                                                        isDone ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "bg-muted/30 border-border/60 text-muted-foreground"
                                                    )}>
                                                        {m.status?.replace('_', ' ') || 'PENDING'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium line-clamp-2">{m.deliverables}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Direct Support Loop */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <FeedbackThread
                            projectId={project.id}
                            title="Direct line with the Givar team"
                        />
                    </div>
                </div>

                {/* RIGHT: Financials */}
                <div className="lg:col-span-4 space-y-6 min-w-0">
                    <Card className="rounded-3xl border-border/40 bg-primary/5 p-6 border-2 border-dashed min-w-0">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <p className="text-[11px] font-bold text-primary  tracking-widest leading-none">Procurement</p>
                                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                    Givar Management handles all vendor payments directly to maintain financial integrity.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-3xl border-border/40 shadow-sm bg-card overflow-hidden min-w-0">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
                            <CardTitle className="text-[11px] font-bold  tracking-widest text-muted-foreground flex items-center gap-2">
                                <Database className="h-3.5 w-3.5" /> Disbursement history
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3 min-w-0">
                            {project.disbursements?.length > 0 ? (
                                project.disbursements.map((d: any) => {
                                    const satisfactionStatus = d.satisfactionStatus || 'ACTION_REQUIRED';
                                    const isVerified = satisfactionStatus === 'VERIFIED';
                                    const isPendingAudit = satisfactionStatus === 'AUDITING';

                                    let bottomSection = (
                                        <div className={cn(
                                            "mt-2 -mx-4 -mb-4 px-4 py-3 border-t border-border/40 flex justify-between items-center",
                                            !isVerified && !isPendingAudit && "cursor-pointer hover:bg-primary/5 transition-all"
                                        )}>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold text-foreground truncate">
                                                    <span className="text-muted-foreground">Vendor:</span> {d.vendorName}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-bold  tracking-tighter truncate mt-0.5">
                                                    Phase: {timeline.find((m: any) => m.id === d.milestoneId)?.phase || 'General'}
                                                </p>
                                            </div>
                                            {!isVerified && !isPendingAudit && (
                                                <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                                            )}
                                        </div>
                                    );

                                    if (!isVerified && !isPendingAudit) {
                                        bottomSection = (
                                            <Link href={`?milestoneId=${d.milestoneId}#submit-evidence`} className="block">
                                                {bottomSection}
                                            </Link>
                                        );
                                    }

                                    return (
                                        <div key={d.id} className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-3 min-w-0 hover:border-primary/20 transition-all">
                                            <div className="flex justify-between items-start gap-2 min-w-0">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-primary  tracking-widest">Outflow</p>
                                                    <span className="text-[11px] font-mono text-muted-foreground">{formatDate(d.createdAt).split(',')[0]}</span>
                                                </div>

                                                {isVerified ? (
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-bold  h-5 px-1.5 rounded-3xl shrink-0">
                                                        <Check className="h-2 w-2 mr-1" /> Verified
                                                    </Badge>
                                                ) : isPendingAudit ? (
                                                    <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] font-bold  h-5 px-1.5 rounded-3xl shrink-0 animate-pulse">
                                                        <FileSearch className="h-2 w-2 mr-1" /> Audit
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[9px] font-bold  h-5 px-1.5 rounded-3xl shrink-0">
                                                        <AlertCircle className="h-2 w-2 mr-1" /> Required
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-end gap-4 min-w-0">
                                                <p className="text-base font-bold text-foreground tabular-nums truncate">
                                                    {formatCurrency(d.amount, project.currency)}
                                                </p>
                                                {d.receiptKey && (
                                                    <ReceiptButton receiptKey={d.receiptKey} projectId={project.id} className="h-7 px-3 rounded-xl border-border/40 text-[10px]" />
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
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            Vendor coordination issues? Contact Givar Compliance nodes directly via the support terminal.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}