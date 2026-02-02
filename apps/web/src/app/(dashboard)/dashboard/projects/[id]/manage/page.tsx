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
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { EvidenceSubmission } from '../../../../../../components/features/proposals/evidence-submission';
import { cn } from '../../../../../../lib/utils/cn';
import { formatCurrency, formatDate } from '../../../../../../lib/utils/format';
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
        <div className="max-w-6xl mx-auto space-y-8 pb-24">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <Link href="/dashboard/proposals">
                        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-xl">
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to My Causes
                        </Button>
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                        {project.title}
                    </h1>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] py-1 px-3 rounded-lg">
                            Management Console
                        </Badge>
                        {isFullyCompleted && (
                            <Badge className="bg-emerald-500 text-white font-bold text-[10px] uppercase rounded-lg">Project Completed</Badge>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* --- LEFT COLUMN: ACTION & ROADMAP --- */}
                <div className="lg:col-span-8 space-y-8">
                    {isRejected && (
                        <div className="p-5 rounded-[24px] bg-destructive/5 border border-destructive/20 flex items-start gap-4 animate-in slide-in-from-top-2 duration-500">
                            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                                <FileX className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-destructive uppercase tracking-tight">Evidence Rejected</h4>
                                <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                    &quot;{latestProof.adminFeedback}&quot;
                                </p>
                                <p className="text-xs text-muted-foreground pt-1 italic font-medium">
                                    Please review the feedback above and submit corrected evidence below.
                                </p>
                            </div>
                        </div>
                    )}
                    <div id="submit-evidence" />
                    {!isFullyCompleted && currentMilestone ? (
                        <div className={cn(
                            "group relative rounded-[32px] p-[1px] transition-all duration-300 shadow-2xl",
                            isRejected
                                ? "bg-gradient-to-br from-destructive/40 via-border/50 to-transparent shadow-destructive/5"
                                : "bg-gradient-to-br from-primary/30 via-border/50 to-transparent shadow-primary/5"
                        )}>
                            <Card className={cn(
                                "border-none backdrop-blur-xl rounded-[31px] overflow-hidden",
                                isRejected ? "bg-destructive/[0.01]" : "bg-card/50"
                            )}>
                                <CardHeader className="border-b border-border/50 p-6 md:p-8">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl font-bold flex items-center gap-3">
                                            <Camera className={cn("h-6 w-6", isRejected ? "text-destructive" : "text-primary")} />
                                            <span className="text-foreground">
                                                {isRejected ? 'Resubmit Evidence' : 'Post Impact Update'}
                                            </span>
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            {focusedMilestoneId && (
                                                <Link href={`/dashboard/projects/${id}/manage`}>
                                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground">Reset</Button>
                                                </Link>
                                            )}
                                            <Badge className={cn(
                                                "border-0 rounded-md py-1 px-3 font-bold",
                                                isRejected ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                                            )}>
                                                {currentMilestone.phase}
                                            </Badge>
                                        </div>
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
                        </div>
                    ) : isFullyCompleted ? (
                        <Card className="rounded-[32px] border-emerald-500/20 bg-emerald-500/[0.02] p-10 text-center border-2 border-dashed">
                            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">Mission Accomplished</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                                Every phase of this project has been executed and verified. Thank you for your incredible work on the ground.
                            </p>
                        </Card>
                    ) : null}
                    <Card className="rounded-[32px] border-border/50 bg-card/30 shadow-sm overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Execution Roadmap
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4">
                            <div className="space-y-8 relative">
                                <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-border hidden sm:block" />
                                {timeline.map((m: any, i: number) => {
                                    const isDone = m.status === 'COMPLETED';
                                    const isCurrent = m.id === currentMilestone?.id;
                                    return (
                                        <div key={i} className="flex gap-6 relative group">
                                            <div className="flex flex-col items-center shrink-0 relative z-10">
                                                <div className={cn(
                                                    "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-background",
                                                    isDone ? "bg-primary border-primary text-white" :
                                                        isCurrent ? "border-primary text-primary animate-pulse ring-4 ring-primary/10" :
                                                            "border-border text-muted-foreground"
                                                )}>
                                                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                                                </div>
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <h4 className={cn("font-bold text-sm", isDone || isCurrent ? "text-foreground" : "text-muted-foreground")}>
                                                        {m.phase}
                                                    </h4>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] uppercase font-black px-2 rounded-md",
                                                        isDone ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-muted-foreground"
                                                    )}>
                                                        {m.status?.replace('_', ' ') || 'PENDING'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.deliverables}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* --- RIGHT COLUMN: FINANCIALS --- */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-[28px] border-border/50 bg-primary/5 p-6 border-2 border-dashed">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-primary uppercase tracking-tighter">Direct Procurement Mode</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Givar Management handles all vendor payments directly. Your role is to verify deliveries.
                                </p>
                                <p>
                                    <span className="text-[11px] italic font-bold text-muted-foreground leading-relaxed">Note:</span>
                                    <span className="text-[11px] italic text-muted-foreground leading-relaxed"> Verification of each phase is a prerequisite for subsequent funding tranches.</span>
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="rounded-[28px] border-border/50 shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-muted/40 border-b border-border/50 py-4 px-6">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Database className="h-4 w-4" /> Disbursement History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {project.disbursements?.length > 0 ? (
                                project.disbursements.map((d: any) => {
                                    const satisfactionStatus = d.satisfactionStatus || 'ACTION_REQUIRED';
                                    const isVerified = satisfactionStatus === 'VERIFIED';
                                    const isPendingAudit = satisfactionStatus === 'AUDITING';
                                    let bottomSection = (
                                        <div
                                            className={cn(
                                                "mt-2 -mx-4 -mb-4 px-4 py-3 border-t border-border/50",
                                                "flex justify-between items-center",
                                                !isVerified && !isPendingAudit &&
                                                "cursor-pointer hover:bg-primary/5 transition-colors"
                                            )}
                                        >

                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-medium text-foreground truncate">
                                                    <span className="text-muted-foreground">Vendor:</span> {d.vendorName}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter truncate mt-1">
                                                    Phase: {timeline.find((m: any) => m.id === d.milestoneId)?.phase || 'General'}
                                                </p>
                                            </div>
                                            {!isVerified && !isPendingAudit && (
                                                <ChevronRight className="h-4 w-4 text-primary" />
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
                                        <div key={d.id} className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-3 hover:bg-muted/30 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black text-primary uppercase tracking-tight">Payment Disbursed</p>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{formatDate(d.createdAt).split(',')[0]}</span>
                                                </div>
                                                {isVerified ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black uppercase h-5 px-2 rounded-md flex gap-1 items-center shadow-none">
                                                        <Check className="h-2.5 w-2.5" /> Verified
                                                    </Badge>
                                                ) : isPendingAudit ? (
                                                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[8px] font-black uppercase h-5 px-2 rounded-md flex gap-1 items-center animate-pulse shadow-none">
                                                        <FileSearch className="h-2.5 w-2.5" /> Auditing
                                                    </Badge>
                                                ) : (
                                                    <Link href={`?milestoneId=${d.milestoneId}#submit-evidence`} className="block">
                                                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px] font-black uppercase h-5 px-2 rounded-md flex gap-1 items-center hover:bg-amber-500/20 transition-colors cursor-pointer shadow-none">
                                                            <AlertCircle className="h-2.5 w-2.5" /> Action Required
                                                        </Badge>
                                                    </Link>
                                                )}
                                            </div>
                                            <p className="text-lg font-bold text-foreground tabular-nums">
                                                {formatCurrency(d.amount, project.currency)}
                                            </p>
                                            {bottomSection}
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-10">
                                    <Clock className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                    <p className="text-xs text-muted-foreground italic">Awaiting first disbursement from Givar treasury.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <div className="p-6 rounded-[28px] bg-secondary/30 border border-border/50 flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Need help with vendor coordination? Contact Givar Support directly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}